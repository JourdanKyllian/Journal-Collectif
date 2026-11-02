import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY_LOCATION_PREF = 'user_location_permission_pref';

export type LocationPermissionMode = 'foreground' | 'always' | 'denied' | 'not_asked';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  city?: string | null;
  postalCode?: string | null;
  region?: string | null;
  street?: string | null;
}

// Chargement sécurisé et paresseux (lazy) pour éviter le crash natif si le module n'est pas encore compilé
let LocationModule: typeof import('expo-location') | null = null;
let locationModuleLoaded = false;

function getLocation(): typeof import('expo-location') | null {
  if (!locationModuleLoaded) {
    locationModuleLoaded = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      LocationModule = require('expo-location');
    } catch {
      console.warn(
        '[LocationService] Le module natif "ExpoLocation" n\'est pas encore lié dans ce binaire de développement.\n' +
        'Pour l\'activer sur iOS : exécutez "cd mobile/ios && pod install" puis relancez le build.'
      );
      LocationModule = null;
    }
  }
  return LocationModule;
}

export const LocationService = {
  /**
   * Indique si le module natif est disponible dans le binaire actuel
   */
  isNativeModuleAvailable(): boolean {
    return Boolean(getLocation());
  },

  /**
   * Calcule la distance en mètres entre deux points géographiques (Formule de Haversine)
   */
  calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Rayon moyen de la Terre en mètres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  /**
   * Formate une distance en mètres en texte clair ("180 m" ou "2,4 km")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters / 10) * 10} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1).replace('.', ',')} km`;
  },

  /**
   * Récupère la préférence mémorisée par l'utilisateur
   */
  async getSavedPermissionPreference(): Promise<LocationPermissionMode> {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY_LOCATION_PREF);
      if (saved && ['foreground', 'always', 'denied'].includes(saved)) {
        return saved as LocationPermissionMode;
      }
      return 'not_asked';
    } catch {
      return 'not_asked';
    }
  },

  /**
   * Enregistre le choix de permission de l'utilisateur
   */
  async savePermissionPreference(choice: LocationPermissionMode): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY_LOCATION_PREF, choice);
    } catch {
      // Ignoré si le stockage échoue
    }
  },

  /**
   * Vérifie si l'application a actuellement la permission système d'accéder à la position
   */
  async checkSystemPermission(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  }> {
    const Loc = getLocation();
    if (!Loc) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'undetermined',
      };
    }

    try {
      const response = await Loc.getForegroundPermissionsAsync();
      return {
        granted: response.granted,
        canAskAgain: response.canAskAgain,
        status: response.status,
      };
    } catch {
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    }
  },

  /**
   * Demande la permission système selon le mode souhaité (foreground ou background/always)
   */
  async requestPermission(mode: 'foreground' | 'always'): Promise<boolean> {
    const Loc = getLocation();
    if (!Loc) {
      console.warn('[LocationService] Impossible de demander la permission : module natif absent du binaire.');
      return false;
    }

    try {
      if (mode === 'foreground') {
        const fg = await Loc.requestForegroundPermissionsAsync();
        await this.savePermissionPreference(fg.granted ? 'foreground' : 'denied');
        return fg.granted;
      } else {
        const fg = await Loc.requestForegroundPermissionsAsync();
        if (!fg.granted) {
          await this.savePermissionPreference('denied');
          return false;
        }

        if (Platform.OS !== 'web') {
          const bg = await Loc.requestBackgroundPermissionsAsync();
          const granted = bg.granted;
          await this.savePermissionPreference(granted ? 'always' : 'foreground');
          return granted;
        }

        await this.savePermissionPreference('foreground');
        return true;
      }
    } catch (e) {
      console.warn('Erreur lors de la demande de géolocalisation:', e);
      return false;
    }
  },

  /**
   * Obtient les coordonnées GPS actuelles
   */
  async getCurrentLocation(): Promise<UserCoordinates | null> {
    const Loc = getLocation();
    if (!Loc) return null;

    try {
      const { granted } = await this.checkSystemPermission();
      if (!granted) {
        return null;
      }

      const position = await Loc.getCurrentPositionAsync({
        accuracy: Loc.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return null;
    }
  },

  /**
   * Convertit des coordonnées GPS en adresse / commune lisible (Reverse Geocoding)
   */
  async reverseGeocode(coords: UserCoordinates): Promise<GeocodedAddress | null> {
    const Loc = getLocation();
    if (!Loc) return null;

    try {
      const results = await Loc.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (results && results.length > 0) {
        const item = results[0];
        return {
          city: item.city || item.subregion || item.district,
          postalCode: item.postalCode,
          region: item.region,
          street: item.street,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
