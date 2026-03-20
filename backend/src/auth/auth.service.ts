import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../role/entities/role.entity'; // Ne pas oublier d'importer l'entité Role

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>, // On a besoin d'accéder aux rôles
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersRepository.findOne({ where: { email }, relations: ['role'] });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Identifiants invalides');

    const payload = { sub: user.id, email: user.email, role: user.role?.libelle };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  // NOUVELLE MÉTHODE : L'inscription publique
  async register(registerDto: RegisterDto) {
    const userExists = await this.usersRepository.findOne({ where: { email: registerDto.email } });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    // 1. On cherche obligatoirement le rôle "utilisateur" (ou "User" selon ta BDD)
    const userRole = await this.roleRepository.findOne({ where: { libelle: 'utilisateur' } });
    if (!userRole) throw new NotFoundException('Le rôle par défaut n\'existe pas en base');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 2. Création avec les champs optionnels et le rôle forcé
    const newUser = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      lastname: registerDto.lastname || null,
      firstname: registerDto.firstname || null,
      tel: registerDto.tel || null,
      role: userRole, // LE RÔLE EST VERROUILLÉ ICI
    });

    const savedUser = await this.usersRepository.save(newUser);
    const { password, ...userWithoutPassword } = savedUser; // On ne renvoie pas le mot de passe
    
    return savedUser;
  }
}