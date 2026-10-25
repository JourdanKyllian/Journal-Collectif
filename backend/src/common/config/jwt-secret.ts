import 'dotenv/config';

/**
 * Secret de signature des JWT. Aucune valeur de repli : un secret par défaut
 * connu permettrait à n'importe qui de forger des tokens.
 * (Remplacé par une validation complète des variables d'environnement en phase 2.)
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= 32) return secret;

  // Les tests unitaires n'ont pas d'environnement : secret fixe, jamais utilisé hors test.
  if (process.env.NODE_ENV === 'test') {
    return secret ?? 'test-only-secret-not-for-production-use-0000';
  }

  throw new Error(
    'JWT_SECRET est manquante ou trop courte (32 caractères minimum). ' +
      "Génération : node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
  );
}
