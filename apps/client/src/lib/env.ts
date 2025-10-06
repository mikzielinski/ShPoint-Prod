// apps/client/src/lib/env.ts
// Jedno źródło prawdy dla adresu API w kliencie (Vite)

const ie = (import.meta as any)?.env ?? {};
const we = (window as any) || {};

export const BUILD = {
  VITE_API_BASE: ie.VITE_API_BASE,
  VITE_SERVER_URL: ie.VITE_SERVER_URL,
  MODE: ie.MODE,
  PROD: !!ie.PROD,
};

// fallbacki runtime (gdybyś chciał wstrzykiwać przez window.__API_BASE__)
const RUNTIME_API =
  (we.__SERVER_URL__ as string) ||
  (we.__API_BASE__ as string) ||
  undefined;

// Używamy bezpośrednio Render (żeby cookies miały właściwą domenę)
export const API_ORIGIN =
  BUILD.VITE_SERVER_URL ||
  BUILD.VITE_API_BASE ||
  RUNTIME_API ||
  'https://shpoint-prod.onrender.com';

// Legacy API_BASE for backward compatibility
export const API_BASE: string = API_ORIGIN;

// Helper do budowania ścieżek: api("/auth/status") -> "http://.../auth/status"
export function api(path = ""): string {
  const p = String(path || "");
  
  // Zawsze używamy bezpośrednio Render (żeby cookies miały właściwą domenę)
  const fullUrl = `${API_ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
  console.log('🔍 api() called with path:', path, '-> direct backend URL:', fullUrl);
  return fullUrl;
}
