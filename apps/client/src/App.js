import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// apps/client/src/App.tsx
import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { rollDice, summarizeDice, summaryToString } from "@shpoint/shared";
import NavBar from "./components/NavBar";
import SquadBuilder from "./components/SquadBuilder";
// import CharactersGallery from "./components/CharactersGallery"; // DISABLED - using new filter system
import AdminRefreshPanel from "./components/AdminRefreshPanel";
import StancePreview from "./components/StancePreview";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RequireAuth from "./routers/RequireAuth";
import { useAuth } from "./auth/AuthContext";
import GlyphSpriteFull from "./components/icons/GlyphSpriteFull";
/* ===== helpers ===== */
function resolveIndexUrl() {
    const base = import.meta.env?.VITE_SP_DB_URL;
    if (base) {
        const clean = base.endsWith("/") ? base.slice(0, -1) : base;
        if (clean.toLowerCase().endsWith(".json"))
            return clean;
        return `${clean}/index.json`;
    }
    return "/characters/index.json";
}
function stanceUrlFor(id) {
    return `/characters/${id}/stance.json`;
}
/* ===== wspólne UI ===== */
function SimpleModal(props) {
    return (_jsx("div", { style: {
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        }, onClick: props.onClose, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), className: "modal-card", style: {
                width: "min(920px,96vw)",
                maxHeight: "86vh",
                overflow: "hidden",
                display: "grid",
                gridTemplateRows: "auto 1fr",
                background: "var(--card-bg, #0f172a)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
            }, children: [_jsxs("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        borderBottom: "1px solid #1f2937",
                    }, children: [_jsx("div", { style: { fontWeight: 600 }, children: props.title ?? "Details" }), _jsx("button", { onClick: props.onClose, style: {
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #334155",
                                background: "#0b1220",
                                color: "#e5e7eb",
                            }, children: "Close" })] }), _jsx("div", { style: { padding: 12, overflow: "auto" }, children: props.children })] }) }));
}
function DataSourceBanner() {
    const url = import.meta.env?.VITE_SP_DB_URL;
    const isRemote = Boolean(url && url.trim());
    return (_jsxs("div", { style: {
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: isRemote ? "rgba(16,185,129,0.08)" : "rgba(251,146,60,0.08)",
            color: "#e5e7eb",
            fontSize: 14,
            marginBottom: 12,
        }, children: [_jsx("b", { children: "Cards data:" }), " ", isRemote ? (_jsxs(_Fragment, { children: ["remote ", _jsx("code", { children: url }), " (", _jsx("i", { children: "VITE_SP_DB_URL" }), ")"] })) : (_jsxs(_Fragment, { children: ["local ", _jsx("code", { children: "/public/characters" })] }))] }));
}
/* ===== ROUTES – strony ===== */
function BuilderPage() {
    return (_jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: [_jsx(DataSourceBanner, {}), _jsx(SquadBuilder, {})] }));
}
function CharactersPage() {
    const [stanceForId, setStanceForId] = useState(null);
    const [openCardId, setOpenCardId] = useState(null);
    const indexUrl = resolveIndexUrl();
    return (_jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: [_jsx(DataSourceBanner, {}), _jsx("div", { style: { padding: "20px", textAlign: "center", color: "#6b7280" }, children: "Characters page moved to new filter system in AppRoutes.tsx" }), stanceForId && (_jsx(SimpleModal, { title: "Stances", onClose: () => setStanceForId(null), children: _jsx("div", { className: "stance-panel", children: _jsx(StancePreview, { stanceUrl: stanceUrlFor(stanceForId) }) }) })), openCardId && (_jsx(SimpleModal, { title: "Character details", onClose: () => setOpenCardId(null), children: _jsxs("div", { style: { fontSize: 14, color: "#cbd5e1" }, children: ["Tu wstawisz komponent szczeg\u00F3\u0142\u00F3w dla: ", _jsx("code", { children: openCardId }), "."] }) }))] }));
}
class NetClient {
    constructor() {
        this.onState = () => { };
        this.onError = () => { };
    }
    connect(url = import.meta.env?.VITE_WS_URL) {
        this.ws = new WebSocket(url);
        this.ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.t === "state")
                this.onState(msg.state);
            if (msg.t === "error")
                this.onError(msg.message);
        };
    }
    send(obj) {
        this.ws?.send(JSON.stringify(obj));
    }
}
function OnlinePage() {
    const [room, setRoom] = useState("ABC123");
    const [name, setName] = useState("Player");
    const clientRef = useRef(null);
    const [state, setState] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const client = new NetClient();
        clientRef.current = client;
        client.onState = (s) => setState(s);
        client.onError = (m) => setError(m);
        client.connect();
    }, []);
    const [atk, setAtk] = useState({});
    const [def, setDef] = useState({});
    const [atkText, setAtkText] = useState("");
    const [defText, setDefText] = useState("");
    function doRoll(type) {
        const a = rollDice(type === "attack" ? "attack" : "defense", 7);
        const d = rollDice(type === "defense" ? "defense" : "attack", 5);
        const aS = summarizeDice(a);
        const dS = summarizeDice(d);
        setAtk(aS);
        setDef(dS);
        setAtkText(summaryToString(aS));
        setDefText(summaryToString(dS));
    }
    return (_jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: [_jsxs("section", { style: { border: "1px solid #334155", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 8 }, children: "Room" }), _jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [_jsx("input", { value: room, onChange: (e) => setRoom(e.target.value), placeholder: "Room code" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Your name" }), _jsx("button", { onClick: () => clientRef.current?.send({ t: "join", room, name }), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }, children: "Join" }), _jsx("button", { onClick: () => clientRef.current?.send({ t: "leave", room }), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }, children: "Leave" })] }), _jsx("pre", { style: { marginTop: 8, whiteSpace: "pre-wrap" }, children: error ? `Error: ${error}` : JSON.stringify(state, null, 2) })] }), _jsxs("section", { style: { border: "1px solid #334155", padding: 12, borderRadius: 8 }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 8 }, children: "Dice" }), _jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [_jsx("button", { onClick: () => doRoll("attack"), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }, children: "Roll attack" }), _jsx("button", { onClick: () => doRoll("defense"), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }, children: "Roll defense" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", marginBottom: 4 }, children: "ATK" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: atkText })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", marginBottom: 4 }, children: "DEF" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: defText })] })] })] })] }));
}
function AdminUiPage() {
    return (_jsx("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: _jsx(AdminRefreshPanel, {}) }));
}
function EditorPage() {
    return (_jsx("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card__header", children: [_jsx("h2", { className: "card__title", children: "Editor" }), _jsx("p", { className: "card__subtitle", children: "Tu powstanie edytor kart (dost\u0119p: EDITOR/ADMIN)." })] }), _jsx("div", { className: "card__content", children: "Wkr\u00F3tce\u2026" })] }) }));
}
function LogoutScreen() {
    const { doLogout } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        (async () => {
            await doLogout();
            navigate("/", { replace: true });
        })();
    }, [doLogout, navigate]);
    return _jsx("div", { style: { padding: 16 }, children: "Wylogowuj\u0119\u2026" });
}
/* ===== Główne Routes ===== */
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, {}), _jsx(GlyphSpriteFull, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/builder", replace: true }) }), _jsx(Route, { path: "/builder", element: _jsx(RequireAuth, { children: _jsx(BuilderPage, {}) }) }), _jsx(Route, { path: "/characters", element: _jsx(RequireAuth, { children: _jsx(CharactersPage, {}) }) }), _jsx(Route, { path: "/online", element: _jsx(RequireAuth, { children: _jsx(OnlinePage, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(RequireAuth, { children: _jsx(UsersPage, {}) }) }), _jsx(Route, { path: "/editor", element: _jsx(RequireAuth, { role: "EDITOR", children: _jsx(EditorPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(RequireAuth, { role: "ADMIN", children: _jsx(AdminPage, {}) }) }), _jsx(Route, { path: "/admin-ui", element: _jsx(AdminUiPage, {}) }), _jsx(Route, { path: "/logout", element: _jsx(LogoutScreen, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/builder", replace: true }) })] })] }));
}
