import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // On extrait le token depuis les cookies de la requête de manière typée et sécurisée
      jwtFromRequest: (req: Request): string | null => {
        let token: string | null = null;
        if (req && req.cookies && typeof req.cookies === 'object') {
          const cookies = req.cookies as Record<string, unknown>;
          if (typeof cookies['access_token'] === 'string') {
            token = cookies['access_token'];
          }
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_insecure_key',
    });
  }

  validate(payload: { sub: number; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
