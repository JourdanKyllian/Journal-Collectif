export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt: string;
  readTime: string;
  // À adapter selon ton backend NestJS
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}