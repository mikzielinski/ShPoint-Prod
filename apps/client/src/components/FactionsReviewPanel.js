import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { updateTaxonomy } from "../lib/shpoint/characters/taxoApi";
export function FactionsReviewPanel({ unknown, knownFactions, onClose, onUpdated, }) {
    const [selected, setSelected] = useState(unknown);
    const [aliases, setAliases] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const canSubmit = selected.length > 0 || Object.keys(aliases).length > 0;
    const toggle = (f) => {
        setSelected((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
    };
    const handleSave = async () => {
        setBusy(true);
        setError(null);
        try {
            const payload = {};
            if (selected.length)
                payload.addKnown = selected;
            if (Object.keys(aliases).length)
                payload.addAliases = aliases;
            await updateTaxonomy(payload);
            onUpdated();
            onClose();
        }
        catch (e) {
            setError(e.message ?? String(e));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl w-full max-w-2xl", children: [_jsxs("div", { className: "p-4 border-b", children: [_jsx("div", { className: "text-lg font-semibold", children: "Review new factions" }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Select which values to promote to ", _jsx("b", { children: "knownFactions" }), " and/or define aliases."] })] }), _jsxs("div", { className: "p-4 grid md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium mb-2", children: "Unknown values" }), _jsxs("ul", { className: "space-y-2 max-h-64 overflow-auto pr-1", children: [unknown.map((f) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("input", { id: `chk-${f}`, type: "checkbox", className: "checkbox", checked: selected.includes(f), onChange: () => toggle(f) }), _jsx("label", { htmlFor: `chk-${f}`, className: "cursor-pointer", children: f })] }, f))), !unknown.length && (_jsx("div", { className: "text-sm text-gray-500", children: "Nothing to review \uD83C\uDF89" }))] })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium mb-2", children: "Aliases (optional)" }), _jsx("div", { className: "text-xs text-gray-500 mb-2", children: "Map a variant on the left to a canonical faction on the right." }), _jsx(AliasEditor, { unknown: unknown, known: knownFactions, onChange: setAliases })] })] }), error && _jsx("div", { className: "px-4 pb-2 text-red-600 text-sm", children: error }), _jsxs("div", { className: "p-4 border-t flex gap-2 justify-end", children: [_jsx("button", { className: "btn", onClick: onClose, disabled: busy, children: "Cancel" }), _jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: !canSubmit || busy, children: busy ? "Saving…" : "Save" })] })] }) }));
}
function AliasEditor({ unknown, known, onChange, }) {
    const [rows, setRows] = useState([]);
    const addRow = () => setRows((r) => [...r, { from: "", to: "" }]);
    const updateRow = (i, k, v) => {
        const next = [...rows];
        next[i] = { ...next[i], [k]: v };
        setRows(next);
        const dict = {};
        for (const row of next)
            if (row.from && row.to)
                dict[row.from] = row.to;
        onChange(dict);
    };
    const removeRow = (i) => {
        const next = rows.filter((_, idx) => idx !== i);
        setRows(next);
        const dict = {};
        for (const row of next)
            if (row.from && row.to)
                dict[row.from] = row.to;
        onChange(dict);
    };
    return (_jsxs("div", { className: "space-y-2", children: [rows.map((row, i) => (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsxs("select", { className: "select select-bordered w-40", value: row.from, onChange: (e) => updateRow(i, "from", e.target.value), children: [_jsx("option", { value: "", children: "Unknown\u2026" }), unknown.map((u) => (_jsx("option", { value: u, children: u }, u)))] }), _jsx("span", { className: "opacity-60", children: "\u2192" }), _jsxs("select", { className: "select select-bordered w-48", value: row.to, onChange: (e) => updateRow(i, "to", e.target.value), children: [_jsx("option", { value: "", children: "Canonical\u2026" }), known.map((k) => (_jsx("option", { value: k, children: k }, k)))] }), _jsx("button", { className: "btn btn-ghost", onClick: () => removeRow(i), children: "\u2715" })] }, i))), _jsx("button", { className: "btn btn-outline btn-sm", onClick: addRow, children: "Add alias" })] }));
}
