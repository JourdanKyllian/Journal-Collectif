import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejette les tokens expirés
      secretOrKey: 'TA_CLEF_SECRETE_ICI', // ⚠️ Doit être exactement la même clé que dans ton AppModule !
    });
  }

  // Cette fonction est appelée AUTOMATIQUEMENT si le token est valide
  async validate(payload: any) {
    // Ce qu'on retourne ici sera accessible dans toutes nos requêtes via "req.user"
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}