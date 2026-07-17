import { ApiResponse } from './types';
import { removeCookie } from './cookies';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type QueryValue = string | number | boolean | null | undefined;

export function buildQuery(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.append(key, String(value));
  }

  const asString = query.toString();
  return asString ? `?${asString}` : '';
}

export class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          return false;
        }

        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private clearAuthCookies(): void {
    removeCookie('auth_token');
    removeCookie('auth_refresh_token');
    removeCookie('auth_user');
    removeCookie('auth_expiry');
  }

  private getHeaders(body?: unknown): Headers {
    const headers = new Headers();

    if (!(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowRefresh = true,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(options.body),
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const isJson =
        response.headers.get('content-type')?.includes('application/json') ?? false;

      const payload = isJson ? await response.json().catch(() => null) : null;

      const isAuthEndpoint = endpoint.startsWith('/auth/');
      if (response.status === 401 && allowRefresh && !isAuthEndpoint) {
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          return this.request<T>(endpoint, options, false);
        }

        this.clearAuthCookies();
      }

      if (!response.ok) {
        const errorMessage =
          (payload &&
            typeof payload === 'object' &&
            ('message' in payload || 'error' in payload) &&
            String((payload as { message?: unknown; error?: unknown }).message ??
              (payload as { error?: unknown }).error)) ||
          response.statusText ||
          'An error occurred';

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: (payload ?? undefined) as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async download(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(options.body),
      credentials: 'include',
    };

    // If it's a download, we might not want application/json content-type for the request body
    // but the getHeaders logic handles it if body is not FormData. 
    // It's mostly GET requests anyway.
    const response = await fetch(url, config);

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const retryResponse = await fetch(url, config);
        if (!retryResponse.ok) throw new Error(retryResponse.statusText);
        return retryResponse.blob();
      } else {
        this.clearAuthCookies();
        throw new Error('Unauthorized');
      }
    }

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();
