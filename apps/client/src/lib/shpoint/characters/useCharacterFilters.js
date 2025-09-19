import { useMemo, useState } from "react";
import { normalizeCharacters } from "./types";
import { buildFacets } from "./facets";
import { applyFilters } from "./filtering";
import rawData from "../../../data/characters.json"; // ← z poziomu src/lib/shpoint/characters
export function useCharacterFilters(opts) {
    const [filters, setFilters] = useState({
        text: "",
        unitTypes: [],
        factions: [],
        eras: [],
        tags: [],
        squadPoints: undefined,
        hasSet: null,
    });
    const { all, facets, filtered } = useMemo(() => {
        const all = normalizeCharacters(rawData);
        const facets = buildFacets(all);
        const withRange = {
            ...filters,
            squadPoints: filters.squadPoints ??
                [facets.squadPointsMin, facets.squadPointsMax],
        };
        const filtered = applyFilters(all, withRange);
        return { all, facets, filtered };
    }, [filters]);
    if (opts?.exposeAll)
        return { filters, setFilters, facets, filtered, all };
    return { filters, setFilters, facets, filtered };
}
