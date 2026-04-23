import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. On lit les rôles exigés par la route (ex: ['Admin'])
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Si la route n'a pas de décorateur @Roles(), on laisse passer
    if (!requiredRoles) {
      return true;
    }

    // 3. On récupère l'utilisateur injecté dans la requête par la JwtStrategy
    const { user } = context.switchToHttp().getRequest();

    // 4. Si pas d'utilisateur ou pas de rôle, on bloque
    if (!user || !user.role) {
      return false;
    }

    // 5. On vérifie si le rôle de l'utilisateur fait partie des rôles autorisés
    return requiredRoles.includes(user.role);
  }
}