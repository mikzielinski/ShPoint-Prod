// apps/client/src/lib/env.ts
// Jedno źródło prawdy dla adresu API w kliencie (Vite)
export const API_BASE = (() => {
    const raw = import.meta?.env?.VITE_API_BASE ??
        (typeof window !== "undefined" ? window.__API_BASE__ : undefined) ??
        "http://localhost:3001"; // domyślnie backend dev
    // Normalizacja: trim + bez końcowego "/"
    let url = String(raw).trim().replace(/\/+$/, "");
    // Jeśli ktoś poda względną ścieżkę (np. "/api"), zrób z niej absolutny URL
    if (/^\/(?!\/)/.test(url) && typeof window !== "undefined") {
        url = `${window.location.origin}${url}`;
    }
    return url;
})();
// Helper do budowania ścieżek: api("/auth/status") -> "http://.../auth/status"
export function api(path = "") {
    const p = String(path || "");
    return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
}
