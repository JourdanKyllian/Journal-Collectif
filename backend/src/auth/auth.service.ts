import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Identifiants invalides');

    const roleName = user.role?.libelle;
    const payload = { sub: user.id, email: user.email, role: roleName };

    const isUserAdmin = roleName === 'Admin';
    const accessTokenExpiresIn = isUserAdmin ? '15m' : '1h';
    const refreshTokenExpiresIn = isUserAdmin ? '8h' : '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.usersRepository.update(user.id, {
      token_auth: hashedRefreshToken,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const userExists = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });
    if (userExists) throw new ConflictException('Cet email est déjà utilisé');

    const userRole = await this.roleRepository.findOne({
      where: { libelle: 'utilisateur' },
    });
    if (!userRole)
      throw new NotFoundException("Le rôle par défaut n'existe pas en base");

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      lastname: registerDto.lastname || null,
      firstname: registerDto.firstname || null,
      tel: registerDto.tel || null,
      role: userRole,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser;

    return userWithoutPassword;
  }

  async refreshToken(refreshToken: string) {
    try {
      // 💡 TYPAGE FORT ICI : On dit à verifyAsync ce qu'il va nous renvoyer
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
        role: string;
      }>(refreshToken);

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });

      if (!user || !user.token_auth) {
        throw new UnauthorizedException('Accès refusé');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.token_auth);
      if (!isMatch) {
        throw new UnauthorizedException('Accès refusé');
      }

      const roleName = user.role?.libelle;
      const newPayload = { sub: user.id, email: user.email, role: roleName };

      const isUserAdmin = roleName === 'Admin';
      const accessTokenExpiresIn = isUserAdmin ? '15m' : '1h';
      const refreshTokenExpiresIn = isUserAdmin ? '8h' : '7d';

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: accessTokenExpiresIn,
      });
      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: refreshTokenExpiresIn,
      });

      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.usersRepository.update(user.id, {
        token_auth: hashedRefreshToken,
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException(
        'Refresh token invalide ou expiré. Veuillez vous reconnecter.',
      );
    }
  }

  async logout(userId: number) {
    await this.usersRepository.update(userId, {
      token_auth: null,
    });

    return {
      message: 'Déconnexion réussie.',
      instruction:
        'Le frontend doit maintenant supprimer les tokens de son stockage local.',
    };
  }
}
