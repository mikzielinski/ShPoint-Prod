// src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || '';
async function request(path, init) {
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
        err.status = res.status;
        throw err;
    }
    return (await res.json());
}
export async function getCharacters() {
    try {
        // Twój dotychczasowy endpoint
        return await request('/api/characters');
    }
    catch (e) {
        // Jeżeli w devie nie ma backendu → pokaż komunikat i zwróć pustą listę,
        // żeby UI się nie rozsypał.
        if (e?.status === 404) {
            console.warn('[api] /api/characters => 404 (backend nie działa?) – zwracam []');
            return [];
        }
        throw e;
    }
}
export async function getCollections() {
    return request('/api/collections');
}
export async function createCollection(title) {
    return request('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
}
export async function getCollectionItems(collectionId) {
    return request(`/api/collections/${collectionId}/items`);
}
export async function updateCollectionItem(collectionId, cardId, status, notes) {
    return request(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, status, notes }),
    });
}
export async function deleteCollectionItem(collectionId, itemId) {
    return request(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
    });
}
