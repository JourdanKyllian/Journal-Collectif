// En production, on cible le proxy Vercel (/api). En développement, on garde le backend local.
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:4000/api';

/**
 * Wrapper asynchrone pour l'API Fetch.
 * Gère automatiquement l'injection des en-têtes par défaut et la transmission des cookies sécurisés cross-origin.
 *
 * @param {string} endpoint - Le chemin de l'API à interroger (doit commencer par un slash).
 * @param {RequestInit} [options={}] - Options natives de configuration de la requête Fetch.
 * @returns {Promise<T>} Une promesse résolue avec le corps de la réponse formaté en JSON.
 * @throws {Error} Lève une exception explicite si la réponse HTTP indique une erreur (ex: 401 Unauthorized).
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = { 
    ...options, 
    headers,
    credentials: 'include' // Indispensable pour envoyer et recevoir les cookies
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
       throw new Error("Session expirée ou non autorisée.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur API: ${response.status}`);
  }

  return response.json();
}
