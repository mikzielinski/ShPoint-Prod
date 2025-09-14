import { useMemo, useState } from "react";
import { normalizeCharacters, type Character } from "./types";
import { buildFacets } from "./facets";
import { applyFilters, type Filters } from "./filtering";
import rawData from "../../../data/characters.json"; // ← z poziomu src/lib/shpoint/characters

export function useCharacterFilters(opts?: { exposeAll?: boolean }) {
  const [filters, setFilters] = useState<Filters>({
    text: "",
    unitTypes: [],
    factions: [],
    eras: [],
    tags: [],
    squadPoints: undefined,
    hasSet: null,
  });

  const { all, facets, filtered } = useMemo(() => {
    const all = normalizeCharacters(rawData as any);
    const facets = buildFacets(all);
    const withRange = {
      ...filters,
      squadPoints:
        filters.squadPoints ??
        ([facets.squadPointsMin, facets.squadPointsMax] as [number, number]),
    };
    const filtered = applyFilters(all, withRange);
    return { all, facets, filtered };
  }, [filters]);

  if (opts?.exposeAll) return { filters, setFilters, facets, filtered, all } as const;
  return { filters, setFilters, facets, filtered } as const;
}