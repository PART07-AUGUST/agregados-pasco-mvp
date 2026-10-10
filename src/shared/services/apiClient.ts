import { supabase } from './supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { ApiError } from './apiError';

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new Error(
      'Configuración de API ausente: Define la variable VITE_API_BASE_URL en tu entorno (.env.local o Vercel).'
    );
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

async function getAuthToken(): Promise<string | null> {
  const storeToken = useAuthStore.getState().sessionToken;
  if (storeToken) {
    return storeToken;
  }

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: unknown) {
    const msg = networkError instanceof Error ? networkError.message : 'Error de red o conexión al backend';
    throw new ApiError(0, `No se pudo conectar con el servidor: ${msg}`);
  }

  if (!response.ok) {
    let errorDetails: unknown = null;
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorJson = await response.json();
      errorDetails = errorJson;
      if (typeof errorJson?.detail === 'string') {
        errorMessage = errorJson.detail;
      } else if (Array.isArray(errorJson?.detail)) {
        errorMessage = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
      } else if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // No body
      }
    }

    throw new ApiError(response.status, errorMessage, errorDetails);
  }

  if (response.status === 204) {
    return null as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null as T;
  }
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
