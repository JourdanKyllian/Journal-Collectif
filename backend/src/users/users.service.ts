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

    const savedUser = await this.usersRepository.save(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.usersRepository.find({
      relations: ['role', 'profile'],
      order: { created_at: 'DESC' },
    });
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  // --- MODIFICATION D'UN UTILISATEUR ---
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserRole: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'profile'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const targetRole = user.role?.libelle || 'utilisateur';

    // Sécurité Hiérarchique
    if (
      currentUserRole === 'admin' &&
      (targetRole === 'super_admin' || targetRole === 'admin')
    ) {
      throw new ForbiddenException(
        'Un administrateur ne peut modifier que des rédacteurs.',
      );
    }

    // Mise à jour du rôle si demandé
    if (updateUserDto.role) {
      if (
        currentUserRole === 'admin' &&
        ['super_admin', 'admin'].includes(updateUserDto.role)
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

    // Mise à jour du profil
    if (user.profile) {
      if (updateUserDto.firstname)
        user.profile.firstname = updateUserDto.firstname;
      if (updateUserDto.lastname)
        user.profile.lastname = updateUserDto.lastname;
      if (updateUserDto.tel) user.profile.tel = updateUserDto.tel;
    }

    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const savedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = savedUser;
    return result;
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
