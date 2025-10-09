import { useMemo, useState, useEffect } from "react";
import { normalizeCharacters, type Character } from "./types";
import { buildFacets } from "./facets";
import { applyFilters, type Filters } from "./filtering";
import { getCharacters } from "../../api";

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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load characters from API
  useEffect(() => {
    let mounted = true;
    
    const loadCharacters = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiCharacters = await getCharacters();
        if (mounted) {
          setCharacters(apiCharacters as any);
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Failed to load characters:', err);
          setError(err.message || 'Failed to load characters');
          setCharacters([]); // Fallback to empty array
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCharacters();
    
    return () => {
      mounted = false;
    };
  }, []);

  const { all, facets, filtered } = useMemo(() => {
    const all = normalizeCharacters(characters as any);
    const facets = buildFacets(all);
    const withRange = {
      ...filters,
      squadPoints:
        filters.squadPoints ??
        ([facets.squadPointsMin, facets.squadPointsMax] as [number, number]),
    };
    const filtered = applyFilters(all, withRange);
    return { all, facets, filtered };
  }, [characters, filters]);

  if (opts?.exposeAll) return { filters, setFilters, facets, filtered, all, loading, error } as const;
  return { filters, setFilters, facets, filtered, loading, error } as const;
}