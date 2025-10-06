/**
 * Converts semantic version string to numeric code for database storage
 * @param v - Version string (e.g., "1.2.3") or number or null/undefined
 * @returns Numeric code (e.g., "1.2.3" -> 10203)
 */
export function semverToCode(v?: string | number | null): number {
  if (v == null) return 10000;            // 1.0.0
  if (typeof v === 'number') return v;
  
  const [maj = '1', min = '0', pat = '0'] = v.split('.');
  const M = parseInt(maj, 10) || 1;
  const m = parseInt(min, 10) || 0;
  const p = parseInt(pat, 10) || 0;
  
  return M * 10000 + m * 100 + p;         // 1.2.3 -> 10203
}

/**
 * Converts numeric code back to semantic version string
 * @param code - Numeric code (e.g., 10203)
 * @returns Semantic version string (e.g., "1.2.3")
 */
export function codeToSemver(code: number): string {
  const M = Math.floor(code / 10000);
  const m = Math.floor((code % 10000) / 100);
  const p = code % 100;
  
  return `${M}.${m}.${p}`;
}
