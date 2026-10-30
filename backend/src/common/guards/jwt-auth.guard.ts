import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/jwt.strategy';

/** Seules routes ouvertes à un compte dont le mot de passe doit être changé. */
const ALLOWED_WHEN_PASSWORD_CHANGE_REQUIRED = /\/auth\/(me|security)\/?$/;

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    const authenticated = super.handleRequest<TUser>(
      err,
      user,
      info,
      context,
      status,
    );

    const { mustChangePassword } = authenticated as AuthenticatedUser;
    if (mustChangePassword) {
      const path = context.switchToHttp().getRequest<Request>().path;
      if (!ALLOWED_WHEN_PASSWORD_CHANGE_REQUIRED.test(path)) {
        throw new ForbiddenException(
          'Vous devez changer votre mot de passe avant de continuer.',
          'PASSWORD_CHANGE_REQUIRED',
        );
      }
    }
    return authenticated;
  }
}
