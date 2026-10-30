import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { MembershipService, CITIZEN_ROLE } from '../tenant/membership.service';
import { TenantContext } from '../tenant/tenant.context';
import {
  buildPaginated,
  escapeLike,
  toSkipTake,
} from '../common/pagination/pagination';

/** Retire du résultat le mot de passe haché. */
function toPublicUser(user: Users) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = user;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly memberships: MembershipService,
    private readonly tenant: TenantContext,
  ) {}

  /** Les limites s'appliquent par journal : chaque journal a son super admin, ses admins, ses rédacteurs. */
  private async checkRoleLimits(roleLibelle: string) {
    const count = await this.memberships.countByRole(
      this.tenant.journalId,
      roleLibelle,
    );

    if (roleLibelle === 'super_admin' && count >= 1) {
      throw new ConflictException(
        'Limite atteinte : 1 seul super administrateur autorisé.',
      );
    }
    if (roleLibelle === 'admin' && count >= 5) {
      throw new ConflictException(
        'Limite atteinte : 5 administrateurs maximum.',
      );
    }
    if (roleLibelle === 'redacteur' && count >= 10) {
      throw new ConflictException('Limite atteinte : 10 rédacteurs maximum.');
    }
  }

  /**
   * Charge un compte, à condition qu'il appartienne au journal courant. Un compte d'un autre
   * journal est « introuvable » : un admin ne peut ni le lire, ni le modifier, ni le supprimer.
   */
  private async loadVisible(id: number, relations: string[]): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    if (
      !user ||
      !(await this.memberships.isVisibleIn(id, this.tenant.journal))
    ) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  /** Rôle du compte dans le journal courant, sous forme d'entité (même forme qu'avant le multi-tenant). */
  private async effectiveRole(user: Users): Promise<Role | undefined> {
    const { role } = await this.memberships.resolveRole(
      user.id,
      user.role?.libelle,
      this.tenant.journal,
    );
    return (
      (await this.roleRepository.findOne({ where: { libelle: role } })) ??
      user.role
    );
  }

  async create(createUserDto: CreateUserDto, targetRole: string) {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    const role = await this.roleRepository.findOne({
      where: { libelle: targetRole },
    });
    if (!role)
      throw new NotFoundException(`Le rôle ${targetRole} est introuvable`);
    const citizenRole = await this.roleRepository.findOne({
      where: { libelle: CITIZEN_ROLE },
    });

    await this.checkRoleLimits(role.libelle);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      // Rôle global minimal : les droits viennent de l'adhésion au journal.
      role: citizenRole ?? role,
      is_phone_verified: false,
      profile: {
        lastname: createUserDto.lastname,
        firstname: createUserDto.firstname,
        tel: createUserDto.tel || null,
      },
    });

    const saved = await this.usersRepository.save(newUser);
    await this.memberships.upsert(
      saved.id,
      this.tenant.journalId,
      role.libelle,
    );
    return { ...toPublicUser(saved), role };
  }

  /** Les comptes du journal courant, avec leur rôle dans ce journal. */
  async findAll(query: UserListQueryDto) {
    const journal = this.tenant.journal;

    const qb = this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .leftJoinAndSelect('u.profile', 'profile');
    this.memberships.scopeUsers(qb, 'u', journal);

    if (query.q) {
      qb.andWhere(
        '(u.email ILIKE :q OR profile.firstname ILIKE :q OR profile.lastname ILIKE :q)',
        { q: `%${escapeLike(query.q)}%` },
      );
    }

    const { skip, take } = toSkipTake(query);
    const [users, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .addOrderBy('u.id', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const ids = users.map((user) => user.id);
    const explicit = await this.memberships.rolesOf(ids, journal.id);
    const isDefault = this.memberships.isDefaultJournal(journal);
    const withAny = isDefault
      ? await this.memberships.withAnyMembership(ids)
      : new Set<number>();
    const citizenRole = await this.roleRepository.findOne({
      where: { libelle: CITIZEN_ROLE },
    });

    return buildPaginated(
      users.map((user) => ({
        ...toPublicUser(user),
        role:
          explicit.get(user.id) ??
          (isDefault && !withAny.has(user.id)
            ? user.role // compte antérieur au multi-tenant : son rôle global vaut pour le journal historique
            : citizenRole),
      })),
      total,
      query,
    );
  }

  // --- MODIFICATION D'UN UTILISATEUR ---
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserRole: string,
    currentUserId: number,
  ) {
    const user = await this.loadVisible(id, ['role', 'profile']);

    const currentRole = await this.effectiveRole(user);
    const targetRole = currentRole?.libelle || CITIZEN_ROLE;
    const isSelf = id === currentUserId; // <-- Est-ce qu'on s'édite soi-même ?

    // Sécurité Hiérarchique (Exception pour isSelf)
    if (
      currentUserRole === 'admin' &&
      (targetRole === 'super_admin' || targetRole === 'admin') &&
      !isSelf
    ) {
      throw new ForbiddenException(
        'Un administrateur ne peut modifier que des rédacteurs.',
      );
    }

    // Mise à jour du rôle (dans ce journal uniquement) si demandé
    let newRole: Role | undefined;
    if (updateUserDto.role) {
      const isSelfKeepingAdmin = isSelf && updateUserDto.role === 'admin';

      if (
        currentUserRole === 'admin' &&
        ['super_admin', 'admin'].includes(updateUserDto.role) &&
        !isSelfKeepingAdmin // On le laisse faire si c'est juste le formulaire qui renvoie "admin"
      ) {
        throw new ForbiddenException(
          'Un administrateur ne peut attribuer que le rôle rédacteur.',
        );
      }
      newRole = await this.memberships.upsert(
        user.id,
        this.tenant.journalId,
        updateUserDto.role,
      );
    }

    // Mise à jour du profil (Le reste du code ne change pas)
    if (user.profile) {
      if (updateUserDto.firstname)
        user.profile.firstname = updateUserDto.firstname;
      if (updateUserDto.lastname)
        user.profile.lastname = updateUserDto.lastname;
      if (updateUserDto.tel) {
        // Un nouveau numéro doit être revérifié.
        if (updateUserDto.tel !== user.profile.tel) {
          user.is_phone_verified = false;
        }
        user.profile.tel = updateUserDto.tel;
      }
    }

    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const saved = await this.usersRepository.save(user);
    return { ...toPublicUser(saved), role: newRole ?? currentRole };
  }

  /**
   * Vérifie (ou retire la vérification d') un compte citoyen. Étape manuelle en attendant
   * la vérification par code SMS.
   */
  async setPhoneVerified(id: number, verified: boolean) {
    const user = await this.loadVisible(id, ['role', 'profile']);

    user.is_phone_verified = verified;
    const saved = await this.usersRepository.save(user);
    return { ...toPublicUser(saved), role: await this.effectiveRole(user) };
  }

  /**
   * Retire un compte du journal courant. Le compte lui-même n'est supprimé que s'il
   * n'appartient plus à aucun journal : un compte partagé avec un autre journal survit.
   */
  async remove(id: number, currentUserRole: string, currentUserId: number) {
    const userToDelete = await this.loadVisible(id, ['role']);
    if (userToDelete.id === currentUserId)
      throw new ConflictException(
        'Vous ne pouvez pas vous supprimer vous-même.',
      );

    const targetRole =
      (await this.effectiveRole(userToDelete))?.libelle || CITIZEN_ROLE;

    if (targetRole === 'super_admin') {
      throw new ForbiddenException(
        'Le super administrateur ne peut pas être supprimé.',
      );
    }

    // Seul le super_admin peut supprimer un admin
    if (currentUserRole === 'admin' && targetRole === 'admin') {
      throw new ForbiddenException(
        'Un administrateur ne peut supprimer que des rédacteurs.',
      );
    }

    await this.memberships.remove(userToDelete.id, this.tenant.journalId);

    const stillBelongsElsewhere =
      (await this.memberships.hasAnyMembership(userToDelete.id)) ||
      userToDelete.is_platform_admin;
    if (stillBelongsElsewhere) return toPublicUser(userToDelete);

    return this.usersRepository.softRemove(userToDelete);
  }
}
