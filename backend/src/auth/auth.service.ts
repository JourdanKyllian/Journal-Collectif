import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // 1. On cherche l'utilisateur par son email (et on récupère son rôle avec)
    const user = await this.usersRepository.findOne({ 
      where: { email },
      relations: ['role'] 
    });

    // 2. Si pas d'utilisateur, on jette une erreur 401
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // 3. On compare le mot de passe envoyé avec le hash en base
    const isMatch = await bcrypt.compare(pass, user.password);
    
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // 4. Si tout est bon, on prépare le contenu du Token (le Payload)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role?.libelle 
    };

    // 5. On retourne le token signé
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}