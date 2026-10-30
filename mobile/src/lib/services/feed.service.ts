import { apiClient, resolveImageUrl } from '@/lib/api';
import {
  MobileArticle,
  MobileAlert,
  MOCK_ARTICLES,
  MOCK_CATEGORIES,
  MOCK_ALERTS,
} from '@/lib/mock-data';

export interface ApiCategory {
  id: number;
  libelle: string;
  icon?: string;
  description?: string;
}

export interface ApiArticle {
  id: number;
  titre: string;
  contenu: string;
  image_couverture?: string | null;
  source_link?: string | null;
  published_at?: string | null;
  created_at?: string;
  categorie?: {
    id: number;
    libelle: string;
    icon?: string;
  };
  credits?: { role: string; name: string; anonymous?: boolean }[];
}

export interface PaginatedArticlesResponse {
  data: ApiArticle[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  'Vie Locale': '🏘️',
  Culture: '🎭',
  Environnement: '🌱',
  Travaux: '🏗️',
  Économie: '💼',
  Sport: '⚽',
  Jeunesse: '🎒',
  Santé: '🩺',
};

function formatFrenchDate(dateStr?: string | null): string {
  if (!dateStr) return 'Récemment';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Récemment';
  }
}

function calculateReadTime(text?: string): string {
  if (!text) return '2 min';
  const clean = text.replace(/<[^>]*>?/gm, '');
  const wordCount = clean.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  return `${minutes} min`;
}

function createExcerpt(text?: string): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>?/gm, '').trim();
  if (clean.length <= 120) return clean;
  return clean.slice(0, 117).trim() + '...';
}

export function transformApiArticle(article: ApiArticle): MobileArticle {
  const catLibelle = article.categorie?.libelle || 'Vie Locale';
  const icon =
    article.categorie?.icon ||
    CATEGORY_ICONS[catLibelle] ||
    '📰';

  return {
    id: article.id,
    titre: article.titre,
    excerpt: createExcerpt(article.contenu),
    contenu: article.contenu,
    image_couverture: resolveImageUrl(article.image_couverture),
    published_at: formatFrenchDate(article.published_at ?? article.created_at),
    readTime: calculateReadTime(article.contenu),
    categorie: {
      id: article.categorie?.id ?? 1,
      libelle: catLibelle,
      icon,
    },
    credits: article.credits ?? [{ role: 'Auteur', name: 'Rédaction' }],
  };
}

export const FeedService = {
  /**
   * Récupère les articles publiés avec pagination et filtre catégorie optionnel
   */
  async getPublishedArticles(options?: {
    categorieId?: number;
    limit?: number;
    page?: number;
  }): Promise<{ articles: MobileArticle[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.categorieId && options.categorieId > 0) {
        params.append('categorieId', options.categorieId.toString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient<PaginatedArticlesResponse>(
        `/article/published${queryString}`
      );

      if (response && Array.isArray(response.data)) {
        return {
          articles: response.data.map(transformApiArticle),
          total: response.meta?.total ?? response.data.length,
        };
      }
      return { articles: MOCK_ARTICLES, total: MOCK_ARTICLES.length };
    } catch {
      // Fallback gracieux sur le mock si API hors ligne ou cold-start Render
      return { articles: MOCK_ARTICLES, total: MOCK_ARTICLES.length };
    }
  },

  /**
   * Récupère la liste des catégories du journal
   */
  async getCategories(): Promise<{ id: number; libelle: string; icon: string; description?: string }[]> {
    try {
      const data = await apiClient<ApiCategory[]>('/categorie');
      if (Array.isArray(data) && data.length > 0) {
        return [
          { id: 0, libelle: 'Tous', icon: '✨', description: 'Toutes les actualités' },
          ...data.map((cat) => ({
            id: cat.id,
            libelle: cat.libelle,
            icon: cat.icon || CATEGORY_ICONS[cat.libelle] || '🏷️',
            description: cat.description,
          })),
        ];
      }
      return MOCK_CATEGORIES;
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  /**
   * Récupère les alertes municipales actives
   */
  async getAlerts(): Promise<MobileAlert[]> {
    try {
      const data = await apiClient<MobileAlert[]>('/alerts');
      if (Array.isArray(data)) {
        return data;
      }
      return MOCK_ALERTS;
    } catch {
      return MOCK_ALERTS;
    }
  },
};
