import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { getJwtSecret } from '../common/config/jwt-secret';
import { Session } from './entities/session.entity';

const cookieExtractor = (req: Request): string | null => {
  const cookies = req?.cookies as Record<string, unknown> | undefined;
  const token = cookies?.['access_token'];
  return typeof token === 'string' ? token : null;
};

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
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
   * compte supprimé ou un rôle modifié prennent effet immédiatement (une requête indexée par appel).
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

    return {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role?.libelle ?? 'utilisateur',
      sessionId: session.id,
    };
  }
}
