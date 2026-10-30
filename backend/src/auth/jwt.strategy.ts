import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { getJwtSecret } from '../common/config/jwt-secret';
import { Session } from './entities/session.entity';
import { MembershipService } from '../tenant/membership.service';
import { TenantContext } from '../tenant/tenant.context';

const cookieExtractor = (req: Request): string | null => {
  const cookies = req?.cookies as Record<string, unknown> | undefined;
  const token = cookies?.['access_token'];
  return typeof token === 'string' ? token : null;
};

export interface AuthenticatedUser {
  userId: number;
  email: string;
  /** Rôle dans le journal courant (adhésion), jamais un rôle global débordant d'un autre journal. */
  role: string;
  sessionId: string;
  isJournalMember: boolean;
  isPlatformAdmin: boolean;
  mustChangePassword: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly memberships: MembershipService,
    private readonly tenant: TenantContext,
  ) {
    super({
      // Bearer en priorité (mobile), sinon cookie HTTP-Only (web).
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Le token ne vaut que tant que sa session est vivante : une déconnexion, une révocation, un
   * compte supprimé ou un rôle modifié prennent effet immédiatement (deux requêtes indexées par appel).
   */
  async validate(payload: {
    sub?: number;
    sid?: string;
  }): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sid, userId: payload.sub },
      relations: ['user', 'user.role'],
    });

    if (
      !session ||
      !session.user ||
      session.revokedAt ||
      new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }

    const journal = this.tenant.tryGet();
    const { role, isMember } = journal
      ? await this.memberships.resolveRole(
          session.user.id,
          session.user.role?.libelle,
          journal,
        )
      : { role: session.user.role?.libelle ?? 'utilisateur', isMember: false };

    return {
      userId: session.user.id,
      email: session.user.email,
      role,
      sessionId: session.id,
      isJournalMember: isMember,
      isPlatformAdmin: session.user.is_platform_admin === true,
      mustChangePassword: session.user.must_change_password === true,
    };
  }
}
