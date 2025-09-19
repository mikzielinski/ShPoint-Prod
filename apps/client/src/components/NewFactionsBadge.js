import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function NewFactionsBadge({ count, onClick, }) {
    if (count <= 0)
        return null;
    return (_jsxs("button", { onClick: onClick, className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/70 text-yellow-900 text-sm hover:bg-yellow-200 transition", title: "Review new/unknown factions", children: [_jsx("span", { children: "\u26A0\uFE0F New factions detected" }), _jsxs("span", { className: "font-semibold", children: ["(", count, ")"] })] }));
}
