export enum JournalStatut {
  EN_CONFIGURATION = 'en_configuration',
  ACTIF = 'actif',
  MAINTENANCE = 'maintenance',
}

/** Journal historique : celui des données et des rôles antérieurs au multi-tenant. */
export const FALLBACK_DEFAULT_JOURNAL_SLUG = 'collectif-chalonnais';

export function defaultJournalSlug(): string {
  return (
    process.env.DEFAULT_JOURNAL_SLUG?.trim() || FALLBACK_DEFAULT_JOURNAL_SLUG
  );
}

export const JOURNAL_HEADER = 'x-journal';
export const JOURNAL_QUERY = 'journal';

/** Slugs interdits : ils entreraient en collision avec des sous-domaines ou des routes. */
export const RESERVED_SLUGS = [
  'api',
  'www',
  'admin',
  'app',
  'mail',
  'static',
  'uploads',
  'health',
  'journals',
];
