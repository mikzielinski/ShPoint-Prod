export function collectUnknownFactions(chars) {
    const s = new Set();
    for (const c of chars) {
        const u = c.meta?.unknownFactions ?? [];
        for (const x of u)
            s.add(x);
    }
    return Array.from(s).sort();
}
