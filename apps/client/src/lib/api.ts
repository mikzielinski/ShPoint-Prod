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
