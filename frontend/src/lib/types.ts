/**
 * Interface représentant un article du journal municipal.
 * 
 * @interface Article
 * @property {string} id - Identifiant unique de l'article.
 * @property {string} title - Titre de l'article.
 * @property {string} excerpt - Résumé ou court extrait de l'article.
 * @property {string} content - Contenu complet de l'article.
 * @property {string} category - Catégorie de l'article.
 * @property {string} publishedAt - Date de publication.
 * @property {string} readTime - Temps de lecture estimé.
 */
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt: string;
  readTime: string;
}

/**
 * Interface représentant la structure d'une réponse d'erreur de l'API NestJS.
 * 
 * @interface ApiErrorResponse
 * @property {number} statusCode - Code d'état HTTP de l'erreur.
 * @property {string} message - Message explicatif de l'erreur.
 * @property {string} [error] - Type ou libellé optionnel de l'erreur.
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}