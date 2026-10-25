export const STAFF_ROLES = ['super_admin', 'admin', 'redacteur'];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Durées de vie : plus courtes pour le staff. La session glisse : chaque rotation repart de zéro. */
export function sessionTtls(role?: string): {
  accessMs: number;
  refreshMs: number;
} {
  return STAFF_ROLES.includes(role ?? '')
    ? { accessMs: 15 * MINUTE, refreshMs: 8 * HOUR }
    : { accessMs: HOUR, refreshMs: 7 * DAY };
}

/** Au-delà, la session la plus ancienne (dernière activité) est supprimée. */
export const MAX_SESSIONS_PER_USER = 10;

/**
 * Deux refresh simultanés (plusieurs onglets) présentent le même secret : le second arrive après
 * la rotation du premier. Pendant cette fenêtre il reçoit un access token sans être pris pour un rejeu.
 */
export const ROTATION_GRACE_MS = 10 * 1000;

/** Les sessions révoquées sont conservées ce temps (audit) puis purgées. */
export const REVOKED_RETENTION_MS = 30 * DAY;

/** Hash bcrypt factice : une connexion sur un e-mail inconnu coûte autant de temps qu'une vraie. */
export const DUMMY_PASSWORD_HASH =
  '$2b$10$ffjhSnXurn83dYCccUNrUu/uv3dWyLaHAxRAnKE01SE2n5rUbwQ3O';
