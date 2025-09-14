import type { Character } from "./types";

export function collectUnknownFactions(chars: Character[]): string[] {
  const s = new Set<string>();
  for (const c of chars) {
    const u = c.meta?.unknownFactions ?? [];
    for (const x of u) s.add(x);
  }
  return Array.from(s).sort();
}