import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import { UserListQueryDto } from './dto/user-list-query.dto';
import {
  buildPaginated,
  escapeLike,
  toSkipTake,
} from '../common/pagination/pagination';

/** Retire du résultat tout ce qui est secret : mot de passe haché et jeton de rafraîchissement haché. */
function toPublicUser(user: Users) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, token_auth, ...safe } = user;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  private async checkRoleLimits(roleLibelle: string) {
    const count = await this.usersRepository.count({
      where: { role: { libelle: roleLibelle } },
    });

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

    await this.checkRoleLimits(role.libelle);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      role: role,
      is_phone_verified: false,
      profile: {
        lastname: createUserDto.lastname,
        firstname: createUserDto.firstname,
        tel: createUserDto.tel || null,
      },
    });

    return toPublicUser(await this.usersRepository.save(newUser));
  }

  async findAll(query: UserListQueryDto) {
    let where: FindOptionsWhere<Users>[] | undefined;
    if (query.q) {
      const pattern = ILike(`%${escapeLike(query.q)}%`);
      where = [
        { email: pattern },
        { profile: { firstname: pattern } },
        { profile: { lastname: pattern } },
      ];
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      relations: ['role', 'profile'],
      order: { created_at: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });

    return buildPaginated(users.map(toPublicUser), total, query);
  }

  // --- MODIFICATION D'UN UTILISATEUR ---
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserRole: string,
    currentUserId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'profile'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const targetRole = user.role?.libelle || 'utilisateur';
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

    // Mise à jour du rôle si demandé
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
      const newRole = await this.roleRepository.findOne({
        where: { libelle: updateUserDto.role },
      });
      if (newRole) user.role = newRole;
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

    return toPublicUser(await this.usersRepository.save(user));
  }

  /**
   * Vérifie (ou retire la vérification d') un compte citoyen. Étape manuelle en attendant
   * la vérification par code SMS.
   */
  async setPhoneVerified(id: number, verified: boolean) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'profile'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    user.is_phone_verified = verified;
    return toPublicUser(await this.usersRepository.save(user));
  }

  // --- SUPPRESSION D'UN UTILISATEUR ---
  async remove(id: number, currentUserRole: string, currentUserId: number) {
    const userToDelete = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!userToDelete) throw new NotFoundException('Utilisateur introuvable');
    if (userToDelete.id === currentUserId)
      throw new ConflictException(
        'Vous ne pouvez pas vous supprimer vous-même.',
      );

    const targetRole = userToDelete.role?.libelle || 'utilisateur';

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

    return this.usersRepository.softRemove(userToDelete);
  }
}
