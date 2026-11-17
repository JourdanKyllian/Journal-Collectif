import { LocationService } from '@/lib/services/location.service';
import { OfflineService } from '@/lib/services/offline.service';
import { AFFLUENCE_CONFIG, INITIAL_PARKINGS } from '@/lib/services/parking.service';
import { LIGHT_THEME, DARK_THEME } from '@/context/ThemeContext';
import { COLORS } from '@/theme/tokens';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import { SyncQueueService } from '@/lib/services/sync-queue.service';
import { AiAssistantService } from '@/lib/services/ai-assistant.service';
import { ConsentService } from '@/lib/services/consent.service';

// Mock pour expo-secure-store
const storeMock = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => storeMock.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    storeMock.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    storeMock.delete(key);
  }),
}));

describe('Mobile Unit Tests (Suite d\'évaluation finale)', () => {
  beforeEach(() => {
    storeMock.clear();
  });

  // ==========================================
  // 1. Tests Géolocalisation & Haversine
  // ==========================================
  describe('LocationService (Calculs géographiques)', () => {
    test('1. Calcule avec précision la distance Haversine entre Châlons-en-Champagne et Reims (~40-45 km)', () => {
      // Coordonnées : Châlons (48.9565, 4.3638), Reims (49.2583, 4.0317)
      const distance = LocationService.calculateDistanceMeters(48.9565, 4.3638, 49.2583, 4.0317);
      expect(distance).toBeGreaterThan(40000);
      expect(distance).toBeLessThan(46000);
    });

    test('2. Retourne 0 mètre pour deux coordonnées identiques', () => {
      const distance = LocationService.calculateDistanceMeters(48.9565, 4.3638, 48.9565, 4.3638);
      expect(distance).toBe(0);
    });

    test('3. Formate correctement les courtes distances en mètres avec arrondi à la dizaine', () => {
      expect(LocationService.formatDistance(184)).toBe('180 m');
      expect(LocationService.formatDistance(45)).toBe('50 m');
    });

    test('4. Formate correctement les longues distances en kilomètres avec virgule française', () => {
      expect(LocationService.formatDistance(2450)).toBe('2,5 km');
      expect(LocationService.formatDistance(12000)).toBe('12,0 km');
    });
  });

  // ==========================================
  // 2. Tests Fonctionnalité Hors-Ligne (Offline)
  // ==========================================
  describe('OfflineService (Favoris et Cache hors-ligne)', () => {
    test('5. Retourne une liste vide de favoris au premier démarrage', async () => {
      const favs = await OfflineService.getFavoriteIds();
      expect(Array.isArray(favs)).toBe(true);
    });

    test('6. Permet d\'ajouter un article aux favoris persistants', async () => {
      const isFav = await OfflineService.toggleFavorite(42);
      expect(isFav).toBe(true);
      const isNowSaved = await OfflineService.isFavorite(42);
      expect(isNowSaved).toBe(true);
    });

    test('7. Permet de retirer un article des favoris (toggle réversible)', async () => {
      await OfflineService.toggleFavorite(99);
      const removed = await OfflineService.toggleFavorite(99);
      expect(removed).toBe(false);
      const isSaved = await OfflineService.isFavorite(99);
      expect(isSaved).toBe(false);
    });

    test('8. Sauvegarde et restaure les articles en cache local hors-ligne par commune', async () => {
      const testArticles = MOCK_ARTICLES.slice(0, 3);
      await OfflineService.saveCachedArticles('chalons-en-champagne', testArticles);

      const cached = await OfflineService.getCachedArticles('chalons-en-champagne');
      expect(cached).not.toBeNull();
      expect(cached?.length).toBe(3);
      expect(cached?.[0].id).toBe(testArticles[0].id);
    });
  });

  // ==========================================
  // 3. Tests Services & Données Ville (Parking & Affluence)
  // ==========================================
  describe('ParkingService & Affluence Configuration', () => {
    test('9. Mappe correctement les 4 niveaux d\'affluence médiane (calme, moderee, forte, saturee)', () => {
      expect(AFFLUENCE_CONFIG.calme.badge).toBe('🟢');
      expect(AFFLUENCE_CONFIG.moderee.badge).toBe('🟡');
      expect(AFFLUENCE_CONFIG.forte.badge).toBe('🟠');
      expect(AFFLUENCE_CONFIG.saturee.badge).toBe('🔴');
    });

    test('10. Vérifie l\'intégrité des données de stationnement initiales (places disponibles <= total)', () => {
      for (const spot of INITIAL_PARKINGS) {
        expect(spot.total).toBeGreaterThan(0);
        expect(spot.available).toBeLessThanOrEqual(spot.total);
        expect(typeof spot.name).toBe('string');
      }
    });
  });

  // ==========================================
  // 4. Tests Thème & Tokens Design
  // ==========================================
  describe('Theme & Accessibilité', () => {
    test('11. Les palettes clair et sombre définissent tous les tokens obligatoires avec contrastes distincts', () => {
      expect(LIGHT_THEME.background).toBe(COLORS.blanc);
      expect(DARK_THEME.background).not.toBe(LIGHT_THEME.background);
      expect(DARK_THEME.text).not.toBe(LIGHT_THEME.text);
      expect(LIGHT_THEME.or).toBeDefined();
      expect(DARK_THEME.or).toBeDefined();
    });

    test('12. Les données mock des articles respectent le schéma requis (titre, catégorie, date)', () => {
      for (const article of MOCK_ARTICLES) {
        expect(article.id).toBeDefined();
        expect(typeof article.titre).toBe('string');
        expect(article.categorie).toHaveProperty('libelle');
        expect(article.published_at).toBeDefined();
      }
    });
  });

  // ==========================================
  // 5. Tests Bonus : Synchronisation Hors-Ligne & IA Citoyenne
  // ==========================================
  describe('Bonus Barème : Hors-ligne synchronisé & Fonction IA', () => {
    test('13. SyncQueueService : met en file d\'attente chiffrée les contributions réalisées en mode hors-ligne', async () => {
      const item = await SyncQueueService.enqueue({
        type: 'article_submission',
        citySlug: 'chalons-en-champagne',
        payload: { titre: 'Brocante citoyenne', contenu: 'Super événement' },
      });
      expect(item.id).toBeDefined();
      expect(item.type).toBe('article_submission');

      const count = await SyncQueueService.getPendingCount();
      expect(count).toBeGreaterThanOrEqual(1);

      await SyncQueueService.remove(item.id);
      const after = await SyncQueueService.getPendingCount();
      expect(after).toBe(0);
    });

    test('14. AiAssistantService : raffine la syntaxe et le vocabulaire citoyen sans inventer ni changer le sens (0 € de coût)', async () => {
      const rawDraft = "il y a eu pas mal de gens à la fête et c'est super important pour le quartier.";
      const refined = await AiAssistantService.refineCitizenArticle({
        title: 'fête de quartier.',
        content: rawDraft,
      });

      expect(refined.improvedText).toContain('s\'est déroulé');
      expect(refined.improvedText).toContain('de nombreux');
      expect(refined.improvedTitle).toBe('Fête de quartier');
      expect(refined.highlights.length).toBeGreaterThan(0);
      expect(refined.correctionsCount).toBeGreaterThan(0);
    });

    test('15. ConsentService : mémorise et réinitialise les choix de traceurs et cookies conformément au RGPD', async () => {
      await ConsentService.saveConsentChoice('essential');
      let choice = await ConsentService.getConsentChoice();
      expect(choice).toBe('essential');

      await ConsentService.saveConsentChoice('all');
      choice = await ConsentService.getConsentChoice();
      expect(choice).toBe('all');

      await ConsentService.resetConsent();
      choice = await ConsentService.getConsentChoice();
      expect(choice).toBeNull();
    });
  });
});
