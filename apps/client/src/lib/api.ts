// src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || '';

type Json = Record<string, unknown> | unknown[];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
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
  role?: string;
  faction?: string;
  portrait?: string;
  tags?: string[];
  sp?: number;
  pc?: number;
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
