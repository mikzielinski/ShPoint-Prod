export function validateSquad(squad, allCards) {
    const errors = [];
    const units = squad.units
        .map((u) => allCards.find((c) => c.id === u.cardId))
        .filter(Boolean);
    const total = units.reduce((a, c) => a + (c?.points ?? 0), 0);
    if (total !== squad.totalPoints) {
        errors.push(`Suma punktów (${total}) ≠ limit ${squad.totalPoints}.`);
    }
    const primaries = units.filter((u) => u.role === "Primary").length;
    if (primaries < 1)
        errors.push("Brak jednostki Primary.");
    // Dalsze zasady dopniemy później (fakcje/unikalność).
    return { ok: errors.length === 0, errors, calcTotal: total };
}
