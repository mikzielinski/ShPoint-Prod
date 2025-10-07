// src/lib/api.ts
import { API_ORIGIN, api } from './env';

// Re-export api function for backward compatibility
export { api };

// Helper function to add Authorization header with JWT token
export function getAuthHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  const token = localStorage.getItem('shpoint_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Authenticated fetch wrapper
export async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('shpoint_auth_token');
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers
  });
}

// lekki retry dla endpointów, które „czasem nie ładują"
export async function apiWithRetry(path: string, init: RequestInit = {}, tries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const url = api(path);
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('shpoint_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> || {})
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        credentials: 'include',
        headers,
        ...init,
      });
      
      // 2xx – ok, 401/403 zwykle nie ma sensu retry'ować
      if (res.ok || res.status === 401 || res.status === 403) return res;
      
      // 5xx errors - retry
      if (res.status >= 500) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`🔄 Retry ${i + 1}/${tries} failed for ${path}:`, e);
      
      // Don't retry on the last attempt
      if (i === tries - 1) {
        break;
      }
      
      // Exponential backoff: 300ms, 600ms, 1200ms
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr ?? new Error('apiWithRetry failed');
}

// Force Netlify rebuild - v1.2.32 - Disabled security + enhanced game details

type Json = Record<string, unknown> | unknown[];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = api(path);
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('shpoint_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {})
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    credentials: 'include',                    // <-- konieczne
    headers,
    ...init,
  });

  if (!res.ok) {
    // Rzuć 404/500 dalej – UI to ładnie pokaże
    const text = await res.text().catch(() => '');
    const err = new Error(`${res.status} ${res.statusText} — ${text}`);
    (err as any).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export type Character = {
  id: string;
  name: string;
  characterNames?: string;
  boxSetCode?: string;
  unit_type?: 'Primary' | 'Secondary' | 'Support';
  squad_points?: number;
  point_cost?: number;
  force?: number;
  stamina?: number;
  durability?: number;
  number_of_characters?: number;
  role?: string;
  faction?: string;
  factions?: string[];
  period?: string[];
  portrait?: string;
  tags?: string[];
  sp?: number;
  pc?: number;
  set_code?: string;
  searchable?: string;
};

export async function getCharacters(): Promise<Character[]> {
  try {
    // Twój dotychczasowy endpoint
    return await request<Character[]>('/api/characters');
  } catch (e: any) {
    // Jeżeli w devie nie ma backendu → pokaż komunikat i zwróć pustą listę,
    // żeby UI się nie rozsypał.
    if (e?.status === 404) {
      console.warn('[api] /api/characters => 404 (backend nie działa?) – zwracam []');
      return [];
    }
    throw e;
  }
}

// Collections API
export type Collection = {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  items: CollectionItem[];
};

export type CollectionItem = {
  id: string;
  cardId: string;
  status: 'OWNED' | 'PAINTED' | 'WISHLIST';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getCollections(): Promise<Collection[]> {
  return request<Collection[]>('/api/collections');
}

export async function createCollection(title?: string): Promise<{ collection: Collection }> {
  return request<{ collection: Collection }>('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

export async function getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
  return request<CollectionItem[]>(`/api/collections/${collectionId}/items`);
}

export async function updateCollectionItem(
  collectionId: string,
  cardId: string,
  status: 'OWNED' | 'PAINTED' | 'WISHLIST',
  notes?: string
): Promise<{ item: CollectionItem }> {
  return request<{ item: CollectionItem }>(`/api/collections/${collectionId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, status, notes }),
  });
}

export async function deleteCollectionItem(collectionId: string, itemId: string): Promise<void> {
  return request<void>(`/api/collections/${collectionId}/items/${itemId}`, {
    method: 'DELETE',
  });
}
