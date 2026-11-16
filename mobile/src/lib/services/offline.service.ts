import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { MobileArticle } from '@/lib/mock-data';

const FAVORITES_KEY = 'jc_favorite_article_ids';
const CACHE_PREFIX = 'jc_offline_articles_';

// Cache mémoire rapide
let memoryFavorites: number[] | null = null;
const memoryArticlesCache: Record<string, MobileArticle[]> = {};

export const OfflineService = {
  /**
   * Récupère la liste des IDs d'articles favoris sauvegardés hors-ligne
   */
  async getFavoriteIds(): Promise<number[]> {
    if (memoryFavorites !== null) return memoryFavorites;
    try {
      if (Platform.OS === 'web') return [];
      const raw = await SecureStore.getItemAsync(FAVORITES_KEY);
      if (!raw) {
        memoryFavorites = [];
        return [];
      }
      memoryFavorites = JSON.parse(raw) as number[];
      return memoryFavorites;
    } catch {
      return [];
    }
  },

  /**
   * Vérifie si un article est mis en favori hors-ligne
   */
  async isFavorite(articleId: number): Promise<boolean> {
    const favs = await this.getFavoriteIds();
    return favs.includes(articleId);
  },

  /**
   * Ajoute ou retire un article des favoris hors-ligne
   */
  async toggleFavorite(articleId: number): Promise<boolean> {
    const favs = await this.getFavoriteIds();
    const isFav = favs.includes(articleId);
    const updated = isFav ? favs.filter((id) => id !== articleId) : [...favs, articleId];
    memoryFavorites = updated;

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify(updated));
      } catch {
        // En cas d'erreur de stockage, le cache mémoire conserve l'état
      }
    }
    return !isFav;
  },

  /**
   * Sauvegarde les articles récents en cache local pour consultation hors-ligne
   */
  async saveCachedArticles(citySlug: string, articles: MobileArticle[]): Promise<void> {
    if (!articles || articles.length === 0) return;
    memoryArticlesCache[citySlug] = articles;

    if (Platform.OS !== 'web') {
      try {
        // Sauvegarde d'un extrait de 15 articles max pour optimiser le stockage
        const trimmed = articles.slice(0, 15);
        await SecureStore.setItemAsync(
          `${CACHE_PREFIX}${citySlug}`,
          JSON.stringify(trimmed)
        );
      } catch {
        // Sécurité silencieuse si quota dépassé
      }
    }
  },

  /**
   * Récupère les articles en cache local lorsque le réseau est indisponible
   */
  async getCachedArticles(citySlug: string): Promise<MobileArticle[] | null> {
    if (memoryArticlesCache[citySlug] && memoryArticlesCache[citySlug].length > 0) {
      return memoryArticlesCache[citySlug];
    }

    if (Platform.OS !== 'web') {
      try {
        const raw = await SecureStore.getItemAsync(`${CACHE_PREFIX}${citySlug}`);
        if (raw) {
          const list = JSON.parse(raw) as MobileArticle[];
          memoryArticlesCache[citySlug] = list;
          return list;
        }
      } catch {
        return null;
      }
    }
    return null;
  },
};
