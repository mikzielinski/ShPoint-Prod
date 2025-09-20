import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbilityCard } from "./AbilityCard";
// mapuj [[token]] -> znak z Twojej czcionki ShatterpointIcons
const GLYPH_MAP = {
    force: "\u0076", // v - sp-force
    dash: "\u0068", // h - sp-dash
    jump: "\ue90f", // sp-jump
    crit: "\u0062", // b - sp-critical
    hit: "\u0061", // a - sp-strike
    block: "\u0065", // e - sp-block
};
function renderWithGlyphs(text) {
    if (!text)
        return null;
    const re = /\[\[([^[\]]+)\]\]/g;
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
        if (m.index > last)
            out.push(text.slice(last, m.index));
        const token = m[1].trim().toLowerCase();
        const g = GLYPH_MAP[token];
        out.push(g ? (_jsx("span", { title: token, style: {
                fontFamily: "ShatterpointIcons, inherit",
                fontSize: "1.05em",
                margin: "0 2px",
            }, children: g }, `${m.index}-${token}`)) : (m[0]));
        last = m.index + m[0].length;
    }
    if (last < text.length)
        out.push(text.slice(last));
    return out;
}
function StatPill({ label, value }) {
    return (_jsxs("div", { style: {
            border: "2px solid #60a5fa", // Jasna niebieska ramka
            borderRadius: 10,
            padding: "8px 12px",
            minWidth: 160,
            background: "#1e293b", // Ciemne niebieskie tło
            color: "#f8fafc" // Bardzo jasne litery
        }, children: [_jsx("div", { style: { fontSize: 12, color: "#cbd5e1", marginBottom: 6 }, children: label }), _jsx("div", { style: { fontWeight: 600 }, children: value ?? "—" })] }));
}
export default function UnitDataCard({ character, data }) {
    const c = { ...character, ...(data || {}) };
    const stamina = c.stamina ?? "—";
    const durability = c.durability ?? "—";
    const force = (typeof c.force === "number" ? c.force : null) ?? 0;
    // Use local portrait.png instead of external image
    const portrait = c.id ? `/characters/${c.id}/portrait.png` : null;
    const legacyAbilities = Array.isArray(c.abilities) ? c.abilities : [];
    const structuredAbilities = Array.isArray(c.structuredAbilities) ? c.structuredAbilities : [];
    const factions = Array.isArray(c.factions) ? c.factions : null;
    return (_jsx("div", { style: { display: "grid", gap: 16 }, children: _jsxs("div", { style: {
                display: "grid",
                gridTemplateColumns: "280px 1fr",
                gap: "24px",
                background: "#0f172a", // Ciemne niebieskie tło
                border: "2px solid #3b82f6", // Niebieska ramka
                borderRadius: 12,
                padding: "24px",
                alignItems: "start"
            }, children: [_jsx("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%"
                    }, children: portrait ? (_jsx("img", { src: portrait, alt: c.name, style: {
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            objectPosition: "center",
                            display: "block",
                            aspectRatio: "3 / 4",
                            borderRadius: "8px"
                        }, loading: "lazy" })) : (_jsx("div", { style: { padding: 16, color: "#9CA3AF" }, children: "No portrait" })) }), _jsxs("div", { style: {
                        display: "grid",
                        gap: 16,
                        color: "#f8fafc" // Bardzo jasne litery
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: "20px", marginBottom: "8px" }, children: c.name.toUpperCase() }), _jsxs("div", { style: { fontSize: "14px", color: "#cbd5e1", marginBottom: "12px" }, children: [c.name, " \u2022 Primary Unit"] }), factions && factions.length > 0 && (_jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: factions.map((f) => (_jsx("span", { style: {
                                            display: "inline-block",
                                            padding: "6px 12px",
                                            borderRadius: 999,
                                            border: "2px solid #60a5fa",
                                            background: "#1e293b",
                                            fontSize: 12,
                                            color: "#f8fafc",
                                            fontWeight: 600
                                        }, children: f }, f))) }))] }), _jsxs("div", { style: {
                                display: "grid",
                                gap: 12,
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                            }, children: [_jsx(StatPill, { label: "Stamina", value: stamina }), _jsx(StatPill, { label: "Durability", value: durability }), _jsx(StatPill, { label: "Force", value: force })] }), _jsx("div", { style: {
                                border: "2px solid #60a5fa", // Jasna niebieska ramka
                                borderRadius: 12,
                                background: "#1e293b", // Ciemne niebieskie tło
                                padding: "16px",
                                maxHeight: 400, // Większa wysokość dla scrollowania
                                overflow: "auto"
                            }, children: _jsx("div", { style: {
                                    fontSize: 14,
                                    color: "#f8fafc" // Bardzo jasne litery
                                }, children: structuredAbilities.length > 0 ? (
                                /* Use new structured abilities with icons */
                                _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: structuredAbilities.map((ability, i) => (_jsx(AbilityCard, { ability: ability, size: "sm", showForceCost: true, showTrigger: false }, `structured-${i}`))) })) : legacyAbilities.length > 0 ? (
                                /* Fallback to legacy abilities */
                                _jsx("ul", { style: { margin: 0, paddingLeft: 18 }, children: legacyAbilities.map((ab, i) => (_jsxs("li", { style: { marginBottom: 10 }, children: [ab.title && (_jsx("div", { style: { fontWeight: 700, marginBottom: 4 }, children: renderWithGlyphs(ab.title) })), ab.text && (_jsx("div", { style: { color: "#f8fafc" }, children: renderWithGlyphs(ab.text) }))] }, `legacy-${i}`))) })) : (_jsx("div", { style: { color: "#cbd5e1" }, children: "Brak umiej\u0119tno\u015Bci." })) }) })] })] }) }));
}
