import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { SKIP_TENANT_GATE } from './skip-tenant-gate.decorator';
import { JournalStatut } from './tenant.constants';
import { TenantContext } from './tenant.context';

/**
 * Garde globale : un journal en configuration est invisible (404) et un journal en maintenance
 * indisponible (503) pour quiconque n'en est pas membre. Les opérateurs de la plateforme passent.
 *
 * Un journal actif ne coûte rien : l'authentification n'est tentée que pour les autres.
 */
@Injectable()
export class JournalAccessGuard extends OptionalJwtAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const journal = this.tenant.tryGet();
    if (!journal || journal.statut === JournalStatut.ACTIF) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_GATE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    // Identifie le visiteur s'il présente un jeton valide ; n'échoue jamais.
    await (super.canActivate(context) as Promise<boolean>);
    const user = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser | null }>().user;

    if (user && (user.isPlatformAdmin || user.isJournalMember)) return true;

    if (journal.statut === JournalStatut.MAINTENANCE) {
      throw new ServiceUnavailableException(
        'Ce journal est momentanément en maintenance.',
      );
    }
    throw new NotFoundException('Journal introuvable.');
  }
}
