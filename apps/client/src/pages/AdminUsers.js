import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import RoleSelect from "../components/RoleSelect";
import { API_BASE } from "../lib/env";
import { useAuth } from "../auth/AuthContext";
async function fetchUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
    if (!res.ok)
        throw new Error("Failed to load users");
    const data = await res.json();
    // dopasuj, jeśli backend ma inny kształt
    return (data.users ?? data);
}
async function changeRole(userId, role) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });
    if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(err || "Failed to change role");
    }
}
export default function AdminUsers() {
    const { auth } = useAuth();
    const myId = auth.status === "authenticated" ? auth.user?.id : undefined;
    const [loading, setLoading] = React.useState(true);
    const [users, setUsers] = React.useState([]);
    const [busy, setBusy] = React.useState({}); // userId -> loading
    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const list = await fetchUsers();
                if (alive)
                    setUsers(list);
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);
    const onRoleChange = async (u, next) => {
        if (u.role === next)
            return;
        setBusy((b) => ({ ...b, [u.id]: true }));
        // optymistycznie
        setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
        try {
            await changeRole(u.id, next);
        }
        catch (e) {
            // revert
            setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role: u.role } : x)));
            alert(e?.message || "Could not change role.");
        }
        finally {
            setBusy((b) => ({ ...b, [u.id]: false }));
        }
    };
    if (loading) {
        return (_jsx("div", { className: "card rounded-card", style: { padding: 20 }, children: "Loading\u2026" }));
    }
    return (_jsx("main", { className: "page--users", children: _jsx("div", { className: "card rounded-card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: 280 }, children: "Email" }), _jsx("th", { style: { width: 280 }, children: "Name" }), _jsx("th", { style: { width: 140 }, children: "Role" }), _jsx("th", { style: { width: 180 }, children: "Roles" }), _jsx("th", { style: { width: 140, textAlign: "right" }, children: "Actions" })] }) }), _jsx("tbody", { children: users.map((u) => {
                            const isSelf = u.id === myId;
                            return (_jsxs("tr", { className: isSelf ? "is-self" : undefined, children: [_jsxs("td", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("div", { style: {
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    overflow: "hidden",
                                                    border: "1px solid var(--ui-border)",
                                                    background: "var(--ui-hover)",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    fontWeight: 800,
                                                    fontSize: 12,
                                                    flex: "0 0 auto",
                                                }, title: u.email, children: u.avatarUrl ? (_jsx("img", { src: u.avatarUrl, alt: u.email, style: { width: "100%", height: "100%", objectFit: "cover" } })) : ((u.email || "?").slice(0, 1).toUpperCase()) }), _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: u.email })] }), _jsx("td", { className: "name", children: u.name || "—" }), _jsx("td", { children: _jsx("span", { className: `chip chip--role-${u.role}`, children: u.role }) }), _jsx("td", { children: _jsx(RoleSelect, { value: u.role, onChange: (r) => onRoleChange(u, r), disabled: !!busy[u.id] }) }), _jsx("td", { style: { textAlign: "right" }, children: _jsx("button", { className: "btn ghost sm", disabled: true, children: "More" }) })] }, u.id));
                        }) })] }) }) }));
}
