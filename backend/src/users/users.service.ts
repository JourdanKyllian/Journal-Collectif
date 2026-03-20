import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Users } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    // 1. On force la recherche du rôle Admin
    const adminRole = await this.roleRepository.findOne({ where: { libelle: 'Admin' } });
    if (!adminRole) throw new NotFoundException('Le rôle Admin est introuvable');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      lastname: createUserDto.lastname,
      firstname: createUserDto.firstname,
      email: createUserDto.email,
      password: hashedPassword,
      tel: createUserDto.tel || null,
      role: adminRole, // LE RÔLE EST VERROUILLÉ ICI
      is_phone_verified: false,
    });

    const savedUser = await this.usersRepository.save(newUser);
    const { password, ...userWithoutPassword } = savedUser;
    
    return savedUser;
  }
}