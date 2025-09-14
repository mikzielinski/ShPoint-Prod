import type { Character } from "./types";

export interface Facets {
  unitTypes: string[];
  factions: string[];
  eras: string[];
  tags: string[];
  squadPointsMin: number;
  squadPointsMax: number;
  hasSetCode: ("With set" | "No set")[];
}

export function buildFacets(chars: Character[]): Facets {
  const unit = new Set<string>();
  const fac = new Set<string>();
  const era = new Set<string>();
  const tag = new Set<string>();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const c of chars) {
    if (c.unit_type) unit.add(c.unit_type);
    c.factions.forEach((x) => fac.add(x));
    c.period.forEach((x) => era.add(x));
    (c.tags ?? []).forEach((x) => tag.add(x));
    if (typeof c.squad_points === "number") {
      min = Math.min(min, c.squad_points);
      max = Math.max(max, c.squad_points);
    }
  }
  if (!isFinite(min)) { min = 0; max = 10; }

  return {
    unitTypes: Array.from(unit).sort(),
    factions: Array.from(fac).sort(),
    eras: Array.from(era).sort(),
    tags: Array.from(tag).sort(),
    squadPointsMin: min,
    squadPointsMax: max,
    hasSetCode: ["With set", "No set"],
  };
}