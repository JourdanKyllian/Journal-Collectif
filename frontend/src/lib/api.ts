import { ApiErrorResponse } from "./types";

/**
 * Classe d'erreur personnalisée pour la gestion centralisée des erreurs de l'API.
 * Utilise le type `unknown` pour la propriété `data` afin de garantir un typage strict et sécurisé.
 */
export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

/**
 * URL de base du backend NestJS récupérée depuis l'environnement ou définie par défaut sur le port 4000.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Options étendues pour l'exécution des requêtes HTTP (compatible avec le cache de Next.js).
 */
type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/**
 * Fonction utilitaire générique pour effectuer des requêtes HTTP vers l'API.
 * 
 * @template T - Type attendu de la réponse de l'API.
 * @param {string} endpoint - Route de l'API à appeler (ex: '/v1/article').
 * @param {FetchOptions} [options={}] - Options de configuration de la requête Fetch.
 * @returns {Promise<T>} Les données typées renvoyées par l'API.
 * @throws {ApiError} En cas d'échec de la requête HTTP.
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: ApiErrorResponse | string = response.statusText;
    try {
      errorData = await response.json();
    } catch {
      // Capture silencieuse lorsque le corps de la réponse ne contient pas de JSON valide
    }

    const errorMessage = typeof errorData === 'string' ? errorData : errorData.message || 'Une erreur est survenue';
    
    // Levée de l'erreur personnalisée avec le code HTTP et le détail
    throw new ApiError(response.status, errorMessage, errorData);
  }

  return response.json();
}