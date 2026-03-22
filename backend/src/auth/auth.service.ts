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

    const roleName = user.role?.libelle;
    const payload = { sub: user.id, email: user.email, role: roleName };

    // Définit les durées en fonction du rôle
    const isUserAdmin = roleName === 'Admin';
    const accessTokenExpiresIn = isUserAdmin ? '15m' : '1h';
    const refreshTokenExpiresIn = isUserAdmin ? '8h' : '7d';

    // Génère les deux tokens
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: accessTokenExpiresIn });
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: refreshTokenExpiresIn });

    // Hashe le Refresh Token avant de sauvegarder en BDD 
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    
    await this.usersRepository.update(user.id, {
      token_auth: hashedRefreshToken
    });

    // Renvoie les deux tokens au front
    return { 
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

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

  async refreshToken(refreshToken: string) {
    try {
      // 1. On vérifie si le token est mathématiquement valide et non expiré
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // 2. On cherche l'utilisateur et son token haché en BDD
      const user = await this.usersRepository.findOne({ 
        where: { id: payload.sub }, 
        relations: ['role'] 
      });
      
      // Si pas d'utilisateur, ou s'il s'est déconnecté (token_auth null)
      if (!user || !user.token_auth) {
        throw new UnauthorizedException('Accès refusé');
      }

      // 3. On compare le token reçu avec le hash en base de données
      const isMatch = await bcrypt.compare(refreshToken, user.token_auth);
      if (!isMatch) {
        throw new UnauthorizedException('Accès refusé');
      }

      // 4. TOUT EST BON ! On génère les NOUVEAUX tokens (Rotation)
      const roleName = user.role?.libelle;
      const newPayload = { sub: user.id, email: user.email, role: roleName };

      const isUserAdmin = roleName === 'Admin';
      const accessTokenExpiresIn = isUserAdmin ? '15m' : '1h';
      const refreshTokenExpiresIn = isUserAdmin ? '8h' : '7d';

      const newAccessToken = await this.jwtService.signAsync(newPayload, { expiresIn: accessTokenExpiresIn });
      const newRefreshToken = await this.jwtService.signAsync(newPayload, { expiresIn: refreshTokenExpiresIn });

      // 5. On écrase l'ancien Refresh Token en BDD par le nouveau
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.usersRepository.update(user.id, { token_auth: hashedRefreshToken });

      // 6. On renvoie le nouveau trousseau de clés au frontend
      return { 
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };

    } catch (error) {
      // Si jwtService.verifyAsync échoue (token expiré ou corrompu)
      throw new UnauthorizedException('Refresh token invalide ou expiré. Veuillez vous reconnecter.');
    }
  }

  async logout(userId: number) {
    // Vide la case token_auth dans la BDD
    await this.usersRepository.update(userId, {
      token_auth: null
    });

    return { 
      message: 'Déconnexion réussie.',
      instruction: 'Le frontend doit maintenant supprimer les tokens de son stockage local.'
    };
  }
}