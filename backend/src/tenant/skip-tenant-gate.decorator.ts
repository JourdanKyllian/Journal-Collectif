import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_GATE = 'skipTenantGate';

/**
 * Route accessible même si le journal courant est masqué (en configuration) ou en maintenance :
 * connexion, annuaire public, supervision.
 */
export const SkipTenantGate = () => SetMetadata(SKIP_TENANT_GATE, true);
