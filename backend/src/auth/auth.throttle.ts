import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export const LOGIN_IP = 'login-ip';
export const LOGIN_ACCOUNT = 'login-account';
export const REFRESH_IP = 'refresh-ip';

const fromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** E-mail visé par une tentative de connexion : limite le brute force d'un compte donné. */
const emailTracker = (req: Record<string, unknown>): string => {
  const body = req.body as { email?: unknown } | undefined;
  return typeof body?.email === 'string'
    ? body.email.trim().toLowerCase().slice(0, 255)
    : 'sans-email';
};

/**
 * Limites par minute, lues au démarrage de l'application (surchargeables par variables d'environnement).
 * Stockage en mémoire : suffisant pour une instance ; plusieurs instances demanderaient Redis.
 * Chaque route ne retient que ses propres limiteurs (cf. `@SkipThrottle`).
 */
export function authThrottlerOptions(): ThrottlerModuleOptions {
  const ttl = fromEnv('AUTH_THROTTLE_TTL_MS', 60_000);
  return {
    throttlers: [
      { name: LOGIN_IP, ttl, limit: fromEnv('AUTH_THROTTLE_LOGIN_IP', 20) },
      {
        name: LOGIN_ACCOUNT,
        ttl,
        limit: fromEnv('AUTH_THROTTLE_LOGIN_ACCOUNT', 5),
        getTracker: emailTracker,
      },
      { name: REFRESH_IP, ttl, limit: fromEnv('AUTH_THROTTLE_REFRESH_IP', 30) },
    ],
  };
}
