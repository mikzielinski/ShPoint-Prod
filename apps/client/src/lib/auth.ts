// apps/client/src/lib/auth.ts
import { API_ORIGIN } from './env';

export function loginWithGoogle(returnTo = '/') {
  const url = `${API_ORIGIN}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  window.location.assign(url);        // ⬅️ pełna nawigacja, NIE fetch!
}

export function logout() {
  window.location.assign(`${API_ORIGIN}/auth/logout`);
}
