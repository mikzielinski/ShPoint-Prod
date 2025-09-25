const KEY = "shpoint.squads.v1";
export function loadSquads() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
export function saveSquads(squads) {
    localStorage.setItem(KEY, JSON.stringify(squads));
}
export function upsertSquad(squads, s) {
    const idx = squads.findIndex((x) => x.id === s.id);
    const next = [...squads];
    if (idx >= 0)
        next[idx] = s;
    else
        next.unshift(s);
    saveSquads(next);
    return next;
}
export function deleteSquad(squads, id) {
    const next = squads.filter((x) => x.id !== id);
    saveSquads(next);
    return next;
}
