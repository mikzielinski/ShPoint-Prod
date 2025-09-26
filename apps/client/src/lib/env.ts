// apps/client/src/lib/env.ts
// Jedno źródło prawdy dla adresu API w kliencie (Vite)

export const API_BASE: string = (() => {
  const viteApiBase = (import.meta as any)?.env?.VITE_API_BASE;
  const viteServerUrl = (import.meta as any)?.env?.VITE_SERVER_URL;
  const windowApiBase = (typeof window !== "undefined" ? (window as any).__API_BASE__ : undefined);
  
  // Debug logs
  console.log('🔍 Environment variables in env.ts:');
  console.log('VITE_API_BASE:', viteApiBase);
  console.log('VITE_SERVER_URL:', viteServerUrl);
  console.log('window.__API_BASE__:', windowApiBase);
  
  const raw = viteApiBase ?? viteServerUrl ?? windowApiBase ?? "http://localhost:3001"; // domyślnie backend dev
  
  console.log('🔍 Selected API_BASE:', raw);

  // Normalizacja: trim + bez końcowego "/"
  let url = String(raw).trim().replace(/\/+$/, "");

  // Jeśli ktoś poda względną ścieżkę (np. "/api"), zrób z niej absolutny URL
  if (/^\/(?!\/)/.test(url) && typeof window !== "undefined") {
    url = `${window.location.origin}${url}`;
  }

  console.log('🔍 Final API_BASE:', url);
  return url;
})();

// Helper do budowania ścieżek: api("/auth/status") -> "http://.../auth/status"
export function api(path = ""): string {
  const p = String(path || "");
  const fullUrl = `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  console.log('🔍 api() called with path:', path, '-> full URL:', fullUrl);
  return fullUrl;
}
