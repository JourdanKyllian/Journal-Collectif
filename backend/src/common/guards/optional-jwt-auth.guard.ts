import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Identifie l'utilisateur s'il présente un token valide, sans jamais refuser la requête.
 * Sert aux routes publiques dont la réponse dépend du visiteur (ex. aperçu d'un brouillon par son auteur).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser {
    return (user || null) as TUser;
  }
}
