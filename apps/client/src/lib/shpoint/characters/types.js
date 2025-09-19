import taxo from "@shpoint/shared/data/taxo.json";
const ERA_FIX = {
    "Galatic Civil War": "Galactic Civil War",
};
const aliasFaction = (x) => taxo.factionAliases?.[x] ?? x;
const known = new Set(taxo.knownFactions ?? []);
const tagRegexes = (taxo.forceTagPatterns ?? []).map((p) => new RegExp(p, "i"));
function looksLikeTag(x) {
    return tagRegexes.some((r) => r.test(x));
}
function fixEra(e) {
    return ERA_FIX[e] ?? e;
}
function normSetCode(s) {
    if (!s)
        return null;
    const m = s.match(/^SWP0?(\d+)$/i);
    return m ? `SWP${String(m[1]).padStart(2, "0")}` : s;
}
function hardFixById(c) {
    if (c.id === "ct-411-commander-ponds")
        return { ...c, factions: ["Galactic Republic"] };
    if (c.id === "ahsoka-tano-jedi-no-more")
        return { ...c, set_code: "SWP01" };
    return c;
}
function splitFactionsAndTags(factions, tags) {
    const f = [];
    const t = new Set(tags ?? []);
    const unknown = [];
    for (const raw of factions ?? []) {
        const val = aliasFaction(raw);
        if (looksLikeTag(val)) {
            t.add(val);
            continue;
        }
        if (known.has(val)) {
            f.push(val);
        }
        else {
            if ((taxo.defaults?.unknownFactionPolicy ?? "demote") === "demote") {
                t.add(val);
                unknown.push(val);
            }
            else {
                f.push(val);
            }
        }
    }
    return { factions: Array.from(new Set(f)), tags: Array.from(t), unknown };
}
export function normalizeCharacters(data) {
    return data.map((raw) => {
        let c = hardFixById(raw);
        if (c.perdiod && !c.period)
            c = { ...c, period: c.perdiod };
        const periodArr = Array.isArray(c.period) ? c.period : c.period ? [c.period] : [];
        const fixedPeriod = Array.from(new Set(periodArr.map((p) => fixEra(p))));
        const { factions, tags, unknown } = splitFactionsAndTags(c.factions, c.tags);
        const setCode = normSetCode(c.set_code);
        const searchable = [
            c.name,
            ...(tags ?? []),
            ...factions,
            ...fixedPeriod,
            c.unit_type ?? "",
            setCode ?? "",
        ]
            .join(" ")
            .toLowerCase();
        const out = {
            ...c,
            period: fixedPeriod,
            factions,
            tags: Array.from(new Set(tags ?? [])),
            set_code: setCode,
            searchable,
        };
        if (unknown.length)
            out.meta = { unknownFactions: Array.from(new Set(unknown)) };
        return out;
    });
}
