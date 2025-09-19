import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/admin.css"; // ⬅️ WYMUSZAMY załadowanie styli tej strony
const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
async function apiFetch(url, init) {
    const res = await fetch(url, { credentials: "include", ...init });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return res.json();
}
export default function Admin() {
    const { auth } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [role, setRoleFilter] = useState("");
    const [error, setError] = useState(null);
    const canManage = auth.user?.role === "ADMIN";
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams();
            if (search)
                qs.set("search", search);
            if (role)
                qs.set("role", role);
            const data = await apiFetch(`${API}/api/admin/users?${qs.toString()}`);
            setRows(data.items);
        }
        catch (e) {
            setError(e?.message ?? "Load error");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);
    return (_jsxs("main", { className: "admin-page", children: [_jsxs("header", { className: "page-head", children: [_jsx("h1", { children: "U\u017Cytkownicy" }), _jsx("p", { children: "Zarz\u0105dzaj kontami, nadawaj role i miej wszystko w jednym miejscu." })] }), _jsxs("div", { className: "toolbar", children: [_jsxs("div", { className: "toolbar-left", children: [_jsx("input", { className: "input", placeholder: "Szukaj po emailu lub nazwie\u2026", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => e.key === "Enter" && load() }), _jsxs("select", { className: "select", value: role, onChange: (e) => setRoleFilter(e.target.value), children: [_jsx("option", { value: "", children: "Wszystkie role" }), _jsx("option", { value: "USER", children: "USER" }), _jsx("option", { value: "EDITOR", children: "EDITOR" }), _jsx("option", { value: "ADMIN", children: "ADMIN" })] }), _jsx("button", { className: "btn btn--outline", onClick: load, disabled: loading, children: "Szukaj" })] }), _jsx("div", { className: "toolbar-right" })] }), _jsx("div", { className: "card", children: _jsxs("div", { className: "table", role: "table", "aria-label": "Lista u\u017Cytkownik\u00F3w", children: [_jsxs("div", { className: "table__row table__row--header", role: "row", children: [_jsx("div", { className: "table__cell", children: "Email" }), _jsx("div", { className: "table__cell", children: "Nazwa" }), _jsx("div", { className: "table__cell", children: "Rola" }), _jsx("div", { className: "table__cell", children: "Akcje" })] }), error && (_jsx("div", { className: "table__row", role: "row", children: _jsx("div", { className: "table__cell", style: { gridColumn: "1 / -1", color: "#b91c1c" }, children: error }) })), rows.map((u) => (_jsxs("div", { className: "table__row", role: "row", children: [_jsx("div", { className: "table__cell", children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [_jsx("img", { src: u.avatarUrl ?? "/characters/placeholder.png", alt: "", className: "avatar" }), _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u.email })] }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u.name ?? "—" }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { className: "badge", "data-role": u.role, children: u.role }) }), _jsxs("div", { className: "table__cell", children: [_jsx("button", { className: "btn btn-sm btn-chip", disabled: !canManage || u.role === "USER", onClick: async () => {
                                                await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ role: "USER" }),
                                                });
                                                load();
                                            }, children: "Set USER" }), _jsx("button", { className: "btn btn-sm btn-chip btn-chip--editor", disabled: !canManage || u.role === "EDITOR", onClick: async () => {
                                                await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ role: "EDITOR" }),
                                                });
                                                load();
                                            }, children: "Set EDITOR" }), _jsx("button", { className: "btn btn-sm btn-chip btn-chip--admin", disabled: !canManage || u.role === "ADMIN", onClick: async () => {
                                                await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ role: "ADMIN" }),
                                                });
                                                load();
                                            }, children: "Set ADMIN" })] })] }, u.id ?? u.email))), rows.length === 0 && !loading && !error && (_jsx("div", { className: "table__row", role: "row", children: _jsx("div", { className: "table__cell", style: { gridColumn: "1 / -1", color: "#64748b" }, children: "Brak u\u017Cytkownik\u00F3w do wy\u015Bwietlenia." }) }))] }) })] }));
}
