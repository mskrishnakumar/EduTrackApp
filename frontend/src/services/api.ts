import type { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Check if we should use mock data (local development without API)
export const USE_MOCK_API = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || 'Request failed',
      response.status,
      data.code
    );
  }

  return data;
}

// Generic API methods
export const api = {
  get: <T>(endpoint: string, token?: string | null): Promise<ApiResponse<T>> =>
    apiRequest(endpoint, { method: 'GET' }, token),

  post: <T>(endpoint: string, body: unknown, token?: string | null): Promise<ApiResponse<T>> =>
    apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }, token),

  put: <T>(endpoint: string, body: unknown, token?: string | null): Promise<ApiResponse<T>> =>
    apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }, token),

  delete: <T>(endpoint: string, token?: string | null): Promise<ApiResponse<T>> =>
    apiRequest(endpoint, { method: 'DELETE' }, token),

  getPaginated: <T>(endpoint: string, token?: string | null): Promise<PaginatedResponse<T>> =>
    apiRequest(endpoint, { method: 'GET' }, token),
};

// Build query string from params
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return filteredParams.length > 0 ? `?${filteredParams.join('&')}` : '';
}
