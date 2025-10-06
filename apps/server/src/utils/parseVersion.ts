/**
 * Parse version string/number to integer for database storage
 * @param v - Version value (string, number, or unknown)
 * @param fallback - Fallback value if parsing fails
 * @returns Integer version code
 */
export function parseVersionToInt(v: unknown, fallback = 1): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (!v) return fallback;
  
  const major = String(v).trim().split('.')[0];   // "1.0.0" -> "1"
  const n = parseInt(major, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize string or array to string (for unitType, etc.)
 * @param v - Value to normalize
 * @param fallback - Fallback value if normalization fails
 * @returns String value
 */
export function asStringOrFirst(v: unknown, fallback: string | null = null): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
  return fallback;
}
