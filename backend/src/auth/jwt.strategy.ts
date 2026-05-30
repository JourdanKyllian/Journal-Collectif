import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejette les tokens expirés
      secretOrKey: 'TA_CLEF_SECRETE_ICI', // ⚠️ Doit être exactement la même clé que dans AppModule
    });
  }

  // Cette fonction est appelée AUTOMATIQUEMENT si le token est valide
  validate(payload: { sub: number; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
