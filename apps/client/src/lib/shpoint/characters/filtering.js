export function applyFilters(chars, f) {
    const q = (f.text ?? "").trim().toLowerCase();
    return chars.filter((c) => {
        if (q && !c.searchable.includes(q))
            return false;
        if (f.unitTypes?.length && !f.unitTypes.includes(c.unit_type ?? ""))
            return false;
        if (f.factions?.length && !c.factions.some((x) => f.factions.includes(x)))
            return false;
        if (f.eras?.length && !c.period.some((x) => f.eras.includes(x)))
            return false;
        if (f.tags?.length && !c.tags?.some((x) => f.tags.includes(x)))
            return false;
        if (f.squadPoints) {
            const [min, max] = f.squadPoints;
            const sp = c.squad_points;
            if (typeof sp !== "number" || sp < min || sp > max)
                return false;
        }
        if (f.hasSet) {
            const has = c.set_code ? "With set" : "No set";
            if (has !== f.hasSet)
                return false;
        }
        return true;
    });
}
