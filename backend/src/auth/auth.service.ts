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
import { Role } from '../roles/entities/roles.entity';

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

    // Vérifie si l'utilisateur fait partie de l'administration
    const isStaff = ['super_admin', 'admin', 'redacteur'].includes(roleName);
    const accessTokenExpiresIn = isStaff ? '15m' : '1h';
    const refreshTokenExpiresIn = isStaff ? '8h' : '7d';

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
      role: userRole,
      profile: {
        lastname: registerDto.lastname || null,
        firstname: registerDto.firstname || null,
        tel: registerDto.tel || null,
      },
    });

    const savedUser = await this.usersRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser;

    return userWithoutPassword;
  }

  async refreshToken(refreshToken: string) {
    try {
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

      const isStaff = ['super_admin', 'admin', 'redacteur'].includes(roleName);
      const accessTokenExpiresIn = isStaff ? '15m' : '1h';
      const refreshTokenExpiresIn = isStaff ? '8h' : '7d';

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

  /**
   * Récupère les données agrégées de l'utilisateur connecté (Auth + Profile).
   *
   * @param {number} userId - L'identifiant de l'utilisateur.
   * @returns Les informations de profil formatées pour le client.
   * @throws {NotFoundException} Si l'utilisateur est introuvable.
   */
  async getMe(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'profile'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role?.libelle || 'utilisateur', // <-- On renvoie le vrai nom du rôle
      firstname: user.profile?.firstname || null,
      lastname: user.profile?.lastname || null,
      avatar_ref: user.profile?.avatar_ref || 'default_01',
      bio: user.profile?.bio || null,
      tel: user.profile?.tel || null,
    };
  }

  /**
   * Met à jour les informations de sécurité sensibles (Email / Mot de passe).
   * Exige le mot de passe actuel pour validation.
   */
  async updateSecurity(
    userId: number,
    dto: import('./dto/update-security.dto').UpdateSecurityDto,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // 1. Vérification stricte de l'ancien mot de passe
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');

    let hasChanges = false;

    // 2. Traitement du nouvel email
    if (dto.newEmail && dto.newEmail !== user.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: dto.newEmail },
      });
      if (emailExists)
        throw new ConflictException(
          'Cet email est déjà utilisé par un autre compte.',
        );
      user.email = dto.newEmail;
      hasChanges = true;
    }

    // 3. Traitement du nouveau mot de passe
    if (dto.newPassword) {
      user.password = await bcrypt.hash(dto.newPassword, 10);
      hasChanges = true;
    }

    if (hasChanges) {
      await this.usersRepository.save(user);
    }

    return { message: 'Paramètres de sécurité mis à jour avec succès.' };
  }
}
