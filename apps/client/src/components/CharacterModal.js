import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import UnitDataCard from "./UnitDataCard";
import StanceCard from "./StanceCard";
import { api } from "../lib/env";
export default function CharacterModal({ open, onClose, id, character }) {
    const [tab, setTab] = React.useState("data");
    const [dataObj, setDataObj] = React.useState(null);
    const [stanceObj, setStanceObj] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState(null);
    // Debug log
    React.useEffect(() => {
        if (open && character) {
            console.log('CharacterModal - character prop:', character);
            console.log('CharacterModal - character.portrait:', character.portrait);
        }
    }, [open, character]);
    // preload ikon
    React.useEffect(() => {
        if (!open)
            return;
        (async () => {
            try {
                // @ts-expect-error
                await Promise.allSettled([
                    document?.fonts?.load?.('12px "ShatterpointIcons"'),
                    document?.fonts?.load?.('bold 12px "ShatterpointIcons"'),
                ]);
            }
            catch { }
        })();
    }, [open]);
    // ESC + lock scroll
    React.useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => e.key === "Escape" && onClose();
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);
    // fetch jsonów
    React.useEffect(() => {
        if (!open)
            return;
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const [dRes, sRes] = await Promise.allSettled([
                    fetch(api(`/characters/${id}/data.json`), { cache: "no-store" }),
                    fetch(api(`/characters/${id}/stance.json`), { cache: "no-store" }),
                ]);
                if (!alive)
                    return;
                if (dRes.status === "fulfilled" && dRes.value.ok) {
                    const data = await dRes.value.json();
                    setDataObj(data);
                }
                else {
                    // Use character prop data as fallback
                    setDataObj(character);
                }
                if (sRes.status === "fulfilled" && sRes.value.ok) {
                    setStanceObj(await sRes.value.json());
                }
                else
                    setStanceObj(null);
            }
            catch (e) {
                if (alive) {
                    setErr(e?.message ?? "Failed to load character files.");
                    // Use character prop data as fallback
                    setDataObj(character);
                }
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [open, id, character]);
    if (!open)
        return null;
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", onClick: onClose, style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)', // Ciemniejsze tło
            backdropFilter: 'blur(8px)', // Rozmycie tła
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }, children: _jsxs("div", { className: `modal-sheet ${tab === "stance" ? "is-wide" : "is-roomy"}`, onClick: (e) => e.stopPropagation(), style: {
                width: 'min(1120px, 100%)',
                maxHeight: '92vh',
                overflow: 'auto',
                backgroundColor: 'var(--ui-surface)',
                color: 'var(--ui-text)',
                border: '1px solid var(--ui-border)',
                borderRadius: '16px',
                boxShadow: '0 32px 120px rgba(0,0,0,.6), 0 8px 32px rgba(0,0,0,.4)'
            }, children: [_jsx("div", { className: "modal-header", children: _jsxs("div", { className: "modal-tabs", children: [_jsx("button", { type: "button", className: `tab ${tab === "data" ? "is-active" : ""}`, onClick: () => setTab("data"), children: "Character Card" }), _jsx("button", { type: "button", className: `tab ${tab === "stance" ? "is-active" : ""}`, onClick: () => setTab("stance"), children: "Stance" }), _jsx("button", { type: "button", className: "tab tab--ghost", onClick: onClose, "aria-label": "Close", children: "Close" })] }) }), _jsxs("div", { className: "modal-body", children: [loading && _jsx("div", { className: "muted", children: "Loading\u2026" }), !loading && err && _jsxs("div", { className: "error", children: ["Error: ", err] }), !loading && !err && tab === "data" && (_jsx("div", { className: "data-fill", children: _jsx("div", { className: "card-scaler", children: _jsx(UnitDataCard, { character: character, data: dataObj || undefined }) }) })), !loading && !err && tab === "stance" && (_jsx("div", { className: "stance-wrap", children: _jsx("div", { className: "stance-box", children: stanceObj ? (_jsx(StanceCard, { stance: stanceObj })) : (_jsxs("div", { className: "muted", children: ["Brak pliku ", _jsx("code", { children: "stance.json" }), "."] })) }) }))] })] }) }));
}
