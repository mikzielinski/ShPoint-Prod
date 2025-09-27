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

  // W produkcji używaj względnych ścieżek (proxy na Netlify)
  const mode = (import.meta as any)?.env?.MODE;
  const prod = (import.meta as any)?.env?.PROD;
  const isProduction = mode === 'production' || prod === true;
  
  console.log('🔍 MODE:', mode, 'PROD:', prod, 'isProduction:', isProduction);
  
  if (isProduction) {
    console.log('🔍 Production mode: using relative paths for Netlify proxy');
    return ""; // Względne ścieżki - proxy na Netlify
  }
  
  // WYMUSZENIE względnych ścieżek dla Netlify (tymczasowe)
  if (typeof window !== "undefined" && window.location.hostname.includes('netlify.app')) {
    console.log('🔍 Netlify detected: forcing relative paths - CACHE BUST v1.3.1 - FORCE DEPLOY');
    return "";
  }

  const raw = viteApiBase ?? viteServerUrl ?? windowApiBase ?? "https://shpoint-prod.onrender.com"; // domyślnie backend prod

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
  
  // Jeśli to API path, zamień /api/ na /backend-api/ dla Netlify proxy
  if (p.startsWith('/api/') && API_BASE === "") {
    const backendPath = p.replace('/api/', '/backend-api/');
    console.log('🔍 api() called with path:', path, '-> backend path:', backendPath);
    return backendPath;
  }
  
  // Jeśli to AUTH path, zamień /auth/ na /backend-auth/ dla Netlify proxy
  if (p.startsWith('/auth/') && API_BASE === "") {
    const backendPath = p.replace('/auth/', '/backend-auth/');
    console.log('🔍 api() called with path:', path, '-> backend path:', backendPath);
    return backendPath;
  }
  
  const fullUrl = `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  console.log('🔍 api() called with path:', path, '-> full URL:', fullUrl);
  return fullUrl;
}
