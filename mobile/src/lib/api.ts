import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'jc_access_token',
  REFRESH_TOKEN: 'jc_refresh_token',
  DEVICE_ID: 'jc_device_id',
  TENANT_SLUG: 'jc_tenant_slug',
} as const;

const DEFAULT_TENANT = 'collectif-chalonnais';

export interface MobileAuthPayload {
  token_type: 'Bearer';
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  session_id: string;
}

/**
 * Génère et persiste un identifiant d'appareil conforme à la regex backend /^[A-Za-z0-9._:-]{1,100}$/
 */
async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === 'web') return 'web-mobile-preview';
  let deviceId = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    deviceId = `expo-${Platform.OS}-${randomHex}`;
    await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export const TenantStorage = {
  async getTenant(): Promise<string> {
    if (Platform.OS === 'web') return DEFAULT_TENANT;
    return (await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_SLUG)) ?? DEFAULT_TENANT;
  },
  async setTenant(slug: string): Promise<void> {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_SLUG, slug);
    }
  },
};

export interface StoredTerritoryPreferences {
  followedSlugs: string[];
  primarySlug: string;
  alertsBySlug: Record<string, boolean>;
}

export const TerritoryStorage = {
  async getPreferences(userId?: number | string): Promise<StoredTerritoryPreferences | null> {
    const key = `jc_prefs_${userId ?? 'guest'}`;
    try {
      if (Platform.OS === 'web') {
        const val = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        return val ? JSON.parse(val) : null;
      }
      const val = await SecureStore.getItemAsync(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async savePreferences(prefs: StoredTerritoryPreferences, userId?: number | string): Promise<void> {
    const key = `jc_prefs_${userId ?? 'guest'}`;
    const serialized = JSON.stringify(prefs);
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, serialized);
        }
        return;
      }
      await SecureStore.setItemAsync(key, serialized);
    } catch {
      // Stockage silencieux
    }
  },
};

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },
  async saveTokens(payload: MobileAuthPayload): Promise<void> {
    if (Platform.OS === 'web') return;
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, payload.access_token);
    // Le backend n'envoie refresh_token que si la rotation a eu lieu (hors fenêtre de grâce)
    if (payload.refresh_token) {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, payload.refresh_token);
    }
  },
  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') return;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

// Verrou (Mutex) pour éviter les appels concurrents à /auth/refresh sur plusieurs 401 simultanées
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const currentRefresh = await TokenStorage.getRefreshToken();
      if (!currentRefresh) return false;

      const [tenant, deviceId] = await Promise.all([
        TenantStorage.getTenant(),
        getOrCreateDeviceId(),
      ]);

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client': 'mobile',
          'X-Journal': tenant,
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ refresh_token: currentRefresh }),
      });

      if (!response.ok) {
        await TokenStorage.clearTokens();
        return false;
      }

      const data = (await response.json()) as MobileAuthPayload;
      await TokenStorage.saveTokens(data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Client HTTP principal pour Journal Collectif Mobile.
 * Injecte X-Journal, X-Client: mobile, X-Device-Id et Authorization: Bearer.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const [accessToken, tenant, deviceId] = await Promise.all([
    TokenStorage.getAccessToken(),
    TenantStorage.getTenant(),
    getOrCreateDeviceId(),
  ]);

  const headers = new Headers(options.headers || {});
  headers.set('X-Journal', tenant);
  headers.set('X-Client', 'mobile');
  headers.set('X-Device-Id', deviceId);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Interception 401 : tentative de rotation transparente du token
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiClient<T>(endpoint, options, true);
    }
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const errorMessage = Array.isArray(errorBody.message)
      ? errorBody.message.join('\n')
      : errorBody.message || `Erreur HTTP ${response.status}`;

    // Si le slug de commune envoyé n'est pas encore provisionné en base,
    // on replie automatiquement sur le journal par défaut historique sans bloquer l'utilisateur.
    if (
      response.status === 404 &&
      errorMessage.toLowerCase().includes('journal introuvable') &&
      tenant !== DEFAULT_TENANT &&
      !isRetry
    ) {
      await TenantStorage.setTenant(DEFAULT_TENANT);
      return apiClient<T>(endpoint, options, true);
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Helper d'authentification mobile (Dual-Auth Phase 1A)
 */
export const MobileAuthApi = {
  async login(email: string, password: string): Promise<MobileAuthPayload> {
    const payload = await apiClient<MobileAuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await TokenStorage.saveTokens(payload);
    return payload;
  },

  async logout(): Promise<void> {
    const refresh_token = await TokenStorage.getRefreshToken();
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
      });
    } finally {
      await TokenStorage.clearTokens();
    }
  },
};

/**
 * Upload natif d'une photo issue d'expo-image-picker vers POST /api/v1/upload/image
 */
export async function uploadImageMobile(localUri: string): Promise<{ url: string }> {
  const filename = localUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  return apiClient<{ url: string }>('/upload/image', {
    method: 'POST',
    body: formData,
  });
}
