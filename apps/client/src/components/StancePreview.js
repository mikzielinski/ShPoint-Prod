import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Box({ title, children }) {
    return (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("div", { className: "mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500", children: title }), children] }));
}
function Pretty({ value }) {
    return (_jsx("pre", { className: "max-h-[420px] overflow-auto rounded-md bg-slate-50 p-3 text-[13px] leading-5 text-slate-800", children: JSON.stringify(value ?? {}, null, 2) }));
}
/**
 * Możesz podać `stance` (już wczytane), a jeśli nie podasz – komponent i tak renderuje pusty,
 * bo CharacterModal ładuje stance.json i przekazuje tutaj.
 */
export default function StancePreview({ unitId, stance, }) {
    const hasDice = Boolean(stance?.dice);
    const hasExpertise = Boolean(stance?.expertise);
    const hasTree = Boolean(stance?.tree);
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsx(Box, { title: "Dice / Expertise", children: hasDice || hasExpertise ? (_jsx(Pretty, { value: { dice: stance?.dice ?? "—", expertise: stance?.expertise ?? "—" } })) : (_jsx("div", { className: "text-[14px] text-slate-500", children: "Brak metryk kostek lub tabeli expertise w stance.json." })) }), _jsx(Box, { title: "Stance tree", children: hasTree ? (_jsx(Pretty, { value: { tree: stance?.tree } })) : (_jsxs("div", { className: "text-[14px] text-slate-500", children: ["Brak pola ", _jsx("code", { children: "tree" }), " w stance.json."] })) })] }));
}
