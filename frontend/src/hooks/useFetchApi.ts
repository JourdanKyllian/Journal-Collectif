import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";

interface UseFetchApiOptions {
  enabled?: boolean;
}

interface UseFetchApiResult<T> {
  /** Données typées renvoyées par l'API */
  data: T | null;
  /** Indique si la requête est en cours d'exécution */
  isLoading: boolean;
  /** Contient l'objet Error en cas d'échec de la requête */
  error: Error | null;
  /** Fonction permettant de forcer un nouvel appel à l'API (ex: après une modification) */
  refetch: () => Promise<T | null>;
}

/**
 * Hook personnalisé encapsulant la logique de requête API, la gestion du chargement et des erreurs.
 *
 * @template T - Le type TypeScript attendu pour la réponse de l'API.
 * @param {string | null} endpoint - Le chemin de l'endpoint à interroger (ex: '/v1/users/all').
 * @param {UseFetchApiOptions} [options] - Options optionnelles (ex: { enabled: false }).
 * @returns {UseFetchApiResult<T>} L'état complet du cycle de vie de la requête.
 */
export function useFetchApi<T>(
  endpoint: string | null,
  options?: UseFetchApiOptions,
): UseFetchApiResult<T> {
  const enabled = options?.enabled ?? true;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(endpoint && enabled));
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (showLoading = true): Promise<T | null> => {
      if (!endpoint || !enabled) return null;

      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetchApi<T>(endpoint);
        setData(result);
        return result;
      } catch (err) {
        const fetchError = err instanceof Error ? err : new Error(String(err));
        setError(fetchError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, enabled],
  );

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  return { data, isLoading, error, refetch: () => fetchData(true) };
}
