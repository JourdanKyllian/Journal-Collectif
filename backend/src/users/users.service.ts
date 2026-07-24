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

  async create(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    const adminRole = await this.roleRepository.findOne({
      where: { libelle: 'Admin' },
    });
    if (!adminRole)
      throw new NotFoundException('Le rôle Admin est introuvable');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // CRÉATION SÉPARÉE : Le User d'un côté, le Profile de l'autre
    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      role: adminRole, // LE RÔLE EST VERROUILLÉ
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
      relations: ['role', 'profile'], // On charge le profil pour l'affichage Admin
    });
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}
