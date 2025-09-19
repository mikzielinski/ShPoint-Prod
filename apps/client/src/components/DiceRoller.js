import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { rollDice, summarizeDice, summaryToString, } from "@shpoint/shared";
/** Ikonki + kolory dla symboli */
const SYMBOL_META = {
    crit: { label: "Crit", icon: "✸", className: "text-red-400" },
    success: { label: "Success", icon: "◆", className: "text-red-300" },
    strike: { label: "Strike", icon: "✖", className: "text-red-200" },
    fail: { label: "Failure", icon: "×", className: "text-gray-400" },
    expertise: { label: "Expertise", icon: "✦", className: "text-amber-300" },
};
function Chip({ symbol, size = "md", muted = false, }) {
    const meta = SYMBOL_META[symbol];
    const base = "inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5";
    const sz = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
    const clr = muted ? "text-gray-400" : meta.className;
    return (_jsx("div", { className: `${base} ${sz} ${clr}`, title: meta.label, children: _jsx("span", { className: "leading-none", children: meta.icon }) }));
}
function SymbolPicker({ onPick, title, }) {
    return (_jsxs("div", { children: [title ? (_jsx("div", { className: "text-xs uppercase tracking-wide text-gray-400 mb-2", children: title })) : null, _jsx("div", { className: "flex gap-2", children: Object.keys(SYMBOL_META).map((s) => (_jsxs("button", { type: "button", className: "rounded-md border border-white/10 bg-white/10 hover:bg-white/20 px-2 py-1 text-xs", onClick: () => onPick(s), title: `Add ${SYMBOL_META[s].label}`, children: [_jsx("span", { className: `${SYMBOL_META[s].className} mr-1`, children: SYMBOL_META[s].icon }), SYMBOL_META[s].label] }, s))) })] }));
}
function RowCard({ title, children, }) {
    return (_jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [_jsx("div", { className: "text-sm font-semibold tracking-wide text-gray-200 mb-3", children: title }), children] }));
}
export default function DiceRoller() {
    const [tab, setTab] = useState("attack");
    const [attackCount, setAttackCount] = useState(5);
    const [defenseCount, setDefenseCount] = useState(4);
    const [attackManual, setAttackManual] = useState([]);
    const [defenseManual, setDefenseManual] = useState([]);
    const [attackRoll, setAttackRoll] = useState(null);
    const [defenseRoll, setDefenseRoll] = useState(null);
    const [logs, setLogs] = useState([]);
    /** Wynik do UI */
    const attackAll = useMemo(() => {
        if (!attackRoll && attackManual.length === 0)
            return null;
        return [...(attackRoll ?? []), ...attackManual];
    }, [attackRoll, attackManual]);
    const defenseAll = useMemo(() => {
        if (!defenseRoll && defenseManual.length === 0)
            return null;
        return [...(defenseRoll ?? []), ...defenseManual];
    }, [defenseRoll, defenseManual]);
    const attackSummary = useMemo(() => (attackAll ? summarizeDice(attackAll) : null), [attackAll]);
    const defenseSummary = useMemo(() => (defenseAll ? summarizeDice(defenseAll) : null), [defenseAll]);
    const rollAttack = () => {
        const raw = rollDice(attackCount);
        setAttackRoll(raw);
    };
    const rollDefense = () => {
        const raw = rollDice(defenseCount);
        setDefenseRoll(raw);
    };
    const clearAttackManual = () => setAttackManual([]);
    const clearDefenseManual = () => setDefenseManual([]);
    const removeLastAttack = () => setAttackManual((arr) => arr.slice(0, Math.max(0, arr.length - 1)));
    const removeLastDefense = () => setDefenseManual((arr) => arr.slice(0, Math.max(0, arr.length - 1)));
    const addAttackSymbol = (s) => setAttackManual((arr) => [...arr, s]);
    const addDefenseSymbol = (s) => setDefenseManual((arr) => [...arr, s]);
    /** Prosta metryka “prawdopodobieństwa” (placeholder do MVP):
     *  score = crit*2 + success - fail ; procent = sigmoid(score / totalDice)
     */
    const calcProb = (sum, total) => {
        if (!sum || total <= 0)
            return 0;
        const score = sum.crit * 2 + sum.success - sum.fail;
        const x = score / total;
        const pct = 1 / (1 + Math.exp(-x)); // 0..1
        return Math.round(pct * 10000) / 100; // %
    };
    const onCalculate = () => {
        const a = attackSummary ?? summarizeDice([]);
        const d = defenseSummary ?? summarizeDice([]);
        const item = {
            ts: new Date().toISOString(),
            attack: attackAll ?? [],
            defense: defenseAll ?? [],
            attackSummary: a,
            defenseSummary: d,
            note: tab === "attack" ? "Attack" : "Defense",
        };
        setLogs((prev) => [item, ...prev]);
    };
    const exportLogs = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shatterpoint-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const clearLogs = () => setLogs([]);
    return (_jsxs("div", { className: "max-w-5xl mx-auto p-4 md:p-6 text-gray-100", children: [_jsx("div", { className: "mb-4", children: _jsx("h1", { className: "text-2xl font-bold", children: "SHATTERPOINT DICE ROLLER" }) }), _jsxs("div", { className: "mb-4 flex gap-2", children: [_jsx("button", { className: `px-3 py-1 rounded-md border text-sm ${tab === "attack"
                            ? "bg-red-500/80 border-red-400"
                            : "bg-white/10 border-white/10 hover:bg-white/20"}`, onClick: () => setTab("attack"), children: "Attack" }), _jsx("button", { className: `px-3 py-1 rounded-md border text-sm ${tab === "defense"
                            ? "bg-blue-500/80 border-blue-400"
                            : "bg-white/10 border-white/10 hover:bg-white/20"}`, onClick: () => setTab("defense"), children: "Defense" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(RowCard, { title: "PLAYER ROLL", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-xs w-24", children: "PLAYER DICE:" }), _jsx("input", { type: "number", className: "w-20 rounded-md bg-white/10 border border-white/10 px-2 py-1", value: attackCount, min: 0, onChange: (e) => setAttackCount(Math.max(0, Number(e.target.value))) }), _jsx("button", { type: "button", className: "rounded-md bg-yellow-600 hover:bg-yellow-500 px-3 py-1 text-sm", onClick: rollAttack, children: "ROLL PLAYER" })] }), _jsx("div", { className: "mt-3 rounded-md bg-white/5 border border-white/10 p-3 min-h-[56px] flex items-center gap-2 flex-wrap", children: attackAll && attackAll.length > 0 ? (attackAll.map((s, i) => _jsx(Chip, { symbol: s }, `${s}-${i}`))) : (_jsx("span", { className: "text-gray-400 text-sm", children: "No dice yet." })) }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Player & Opponent cannot roll manually added dice." }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(SymbolPicker, { title: "MANUAL ADD:", onPick: (s) => addAttackSymbol(s) }), _jsxs("div", { className: "flex gap-2 ml-auto", children: [_jsx("button", { className: "px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs", onClick: removeLastAttack, children: "Remove last" }), _jsx("button", { className: "px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs", onClick: clearAttackManual, children: "Clear manual" })] })] })] }), _jsxs(RowCard, { title: "OPPONENT DEFENSE ROLL", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-xs w-24", children: "OPPONENT DICE:" }), _jsx("input", { type: "number", className: "w-20 rounded-md bg-white/10 border border-white/10 px-2 py-1", value: defenseCount, min: 0, onChange: (e) => setDefenseCount(Math.max(0, Number(e.target.value))) }), _jsx("button", { type: "button", className: "rounded-md bg-yellow-600 hover:bg-yellow-500 px-3 py-1 text-sm", onClick: rollDefense, children: "ROLL OPPONENT" })] }), _jsx("div", { className: "mt-3 rounded-md bg-white/5 border border-white/10 p-3 min-h-[56px] flex items-center gap-2 flex-wrap", children: defenseAll && defenseAll.length > 0 ? (defenseAll.map((s, i) => _jsx(Chip, { symbol: s }, `${s}-${i}`))) : (_jsx("span", { className: "text-gray-400 text-sm", children: "No dice yet." })) }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(SymbolPicker, { title: "MANUAL ADD:", onPick: (s) => addDefenseSymbol(s) }), _jsxs("div", { className: "flex gap-2 ml-auto", children: [_jsx("button", { className: "px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs", onClick: removeLastDefense, children: "Remove last" }), _jsx("button", { className: "px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs", onClick: clearDefenseManual, children: "Clear manual" })] })] }), _jsx("div", { className: "mt-4", children: _jsx("button", { className: "rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-semibold", onClick: onCalculate, children: "CALCULATE RESULTS" }) })] })] }), _jsx("div", { className: "space-y-4", children: _jsxs(RowCard, { title: "LOGS", children: [_jsxs("div", { className: "flex gap-2 mb-3", children: [_jsx("button", { className: "rounded-md bg-red-600 hover:bg-red-500 px-3 py-1 text-sm", onClick: clearLogs, children: "CLEAR LOGS" }), _jsx("button", { className: "rounded-md bg-sky-600 hover:bg-sky-500 px-3 py-1 text-sm", onClick: exportLogs, children: "EXPORT LOGS" })] }), logs.length === 0 ? (_jsx("div", { className: "text-sm text-gray-400", children: "No logs yet." })) : (_jsx("div", { className: "space-y-3 max-h-[520px] overflow-auto pr-1", children: logs.map((l, idx) => {
                                        const aProb = calcProb(l.attackSummary, l.attack.length);
                                        const dProb = calcProb(l.defenseSummary, l.defense.length);
                                        const aExp = l.attackSummary.expertise ?? 0;
                                        const dExp = l.defenseSummary.expertise ?? 0;
                                        return (_jsxs("div", { className: "rounded-md bg-white/5 border border-white/10 p-3", children: [_jsxs("div", { className: "text-[11px] text-gray-400", children: [new Date(l.ts).toLocaleTimeString(), " \u2022 ", l.note] }), _jsxs("div", { className: "text-sm mt-2", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Attacker:" }), " ", summaryToString(l.attackSummary)] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Defender:" }), " ", summaryToString(l.defenseSummary)] }), _jsxs("div", { className: "mt-2", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Result:" }), " ", "Stance 1"] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Probability:" }), " ", "Attacker ", aProb, "% \u2022 Defender ", dProb, "%"] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Expertise Count:" }), " ", "Attacker ", aExp, " \u2022 Defender ", dExp] })] })] })] }, `${l.ts}-${idx}`));
                                    }) }))] }) })] })] }));
}
