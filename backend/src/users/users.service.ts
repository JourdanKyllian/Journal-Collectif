import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
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

  /**
   * Vérifie les limites de création pour chaque rôle spécifique.
   */
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

  /**
   * Crée un utilisateur en vérifiant au préalable les limites du rôle.
   */
  async create(createUserDto: CreateUserDto, roleName: string = 'admin') {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    const role = await this.roleRepository.findOne({
      where: { libelle: roleName },
    });
    if (!role)
      throw new NotFoundException(`Le rôle ${roleName} est introuvable`);

    // 👉 Vérification stricte des limites avant l'insertion
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
    });
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}
