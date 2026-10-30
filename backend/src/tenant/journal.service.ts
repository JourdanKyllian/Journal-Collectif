import { randomBytes } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/roles.entity';
import { Users } from '../users/entities/user.entity';
import {
  buildPaginated,
  escapeLike,
  toSkipTake,
} from '../common/pagination/pagination';
import { Commune } from './entities/commune.entity';
import { Journal } from './entities/journal.entity';
import { JournalMember } from './entities/journal-member.entity';
import { JournalListQueryDto } from './dto/journal-list-query.dto';
import { ProvisionJournalDto } from './dto/provision-journal.dto';
import { CITIZEN_ROLE } from './membership.service';
import { TenantContext } from './tenant.context';
import {
  defaultJournalSlug,
  JournalStatut,
  RESERVED_SLUGS,
} from './tenant.constants';

const PUBLIC_COMMUNE = (commune: Commune) => ({
  nom: commune.nom,
  code_insee: commune.code_insee,
  code_postal: commune.code_postal,
});

/** Vue publique d'un journal : jamais d'e-mail ni de téléphone ici, ils sont dans `/settings`. */
export function toPublicJournal(journal: Journal) {
  return {
    id: journal.id,
    slug: journal.slug,
    nom_journal: journal.nom_journal,
    type_journal: journal.type_journal,
    nom_ville: journal.nom_ville,
    statut: journal.statut,
    communes: (journal.communes ?? []).map(PUBLIC_COMMUNE),
  };
}

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Journal)
    private readonly journals: Repository<Journal>,
    @InjectRepository(JournalMember)
    private readonly members: Repository<JournalMember>,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly tenant: TenantContext,
  ) {}

  /**
   * Journal visé par une requête : `X-Journal` / `?journal=` (slug ou id), sinon le journal
   * historique, pour que les clients existants continuent de fonctionner sans changement.
   */
  async resolve(raw?: string): Promise<Journal> {
    const value = raw?.trim();

    if (!value) {
      const journal = await this.journals.findOneBy({
        slug: defaultJournalSlug(),
      });
      if (!journal) {
        throw new ServiceUnavailableException(
          'Journal par défaut introuvable : les migrations ont-elles été exécutées ?',
        );
      }
      return journal;
    }

    if (value.length > 63) throw new NotFoundException('Journal introuvable.');
    const journal = await this.journals.findOneBy(
      /^\d{1,9}$/.test(value)
        ? { id: Number(value) }
        : { slug: value.toLowerCase() },
    );
    if (!journal) throw new NotFoundException('Journal introuvable.');
    return journal;
  }

  private defaultId?: number;

  /** Identifiant du journal historique (mis en cache : il ne change jamais). */
  async defaultJournalId(): Promise<number> {
    if (this.defaultId === undefined) {
      this.defaultId = (await this.resolve()).id;
    }
    return this.defaultId;
  }

  /** Le journal courant, relu en base (le contexte porte un instantané du début de requête). */
  async current(): Promise<Journal> {
    return this.journals.findOneOrFail({
      where: { id: this.tenant.journalId },
      relations: ['communes'],
    });
  }

  /**
   * Appelé quand un compte change son mot de passe : lève l'obligation de le changer et,
   * si c'est le super admin d'un journal en configuration, ouvre ce journal au public.
   */
  async onPasswordChanged(userId: number): Promise<void> {
    await this.users.update(
      { id: userId, must_change_password: true },
      { must_change_password: false },
    );

    const journal = this.tenant.tryGet();
    if (!journal || journal.statut !== JournalStatut.EN_CONFIGURATION) return;

    const membership = await this.members.findOne({
      where: { userId, journalId: journal.id },
      relations: ['role'],
    });
    if (membership?.role.libelle === 'super_admin') {
      await this.journals.update(journal.id, { statut: JournalStatut.ACTIF });
    }
  }

  /** Annuaire public : uniquement les journaux actifs. */
  async directory(query: JournalListQueryDto) {
    const qb = this.journals
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.communes', 'c')
      .where('j.statut = :actif', { actif: JournalStatut.ACTIF })
      .orderBy('j.nom_journal', 'ASC')
      .addOrderBy('j.id', 'ASC');

    if (query.q) {
      qb.andWhere(
        '(j.nom_journal ILIKE :q OR j.nom_ville ILIKE :q OR j.slug ILIKE :q)',
        { q: `%${escapeLike(query.q)}%` },
      );
    }
    if (query.commune) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM journal_commune jc JOIN commune cc ON cc.id = jc.commune_id
                 WHERE jc.journal_id = j.id AND (cc.code_insee = :insee OR cc.nom ILIKE :commune))`,
        {
          insee: query.commune.toUpperCase(),
          commune: `%${escapeLike(query.commune)}%`,
        },
      );
    }
    if (query.code_postal) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM journal_commune jc2 JOIN commune c2 ON c2.id = jc2.commune_id
                 WHERE jc2.journal_id = j.id AND c2.code_postal = :cp)`,
        { cp: query.code_postal },
      );
    }

    const { skip, take } = toSkipTake(query);
    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return buildPaginated(rows.map(toPublicJournal), total, query);
  }

  /**
   * Crée un journal en configuration, ses communes et son super admin initial.
   * Le journal reste invisible du public jusqu'au premier changement de mot de passe de ce compte.
   */
  async provision(dto: ProvisionJournalDto) {
    if (RESERVED_SLUGS.includes(dto.slug)) {
      throw new ConflictException(`Le slug « ${dto.slug} » est réservé.`);
    }
    if (await this.journals.exists({ where: { slug: dto.slug } })) {
      throw new ConflictException(`Le slug « ${dto.slug} » est déjà utilisé.`);
    }

    return this.journals.manager.transaction(async (em) => {
      const superAdminRole = await em.findOne(Role, {
        where: { libelle: 'super_admin' },
      });
      const citizenRole = await em.findOne(Role, {
        where: { libelle: CITIZEN_ROLE },
      });
      if (!superAdminRole || !citizenRole) {
        throw new ServiceUnavailableException(
          'Les rôles de base sont absents : exécutez le seed des rôles.',
        );
      }

      const communes: Commune[] = [];
      for (const input of dto.communes) {
        const existing = await em.findOne(Commune, {
          where: { code_insee: input.code_insee },
        });
        communes.push(
          existing ??
            (await em.save(
              em.create(Commune, {
                nom: input.nom,
                code_insee: input.code_insee,
                code_postal: input.code_postal,
              }),
            )),
        );
      }

      const journal = await em.save(
        em.create(Journal, {
          slug: dto.slug,
          nom_journal: dto.nom_journal,
          type_journal: dto.type_journal ?? 'Journal',
          nom_ville: dto.nom_ville,
          email_contact: dto.email_contact ?? '',
          tel_contact: dto.tel_contact ?? '',
          description_footer: dto.description_footer ?? '',
          statut: JournalStatut.EN_CONFIGURATION,
          communes,
        }),
      );

      const input = dto.super_admin;
      let user = await em.findOne(Users, { where: { email: input.email } });
      const created = !user;
      let temporaryPassword: string | undefined;

      if (!user) {
        const plain =
          input.password ?? `Tmp-${randomBytes(15).toString('base64url')}`;
        if (!input.password) temporaryPassword = plain;
        user = await em.save(
          em.create(Users, {
            email: input.email,
            password: await bcrypt.hash(plain, 10),
            role: citizenRole, // rôle global minimal : ses droits viennent de l'adhésion
            is_phone_verified: true,
            profile: {
              firstname: input.firstname,
              lastname: input.lastname,
              tel: null,
            },
          }),
        );
      }

      // Initial super admin : obligé de changer son mot de passe, ce qui ouvre le journal.
      await em.update(Users, user.id, { must_change_password: true });
      await em.save(
        em.create(JournalMember, {
          userId: user.id,
          journalId: journal.id,
          roleId: superAdminRole.id,
        }),
      );

      return {
        journal: toPublicJournal({ ...journal, communes }),
        super_admin: {
          id: user.id,
          email: user.email,
          created,
          // Renvoyé une seule fois, jamais stocké en clair.
          ...(temporaryPassword
            ? { temporary_password: temporaryPassword }
            : {}),
        },
      };
    });
  }

  async setStatut(
    slug: string,
    statut: JournalStatut.ACTIF | JournalStatut.MAINTENANCE,
  ) {
    const journal = await this.journals.findOne({
      where: { slug: slug.toLowerCase() },
      relations: ['communes'],
    });
    if (!journal) throw new NotFoundException('Journal introuvable.');
    journal.statut = statut;
    await this.journals.save({ id: journal.id, statut });
    return toPublicJournal(journal);
  }
}
