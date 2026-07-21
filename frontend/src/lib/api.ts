const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch wrapper agissant comme un intercepteur HTTP.
 * Gère dynamiquement l'injection du JWT et le flux de rotation (refresh token) sur les erreurs 401.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Fallback sur application/json si ce n'est pas explicitement géré (ex: FormData pour les uploads)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Vérification CSR (Client-Side Rendering) pour éviter les erreurs d'hydratation Next.js sur le localStorage
  const isClient = typeof window !== 'undefined';
  const accessToken = isClient ? localStorage.getItem('access_token') : null;

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const config: RequestInit = { ...options, headers };
  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Interception du 401: Le token est expiré ou invalide, on tente un refresh
  if (response.status === 401 && accessToken && isClient) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          
          localStorage.setItem('access_token', newTokens.access_token);
          localStorage.setItem('refresh_token', newTokens.refresh_token);

          // Re-jeu de la requête initiale avec le nouveau JWT
          headers.set('Authorization', `Bearer ${newTokens.access_token}`);
          response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, headers });
        } else {
          throw new Error("Refresh token expiré ou révoqué.");
        }
      } catch (error) {
        // Fallback de sécurité: nettoyage total et redirection forcée vers le login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        throw error;
      }
    }
  }

  // Extraction standardisée des erreurs API
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur API: ${response.status}`);
  }

  return response.json();
}