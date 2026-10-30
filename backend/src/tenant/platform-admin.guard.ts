import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

/** Réservé aux opérateurs de la plateforme (`users.is_platform_admin`). */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (request.user?.isPlatformAdmin !== true) {
      throw new ForbiddenException(
        'Réservé aux administrateurs de la plateforme.',
      );
    }
    return true;
  }
}
