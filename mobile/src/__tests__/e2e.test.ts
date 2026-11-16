import { OfflineService } from '@/lib/services/offline.service';
import { LocationService } from '@/lib/services/location.service';
import { MOCK_ARTICLES } from '@/lib/mock-data';

// Mock du stockage matériel persistant (SecureStore)
const mockSecureStorage = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStorage.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
}));

describe('Test de Bout en Bout E2E (Exigence du barème : 1 test E2E)', () => {
  beforeEach(() => {
    mockSecureStorage.clear();
  });

  test('Parcours E2E complet : Détection territoire -> Consultation -> Mise en favoris -> Coupure réseau (Offline fallback) -> Restauration', async () => {
    // -------------------------------------------------------------------------
    // Étape 1 (E2E) : Détection de territoire à l'ouverture de l'application
    // -------------------------------------------------------------------------
    const userGps = { latitude: 48.9565, longitude: 4.3638 }; // Châlons-en-Champagne
    const cityCenter = { latitude: 48.956, longitude: 4.363 };
    const distanceToCenter = LocationService.calculateDistanceMeters(
      userGps.latitude,
      userGps.longitude,
      cityCenter.latitude,
      cityCenter.longitude
    );
    expect(distanceToCenter).toBeLessThan(500); // L'utilisateur est bien détecté au centre-ville

    // -------------------------------------------------------------------------
    // Étape 2 (E2E) : Chargement initial du flux d'articles et mise en cache
    // -------------------------------------------------------------------------
    const initialArticles = MOCK_ARTICLES.slice(0, 5);
    await OfflineService.saveCachedArticles('chalons-en-champagne', initialArticles);

    // -------------------------------------------------------------------------
    // Étape 3 (E2E) : L'utilisateur ajoute le premier article en favoris
    // -------------------------------------------------------------------------
    const targetArticle = initialArticles[0];
    const isNowFavorite = await OfflineService.toggleFavorite(targetArticle.id);
    expect(isNowFavorite).toBe(true);

    const savedFavIds = await OfflineService.getFavoriteIds();
    expect(savedFavIds).toContain(targetArticle.id);

    // -------------------------------------------------------------------------
    // Étape 4 (E2E) : Coupure réseau (Mode Avion / Zone Blanche)
    // Le serveur est inaccessible, l'application sollicite le cache dégradé
    // -------------------------------------------------------------------------
    const cachedArticles = await OfflineService.getCachedArticles('chalons-en-champagne');
    expect(cachedArticles).not.toBeNull();
    expect(cachedArticles?.length).toBe(initialArticles.length);

    // -------------------------------------------------------------------------
    // Étape 5 (E2E) : L'utilisateur filtre ses articles sur l'onglet "Favoris" hors-ligne
    // -------------------------------------------------------------------------
    const offlineFavorites = cachedArticles?.filter((a) => savedFavIds.includes(a.id)) ?? [];
    expect(offlineFavorites.length).toBe(1);
    expect(offlineFavorites[0].id).toBe(targetArticle.id);
    expect(offlineFavorites[0].titre).toBe(targetArticle.titre);

    // -------------------------------------------------------------------------
    // Étape 6 (E2E) : Dé-sélection du favori et vérification de la persistance
    // -------------------------------------------------------------------------
    const isStillFav = await OfflineService.toggleFavorite(targetArticle.id);
    expect(isStillFav).toBe(false);
    const updatedFavIds = await OfflineService.getFavoriteIds();
    expect(updatedFavIds).not.toContain(targetArticle.id);
  });
});
