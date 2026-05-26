import { ApiErrorResponse } from "./types";

// Classe d'erreur personnalisée pour attraper facilement les codes HTTP
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

// L'URL de ton backend NestJS (à définir dans ton .env)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type FetchOptions = RequestInit & {
  // Types spécifiques à Next.js 15+ pour le cache
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

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
    } catch (e) {
      // Le body n'est pas du JSON
    }

    const errorMessage = typeof errorData === 'string' ? errorData : errorData.message || 'Une erreur est survenue';
    
    // On lève notre erreur personnalisée
    throw new ApiError(response.status, errorMessage, errorData);
  }

  return response.json();
}