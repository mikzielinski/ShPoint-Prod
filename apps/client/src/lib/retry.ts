/**
 * Retry utility for API calls with exponential backoff
 */
export async function fetchWithRetry(
  url: string, 
  init: RequestInit = {}, 
  retries = 3,
  baseMs = 300
): Promise<Response> {
  let lastErr: unknown;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { 
        credentials: 'include', 
        ...init 
      });
      
      // 401/403 don't retry - usually auth issues
      if (res.status === 401 || res.status === 403) {
        return res;
      }
      
      // 2xx and 4xx (except 401/403) are considered successful responses
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      
      // 5xx errors - retry
      if (res.status >= 500) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`🔄 Retry ${i + 1}/${retries} failed for ${url}:`, e);
      
      // Don't retry on the last attempt
      if (i === retries - 1) {
        break;
      }
      
      // Exponential backoff: 300ms, 600ms, 1200ms
      await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
    }
  }
  
  throw lastErr ?? new Error('fetchWithRetry: failed');
}

/**
 * Enhanced API helper with retry logic
 */
export async function apiWithRetry(
  path: string, 
  init: RequestInit = {},
  retries = 3
): Promise<Response> {
  const { api } = await import('./env');
  const url = api(path);
  
  return fetchWithRetry(url, {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    ...init
  }, retries);
}
