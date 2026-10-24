/**
 * Interface représentant un article du journal municipal.
 */
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  categorie: string;
  publishedAt: string;
  readTime: string;
}

/**
 * Métadonnées de pagination renvoyées par le backend NestJS.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Enveloppe générique des listes paginées de l'API.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface représentant la structure d'une réponse d'erreur de l'API NestJS.
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}
