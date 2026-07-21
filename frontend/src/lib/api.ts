const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch wrapper.
 * Le navigateur gère automatiquement l'envoi et la réception des cookies 
 * grâce à "credentials: 'include'".
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = { 
    ...options, 
    headers,
    credentials: 'include' // Obligatoire pour envoyer/recevoir les cookies cross-origin
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Note : La logique de refresh token complexe n'est plus utile ici.
  // Si le serveur renvoie 401 (non autorisé), c'est lui qui gérera le renvoi 
  // d'un nouveau cookie via sa propre route /refresh, ou bien on redirige vers le login.
  if (response.status === 401) {
       // Optionnel : Tu pourrais tenter un appel silencieux à `/auth/refresh` ici, 
       // mais pour l'instant, on redirige simplement.
       if (typeof window !== 'undefined') {
           window.location.href = '/'; 
       }
       throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur API: ${response.status}`);
  }

  return response.json();
}