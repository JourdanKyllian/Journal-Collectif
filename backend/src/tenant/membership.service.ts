import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Role } from '../roles/entities/roles.entity';
import { Journal } from './entities/journal.entity';
import { JournalMember } from './entities/journal-member.entity';
import { defaultJournalSlug } from './tenant.constants';

export const CITIZEN_ROLE = 'utilisateur';

/**
 * Habilitations d'un compte dans un journal.
 *
 * Règle de résolution du rôle :
 * 1. l'adhésion (`journal_member`) du compte à ce journal ;
 * 2. sinon, dans le journal historique uniquement, le rôle global `users.role` d'un compte
 *    sans aucune adhésion (comptes antérieurs au multi-tenant) ;
 * 3. sinon, simple citoyen. Un rôle global ne déborde jamais sur un autre journal.
 */
@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(JournalMember)
    private readonly members: Repository<JournalMember>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  isDefaultJournal(journal: Journal): boolean {
    return journal.slug === defaultJournalSlug();
  }

  async resolveRole(
    userId: number,
    globalRole: string | undefined,
    journal: Journal,
  ): Promise<{ role: string; isMember: boolean }> {
    const membership = await this.members.findOne({
      where: { userId, journalId: journal.id },
      relations: ['role'],
    });
    if (membership) return { role: membership.role.libelle, isMember: true };

    if (
      this.isDefaultJournal(journal) &&
      !(await this.hasAnyMembership(userId))
    ) {
      return { role: globalRole ?? CITIZEN_ROLE, isMember: true };
    }
    return { role: CITIZEN_ROLE, isMember: false };
  }

  async hasAnyMembership(userId: number): Promise<boolean> {
    return (await this.members.count({ where: { userId } })) > 0;
  }

  /** Le compte appartient-il à ce journal (adhésion, ou compte historique du journal par défaut) ? */
  async isVisibleIn(userId: number, journal: Journal): Promise<boolean> {
    return (await this.resolveRole(userId, undefined, journal)).isMember;
  }

  /** Crée ou change le rôle d'un compte dans un journal. */
  async upsert(
    userId: number,
    journalId: number,
    roleLibelle: string,
  ): Promise<Role> {
    const role = await this.roles.findOne({ where: { libelle: roleLibelle } });
    if (!role)
      throw new NotFoundException(`Le rôle ${roleLibelle} est introuvable`);

    const existing = await this.members.findOne({
      where: { userId, journalId },
    });
    if (existing) {
      existing.roleId = role.id;
      existing.role = role;
      await this.members.save(existing);
    } else {
      await this.members.save(
        this.members.create({ userId, journalId, roleId: role.id }),
      );
    }
    return role;
  }

  async remove(userId: number, journalId: number): Promise<void> {
    await this.members.delete({ userId, journalId });
  }

  countByRole(journalId: number, libelle: string): Promise<number> {
    return this.members.count({ where: { journalId, role: { libelle } } });
  }

  /** Rôles explicites des comptes donnés dans ce journal. */
  async rolesOf(
    userIds: number[],
    journalId: number,
  ): Promise<Map<number, Role>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.members
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.role', 'role')
      .where('m.journal_id = :journalId AND m.user_id IN (:...userIds)', {
        journalId,
        userIds,
      })
      .getMany();
    return new Map(rows.map((row) => [row.userId, row.role]));
  }

  /** Parmi ces comptes, ceux qui ont au moins une adhésion quelque part. */
  async withAnyMembership(userIds: number[]): Promise<Set<number>> {
    if (userIds.length === 0) return new Set();
    const rows = await this.members
      .createQueryBuilder('m')
      .select('DISTINCT m.user_id', 'userId')
      .where('m.user_id IN (:...userIds)', { userIds })
      .getRawMany<{ userId: number }>();
    return new Set(rows.map((row) => Number(row.userId)));
  }

  /**
   * Restreint une requête sur `users` aux comptes de ce journal : ses membres et, pour le
   * journal historique, les comptes antérieurs au multi-tenant (sans aucune adhésion).
   */
  scopeUsers<T extends object>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    journal: Journal,
  ): SelectQueryBuilder<T> {
    const member = `EXISTS (SELECT 1 FROM journal_member jm WHERE jm.user_id = ${alias}.id AND jm.journal_id = :scopeJournalId)`;
    const legacy = `NOT EXISTS (SELECT 1 FROM journal_member jm2 WHERE jm2.user_id = ${alias}.id)`;
    return qb.andWhere(
      this.isDefaultJournal(journal) ? `(${member} OR ${legacy})` : member,
      { scopeJournalId: journal.id },
    );
  }
}
