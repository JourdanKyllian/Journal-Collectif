import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../users/entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import { Session } from './entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';
import {
  DUMMY_PASSWORD_HASH,
  MAX_SESSIONS_PER_USER,
  REVOKED_RETENTION_MS,
  ROTATION_GRACE_MS,
  sessionTtls,
} from './auth.constants';
import {
  generateRefreshToken,
  generateSecret,
  formatRefreshToken,
  hashSecret,
  parseRefreshToken,
  safeEqualHex,
} from './refresh-token';

/** Contexte de la requête qui ouvre ou renouvelle une session. */
export interface SessionContext {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface AuthResult {
  accessToken: string;
  accessTtlMs: number;
  /** Absent si la rotation a été ignorée (refresh concurrent dans la fenêtre de grâce). */
  refreshToken?: string;
  refreshTtlMs: number;
  sessionId: string;
}

/**
 * Authentification par sessions : un access token JWT court `{ sub, sid }` et un refresh token
 * opaque `idSession.secret`, rotatif, propre à chaque appareil.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  /**
   * Ouvre une session pour un e-mail et un mot de passe valides.
   * Le temps de réponse est identique que l'e-mail existe ou non.
   */
  async login(
    email: string,
    pass: string,
    context: SessionContext = {},
  ): Promise<AuthResult> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    const isMatch = await bcrypt.compare(
      pass,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !isMatch) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.openSession(user, context);
  }

  /**
   * Enregistre un nouvel utilisateur standard .
   *
   * @param {RegisterDto} registerDto - Les données d'inscription .
   * @returns {Promise<Partial<Users>>} L'utilisateur créé sans son mot de passe .
   */
  async register(registerDto: RegisterDto) {
    // 1. Vérification de la correspondance des mots de passe
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

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

    // 2. Création de l'utilisateur avec un profil allégé (juste le username mappé sur firstname)
    const newUser = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      role: userRole,
      profile: {
        firstname: registerDto.username,
        lastname: null,
        tel: null,
      },
    });

    const savedUser = await this.usersRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser;

    return userWithoutPassword;
  }

  /**
   * Renouvelle une session à partir de son refresh token et fait tourner le secret.
   *
   * - Secret courant → rotation atomique (compare-and-swap) : un seul de deux appels simultanés gagne.
   * - Secret précédent, dans la fenêtre de grâce → nouvel access token, sans rotation.
   * - Tout autre secret périmé → rejeu probable d'un token volé : la session est révoquée.
   */
  async refresh(
    rawToken: string,
    context: SessionContext = {},
  ): Promise<AuthResult> {
    const parsed = parseRefreshToken(rawToken);
    if (!parsed) throw this.invalidRefresh();

    const session = await this.findActiveSession(parsed.sessionId);
    if (!session) throw this.invalidRefresh();

    const presented = hashSecret(parsed.secret);

    if (safeEqualHex(presented, session.refreshTokenHash)) {
      const now = new Date();
      const ttl = sessionTtls(session.user.role?.libelle);
      const secret = generateSecret();

      const swap = await this.sessionRepository.update(
        {
          id: session.id,
          refreshTokenHash: session.refreshTokenHash,
          revokedAt: IsNull(),
        },
        {
          refreshTokenHash: hashSecret(secret),
          previousRefreshTokenHash: session.refreshTokenHash,
          rotatedAt: now,
          lastUsedAt: now,
          expiresAt: new Date(now.getTime() + ttl.refreshMs),
          ipAddress: context.ip ?? session.ipAddress,
          userAgent: context.userAgent ?? session.userAgent,
        },
      );

      if (swap.affected === 1) {
        return {
          accessToken: await this.signAccessToken(
            session.userId,
            session.id,
            ttl.accessMs,
          ),
          accessTtlMs: ttl.accessMs,
          refreshToken: formatRefreshToken(session.id, secret),
          refreshTtlMs: ttl.refreshMs,
          sessionId: session.id,
        };
      }

      // Course perdue contre un refresh concurrent : on retombe sur la fenêtre de grâce.
      const reloaded = await this.findActiveSession(session.id);
      if (!reloaded) throw this.invalidRefresh();
      return this.graceOrReuse(reloaded, presented);
    }

    return this.graceOrReuse(session, presented);
  }

  private async graceOrReuse(
    session: Session,
    presentedHash: string,
  ): Promise<AuthResult> {
    const now = new Date();
    const inGrace =
      session.rotatedAt !== null &&
      now.getTime() - new Date(session.rotatedAt).getTime() <=
        ROTATION_GRACE_MS &&
      safeEqualHex(presentedHash, session.previousRefreshTokenHash);

    if (!inGrace) {
      await this.sessionRepository.update(
        { id: session.id },
        { revokedAt: now },
      );
      this.logger.warn(
        `Refresh token rejoué : session ${session.id} révoquée (utilisateur ${session.userId}).`,
      );
      throw this.invalidRefresh();
    }

    const ttl = sessionTtls(session.user.role?.libelle);
    await this.sessionRepository.update(
      { id: session.id },
      { lastUsedAt: now },
    );
    return {
      accessToken: await this.signAccessToken(
        session.userId,
        session.id,
        ttl.accessMs,
      ),
      accessTtlMs: ttl.accessMs,
      refreshTtlMs: ttl.refreshMs,
      sessionId: session.id,
    };
  }

  /** Révoque une session. Idempotent. */
  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Déconnexion quand l'access token a déjà expiré : le refresh token prouve la possession
   * de la session. Un secret invalide ne révoque rien.
   */
  async logoutWithRefreshToken(rawToken: string): Promise<void> {
    const parsed = parseRefreshToken(rawToken);
    if (!parsed) return;

    const session = await this.sessionRepository.findOne({
      where: { id: parsed.sessionId },
    });
    if (!session) return;

    const presented = hashSecret(parsed.secret);
    if (
      safeEqualHex(presented, session.refreshTokenHash) ||
      safeEqualHex(presented, session.previousRefreshTokenHash)
    ) {
      await this.logout(session.id);
    }
  }

  /** Révoque toutes les sessions d'un utilisateur sauf, éventuellement, la courante. */
  async revokeOtherSessions(
    userId: number,
    exceptSessionId?: string,
  ): Promise<void> {
    const qb = this.sessionRepository
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId });
    if (exceptSessionId)
      qb.andWhere('id != :exceptSessionId', { exceptSessionId });
    await qb.execute();
  }

  private invalidRefresh(): UnauthorizedException {
    return new UnauthorizedException(
      'Refresh token invalide ou expiré. Veuillez vous reconnecter.',
    );
  }

  private findActiveSession(id: string): Promise<Session | null> {
    return this.sessionRepository
      .findOne({ where: { id }, relations: ['user', 'user.role'] })
      .then((session) =>
        session &&
        session.user &&
        !session.revokedAt &&
        new Date(session.expiresAt).getTime() > Date.now()
          ? session
          : null,
      );
  }

  private async openSession(
    user: Users,
    context: SessionContext,
  ): Promise<AuthResult> {
    const ttl = sessionTtls(user.role?.libelle);
    const { sessionId, secret, token } = generateRefreshToken();
    const now = new Date();

    await this.pruneSessions(user.id, now);
    await this.sessionRepository.save(
      this.sessionRepository.create({
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashSecret(secret),
        previousRefreshTokenHash: null,
        rotatedAt: null,
        deviceIdentifier: context.deviceId ?? null,
        userAgent: context.userAgent ?? null,
        ipAddress: context.ip ?? null,
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + ttl.refreshMs),
        revokedAt: null,
      }),
    );

    return {
      accessToken: await this.signAccessToken(user.id, sessionId, ttl.accessMs),
      accessTtlMs: ttl.accessMs,
      refreshToken: token,
      refreshTtlMs: ttl.refreshMs,
      sessionId,
    };
  }

  /** Purge les sessions mortes et plafonne le nombre d'appareils actifs (les plus anciens sautent). */
  private async pruneSessions(userId: number, now: Date): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('(expires_at < :now OR revoked_at < :cutoff)', {
        now,
        cutoff: new Date(now.getTime() - REVOKED_RETENTION_MS),
      })
      .execute();

    const active = await this.sessionRepository.find({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(now) },
      order: { lastUsedAt: 'ASC' },
      select: ['id'],
    });
    const excess = active.length - (MAX_SESSIONS_PER_USER - 1);
    if (excess > 0) {
      await this.sessionRepository.delete(
        active.slice(0, excess).map((session) => session.id),
      );
    }
  }

  private signAccessToken(
    userId: number,
    sessionId: string,
    ttlMs: number,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, sid: sessionId },
      { expiresIn: Math.floor(ttlMs / 1000) },
    );
  }

  /**
   * Récupère les données agrégées de l'utilisateur connecté (Auth + Profile) .
   *
   * @param {number} userId - L'identifiant unique de l'utilisateur .
   * @returns {Promise<object>} Les informations de profil et le rôle exact .
   * @throws {NotFoundException} Si l'utilisateur est introuvable .
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
      role: user.role?.libelle || 'utilisateur',
      firstname: user.profile?.firstname || null,
      lastname: user.profile?.lastname || null,
      avatar_ref: user.profile?.avatar_ref || 'default_01',
      bio: user.profile?.bio || null,
      tel: user.profile?.tel || null,
    };
  }

  /**
   * Met à jour les paramètres de sécurité sensibles (email ou mot de passe) .
   *
   * @param {number} userId - L'identifiant de l'utilisateur .
   * @param {UpdateSecurityDto} dto - Le DTO contenant le mot de passe actuel et les modifications .
   * @returns {Promise<object>} Un message de succès .
   */
  async updateSecurity(
    userId: number,
    dto: UpdateSecurityDto,
    currentSessionId?: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');

    let hasChanges = false;

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

    if (dto.newPassword) {
      user.password = await bcrypt.hash(dto.newPassword, 10);
      hasChanges = true;
    }

    if (hasChanges) {
      await this.usersRepository.save(user);
    }

    // Un mot de passe qui change doit couper les autres appareils (mot de passe compromis).
    if (dto.newPassword) {
      await this.revokeOtherSessions(userId, currentSessionId);
    }

    return { message: 'Paramètres de sécurité mis à jour avec succès.' };
  }
}
