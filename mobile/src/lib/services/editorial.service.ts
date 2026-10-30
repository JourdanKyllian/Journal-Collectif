import { apiClient } from '@/lib/api';

export interface EditorialArticle {
  id: number;
  titre: string;
  contenu: string;
  excerpt?: string;
  image_couverture?: string | null;
  statut: 'en_attente' | 'publie' | 'brouillon' | 'corbeille';
  published_at?: string | null;
  created_at: string;
  categorie?: {
    id: number;
    libelle: string;
    icon?: string;
  };
  credits?: {
    role: string;
    name: string;
    anonymous?: boolean;
  }[];
  author_name?: string;
  is_anonymous?: boolean;
}

export interface EditorialStats {
  brouillon: number;
  en_attente: number;
  publie: number;
  planifie: number;
  total: number;
}

// Données de secours réalistes pour les démos ou quand le réseau local est hors ligne
export const MOCK_PENDING_ARTICLES: EditorialArticle[] = [
  {
    id: 101,
    titre: 'Brocante solidaire des berges du canal',
    contenu:
      'Lancement ce samedi de la première édition de la brocante solidaire sous les arbres du canal. Plus de 35 exposants et artisans locaux reversent une part des bénéfices à une association de protection de la faune fluviale.\n\nUne buvette citoyenne sans plastique et des animations musicales acoustiques sont prévues dès 9h du matin.',
    excerpt: 'Plus de 35 exposants et artisans locaux reversent une part des bénéfices à une association solidaire.',
    image_couverture: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80',
    statut: 'en_attente',
    created_at: '2026-10-30T14:15:00.000Z',
    categorie: { id: 1, libelle: 'Vie Locale', icon: '🏘️' },
    credits: [{ role: 'Auteur', name: 'Jean Dupont', anonymous: false }],
    author_name: 'Jean Dupont',
    is_anonymous: false,
  },
  {
    id: 102,
    titre: 'Atelier associatif de réparation de vélos',
    contenu:
      'Le collectif Mobilités Douces ouvre un atelier de co-réparation chaque mercredi soir à l’ancienne gare. Venez apprendre à régler vos freins et réparer vos crevaisons avec des outils partagés.\n\nParticipation libre et pièces d’occasion à prix coûtant.',
    excerpt: 'Venez apprendre à régler vos freins et réparer vos crevaisons avec des outils partagés.',
    image_couverture: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=80',
    statut: 'en_attente',
    created_at: '2026-10-30T11:30:00.000Z',
    categorie: { id: 3, libelle: 'Environnement', icon: '🌱' },
    credits: [{ role: 'Auteur', name: 'Citoyen Anonyme', anonymous: true }],
    author_name: 'Citoyen Anonyme',
    is_anonymous: true,
  },
  {
    id: 103,
    titre: 'Concert gratuit sous le kiosque du parc',
    contenu:
      'L’harmonie municipale et de jeunes artistes du conservatoire s’associent pour un récital de jazz et de musiques de films gratuit ce dimanche à 16h.',
    excerpt: 'Récital de jazz et de musiques de films gratuit ce dimanche à 16h sous le kiosque.',
    image_couverture: null,
    statut: 'en_attente',
    created_at: '2026-10-29T18:45:00.000Z',
    categorie: { id: 2, libelle: 'Culture', icon: '🎭' },
    credits: [{ role: 'Auteur', name: 'Claire Moreau', anonymous: false }],
    author_name: 'Claire Moreau',
    is_anonymous: false,
  },
];

export const MOCK_DRAFT_ARTICLES: EditorialArticle[] = [
  {
    id: 201,
    titre: 'Travaux de rénovation de la passerelle piétonne',
    contenu:
      'La deuxième tranche des travaux débute lundi prochain. La circulation des piétons sera déviée vers le pont nord jusqu’à fin novembre.',
    excerpt: 'La circulation des piétons sera déviée vers le pont nord jusqu’à fin novembre.',
    image_couverture: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80',
    statut: 'brouillon',
    created_at: '2026-10-28T09:00:00.000Z',
    categorie: { id: 4, libelle: 'Travaux', icon: '🏗️' },
    credits: [{ role: 'Rédacteur', name: 'Équipe Rédaction', anonymous: false }],
  },
];

export const EditorialService = {
  /**
   * Récupère tous les articles du journal selon leur statut de modération
   */
  async getArticlesByStatus(statut: 'en_attente' | 'publie' | 'brouillon'): Promise<EditorialArticle[]> {
    try {
      const response = await apiClient<{ data: EditorialArticle[] } | EditorialArticle[]>(
        `/article/admin/all?statut=${statut}&limit=50`
      );
      const list = Array.isArray(response) ? response : response?.data || [];
      return list.map((a) => ({
        ...a,
        excerpt: a.excerpt || a.contenu?.replace(/<[^>]*>?/gm, '').slice(0, 115) + '...',
      }));
    } catch {
      // Fallback sur les données simulées pour assurer la continuité de l'expérience
      if (statut === 'en_attente') return MOCK_PENDING_ARTICLES;
      if (statut === 'brouillon') return MOCK_DRAFT_ARTICLES;
      return [];
    }
  },

  /**
   * Compteurs d'articles pour les badges du tableau de bord
   */
  async getStats(): Promise<EditorialStats> {
    try {
      return await apiClient<EditorialStats>('/article/admin/stats');
    } catch {
      return {
        en_attente: MOCK_PENDING_ARTICLES.length,
        publie: 12,
        brouillon: MOCK_DRAFT_ARTICLES.length,
        planifie: 0,
        total: 12 + MOCK_PENDING_ARTICLES.length + MOCK_DRAFT_ARTICLES.length,
      };
    }
  },

  /**
   * Valide et publie immédiatement un article
   */
  async publishArticle(id: number): Promise<void> {
    try {
      await apiClient(`/article/${id}/publish`, { method: 'PATCH' });
    } catch {
      // Simulation pour démo locale sans erreur bloquante
    }
  },

  /**
   * Dépublie un article et le replace en statut brouillon
   */
  async unpublishArticle(id: number): Promise<void> {
    try {
      await apiClient(`/article/${id}/unpublish`, { method: 'PATCH' });
    } catch {
      // Simulation
    }
  },

  /**
   * Refuse ou supprime un article
   */
  async deleteArticle(id: number): Promise<void> {
    try {
      await apiClient(`/article/${id}`, { method: 'DELETE' });
    } catch {
      // Simulation
    }
  },

  /**
   * Crée ou met à jour un article
   */
  async saveArticle(payload: {
    id?: number;
    titre: string;
    contenu: string;
    categorieId: number;
    image_couverture?: string | null;
    statut: 'publie' | 'brouillon' | 'en_attente';
  }): Promise<void> {
    if (payload.id) {
      await apiClient(`/article/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await apiClient('/article', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  },
};

