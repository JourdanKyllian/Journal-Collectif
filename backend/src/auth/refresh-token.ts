import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';

/**
 * Refresh token opaque `idSession.secret`.
 * - `idSession` : UUID de la session, clé primaire → recherche en O(1).
 * - `secret`    : 256 bits aléatoires. Seul son SHA-256 est stocké (pas de sel : l'entropie
 *   rend les tables arc-en-ciel inutiles, et un sel empêcherait la recherche directe).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET = /^[A-Za-z0-9_-]{43}$/;

export function generateSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function generateRefreshToken(): {
  sessionId: string;
  secret: string;
  token: string;
} {
  const sessionId = randomUUID();
  const secret = generateSecret();
  return { sessionId, secret, token: formatRefreshToken(sessionId, secret) };
}

export function formatRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}

export function parseRefreshToken(
  token: unknown,
): { sessionId: string; secret: string } | null {
  if (typeof token !== 'string' || token.length > 100) return null;
  const [sessionId, secret, ...rest] = token.split('.');
  if (rest.length > 0 || !sessionId || !secret) return null;
  if (!UUID.test(sessionId) || !SECRET.test(secret)) return null;
  return { sessionId: sessionId.toLowerCase(), secret };
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** Comparaison en temps constant de deux empreintes hexadécimales. */
export function safeEqualHex(a: string, b: string | null | undefined): boolean {
  if (!b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
