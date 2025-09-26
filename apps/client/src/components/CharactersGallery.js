import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { api } from "../lib/env";
import { useCharacterFilters } from "../lib/shpoint/characters/useCharacterFilters";
import { collectUnknownFactions } from "../lib/shpoint/characters/unknownFactions";
import taxo from "@shpoint/shared/data/taxo.json";
import { NewFactionsBadge } from "../components/NewFactionsBadge";
import { FactionsReviewPanel } from "../components/FactionsReviewPanel";
import FiltersPanel from "../components/FiltersPanel";
function useMeRole() {
    const [role, setRole] = useState(undefined);
    useMemo(() => {
        (async () => {
            try {
                const r = await fetch(api("/api/me"), { credentials: "include" });
                if (r.ok) {
                    const j = await r.json();
                    setRole(j?.user?.role);
                }
            }
            catch { }
        })();
    }, []);
    return { role };
}
function uniqueSetCodes(all) {
    const s = new Set();
    for (const c of all) {
        if (c.set_code && typeof c.set_code === "string")
            s.add(c.set_code);
    }
    return Array.from(s).sort();
}
function TinyBadge({ text }) {
    return (_jsx("span", { className: "inline-flex items-center px-2 py-[2px] rounded-full bg-base-300 text-xs", children: text }));
}
function Portrait({ src, alt }) {
    const [ok, setOk] = useState(!!(src && src.trim()));
    if (!ok) {
        return (_jsx("div", { className: "w-full aspect-[4/5] grid place-items-center rounded-lg bg-base-300", children: _jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", "aria-hidden": true, children: _jsx("path", { fill: "currentColor", d: "M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" }) }) }));
    }
    return (_jsx("img", { src: src, alt: alt, loading: "lazy", onError: () => setOk(false), className: "w-full aspect-[4/5] object-cover rounded-lg bg-base-300" }));
}
export default function CharactersPageOLD_DISABLED() {
    const { filters, setFilters, facets, filtered, all } = useCharacterFilters({ exposeAll: true });
    const { role } = useMeRole();
    const canEdit = role === "EDITOR" || role === "ADMIN";
    const unknown = collectUnknownFactions(all);
    const knownFactions = taxo.knownFactions?.slice().sort() ?? [];
    const setCodes = uniqueSetCodes(all);
    const summary = useMemo(() => {
        const chips = [];
        if (filters.unitTypes?.length)
            chips.push(`Type: ${filters.unitTypes.join(", ")}`);
        if (filters.factions?.length)
            chips.push(`Faction: ${filters.factions.join(", ")}`);
        if (filters.eras?.length)
            chips.push(`Era: ${filters.eras.join(", ")}`);
        if (filters.tags?.length)
            chips.push(`Tags: ${filters.tags.slice(0, 3).join(", ")}${filters.tags.length > 3 ? "…" : ""}`);
        if (filters.hasSet)
            chips.push(filters.hasSet);
        return chips;
    }, [filters]);
    const [showPanel, setShowPanel] = useState(false);
    const refreshAfterUpdate = () => location.reload();
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Characters" }), _jsxs("div", { className: "flex items-center gap-2", children: [canEdit && (_jsx("button", { className: "btn btn-sm btn-primary", onClick: () => console.log("TODO: open add card modal"), children: "+ Add new card" })), _jsx(NewFactionsBadge, { count: unknown.length, onClick: () => setShowPanel(true) })] })] }), _jsx(FiltersPanel, { facets: facets, filters: filters, onChange: setFilters, setCodes: setCodes }), _jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsxs("span", { className: "opacity-70", children: ["Results: ", filtered.length] }), filters.text ? _jsx(TinyBadge, { text: `"${filters.text}"` }) : null, summary.map((t) => _jsx(TinyBadge, { text: t }, t)), !!(filters.text || summary.length) && (_jsx("button", { className: "btn btn-ghost btn-xs ml-auto", onClick: () => setFilters({}), title: "Clear all filters", children: "Clear all" }))] }), _jsx("ul", { className: "grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5", children: filtered.map((c) => (_jsxs("li", { className: "card bg-base-200 overflow-hidden", children: [_jsx("div", { className: "p-3", children: _jsx(Portrait, { src: c.portrait, alt: c.name }) }), _jsxs("div", { className: "card-body pt-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("div", { className: "font-medium leading-tight", children: c.name }), _jsxs("div", { className: "text-xs opacity-70 whitespace-nowrap", children: [c.unit_type ?? "—", " \u00B7 ", c.squad_points ?? "—", " SP"] })] }), _jsx("div", { className: "flex flex-wrap gap-1", children: c.factions.map((f) => (_jsx("span", { className: "badge badge-outline", children: f }, f))) }), c.period.length ? _jsx("div", { className: "text-xs opacity-80", children: c.period.join(", ") }) : null, c.tags?.length ? (_jsxs("div", { className: "text-xs line-clamp-1", children: [_jsx("span", { className: "opacity-60", children: "tags: " }), c.tags.slice(0, 6).join(", "), c.tags.length > 6 ? "…" : ""] })) : null, c.meta?.unknownFactions?.length ? (_jsxs("div", { className: "text-[11px] text-amber-700", children: ["\u26A0\uFE0F unknown: ", c.meta.unknownFactions.join(", ")] })) : null, _jsx("div", { className: "mt-1 text-[11px] opacity-60", children: c.set_code ? `Set: ${c.set_code}` : "No set" }), (role === "EDITOR" || role === "ADMIN") && (_jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { className: "btn btn-xs", onClick: () => console.log("TODO: edit", c.id), children: "Edit" }), _jsx("button", { className: "btn btn-xs btn-error", onClick: () => console.log("TODO: delete", c.id), children: "Delete" })] }))] })] }, c.id))) }), showPanel && (_jsx(FactionsReviewPanel, { unknown: unknown, knownFactions: knownFactions, onClose: () => setShowPanel(false), onUpdated: refreshAfterUpdate }))] }));
}
