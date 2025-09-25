import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AdminInvitationSettings from "../components/AdminInvitationSettings";
import "../styles/admin.css";
const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
async function apiFetch(url, init) {
    const res = await fetch(url, { credentials: "include", ...init });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return res.json();
}
export default function AdminPage() {
    console.log("AdminPage component rendering");
    const { auth } = useAuth();
    console.log("AdminPage auth:", auth);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [role, setRoleFilter] = useState("");
    const [error, setError] = useState(null);
    const [ok, setOk] = useState(null);
    const [savingId, setSavingId] = useState(null);
    // Invitations state
    const [invitations, setInvitations] = useState([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("USER");
    // Collapsible sections state
    const [sectionsExpanded, setSectionsExpanded] = useState({
        invitations: true,
        users: true,
        invitationSettings: true
    });
    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState(null);
    const canManage = auth.user?.role === "ADMIN";
    const myId = auth.user?.id;
    console.log("AdminPage canManage:", canManage, "myId:", myId);
    const load = async (q, r) => {
        console.log("AdminPage load function called with:", q, r);
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams();
            if (q)
                qs.set("search", q);
            if (r)
                qs.set("role", r);
            const url = `${API}/api/admin/users?${qs.toString()}`;
            console.log("AdminPage fetching URL:", url);
            console.log("AdminPage API constant:", API);
            const data = await apiFetch(url);
            console.log("AdminPage users data:", data.users);
            console.log("AdminPage data.ok:", data.ok);
            console.log("AdminPage first user:", data.users[0]);
            console.log("AdminPage first user username:", data.users[0]?.username);
            setRows(data.users);
        }
        catch (e) {
            setError(e?.message ?? "Load error");
        }
        finally {
            setLoading(false);
        }
    };
    /* debounce search */
    useEffect(() => {
        console.log("AdminPage useEffect - search:", search, "role:", role);
        const t = setTimeout(() => {
            console.log("AdminPage calling load with:", search, role);
            load(search, role);
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, role]);
    // Load invitations on mount
    useEffect(() => {
        if (canManage) {
            loadInvitations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage]);
    // Load section states from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('admin-sections-expanded');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSectionsExpanded(parsed);
            }
            catch (e) {
                console.warn('Failed to parse saved section states:', e);
            }
        }
    }, []);
    // Save section states to localStorage
    useEffect(() => {
        localStorage.setItem('admin-sections-expanded', JSON.stringify(sectionsExpanded));
    }, [sectionsExpanded]);
    const handleSetRole = async (u, next) => {
        if (!canManage)
            return;
        if (u.id === myId && next !== "ADMIN") {
            setError("You cannot change your own role to a lower one.");
            return;
        }
        const txt = `Change role for:\n${u.email}\n${u.role} → ${next}?`;
        if (!confirm(txt))
            return;
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: next }),
            });
            setOk(`Role changed: ${u.email} → ${next}`);
            load(search, role);
        }
        catch (e) {
            setError(e?.message ?? "Failed to change role");
        }
        finally {
            setSavingId(null);
            setTimeout(() => setOk(null), 1800);
        }
    };
    const handleSuspendUser = async (u, days, reason) => {
        if (!canManage)
            return;
        if (u.id === myId) {
            setError("You cannot suspend yourself.");
            return;
        }
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}/suspend`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days, reason }),
            });
            setOk(`User suspended: ${u.email} for ${days} days`);
            load(search, role);
        }
        catch (e) {
            setError(e?.message ?? "Failed to suspend user");
        }
        finally {
            setSavingId(null);
            setTimeout(() => setOk(null), 3000);
        }
    };
    const handleUnsuspendUser = async (u) => {
        if (!canManage)
            return;
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}/unsuspend`, {
                method: "PATCH",
            });
            setOk(`User unsuspended: ${u.email}`);
            load(search, role);
        }
        catch (e) {
            setError(e?.message ?? "Failed to unsuspend user");
        }
        finally {
            setSavingId(null);
            setTimeout(() => setOk(null), 3000);
        }
    };
    const handleUnbanUser = async (u) => {
        if (!canManage)
            return;
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}/unsuspend`, {
                method: "PATCH",
            });
            setOk(`User unbanned: ${u.email} - access restored immediately`);
            load(search, role);
        }
        catch (e) {
            setError(e?.message ?? "Failed to unban user");
        }
        finally {
            setSavingId(null);
            setTimeout(() => setOk(null), 3000);
        }
    };
    const handleDeleteUser = async (u) => {
        if (!canManage)
            return;
        if (u.id === myId) {
            setError("You cannot delete your own account.");
            return;
        }
        const txt = `Delete user:\n${u.email}\nThis action cannot be undone!`;
        if (!confirm(txt))
            return;
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}`, {
                method: "DELETE",
            });
            setOk(`User deleted: ${u.email}`);
            load(search, role);
        }
        catch (e) {
            setError(e?.message ?? "Failed to delete user");
        }
        finally {
            setSavingId(null);
            setTimeout(() => setOk(null), 1800);
        }
    };
    const handleSaveGoogleAvatar = async (u) => {
        if (!u.image) {
            setError("User doesn't have a Google image to save");
            return;
        }
        try {
            setSavingId(u.id);
            await apiFetch(`${API}/api/admin/users/${u.id}/save-google-avatar`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: u.image }),
            });
            setOk(`Google avatar saved as backup for ${u.email}`);
            load(search, role);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSavingId(null);
        }
    };
    // Invitation management functions
    const loadInvitations = async () => {
        try {
            setInvitationsLoading(true);
            const data = await apiFetch(`${API}/api/admin/allowed-emails`);
            setInvitations(data.allowedEmails);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setInvitationsLoading(false);
        }
    };
    const handleInviteUser = async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            setError("Please enter a valid email address");
            return;
        }
        try {
            await apiFetch(`${API}/api/admin/allowed-emails`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: inviteEmail.trim().toLowerCase(),
                    role: inviteRole
                }),
            });
            setOk(`Invitation sent to ${inviteEmail}`);
            setInviteEmail("");
            setInviteRole("USER");
            setShowInviteForm(false);
            loadInvitations();
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleRemoveInvitation = async (invitation) => {
        if (!confirm(`Remove invitation for ${invitation.email}?`))
            return;
        try {
            await apiFetch(`${API}/api/admin/allowed-emails/${invitation.id}`, {
                method: "DELETE",
            });
            setOk(`Invitation removed for ${invitation.email}`);
            loadInvitations();
        }
        catch (err) {
            setError(err.message);
        }
    };
    const toggleSection = (section) => {
        setSectionsExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    const handleDropdownToggle = (userId, buttonElement) => {
        if (openDropdown === userId) {
            setOpenDropdown(null);
            setDropdownPosition(null);
        }
        else {
            const rect = buttonElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const dropdownHeight = 250; // Max height from CSS
            const dropdownWidth = 140; // Min width from CSS
            // Check if there's enough space below the button
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            let top;
            if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
                // Show below the button
                top = rect.bottom + window.scrollY + 4;
            }
            else {
                // Show above the button
                top = rect.top + window.scrollY - dropdownHeight - 4;
            }
            // Check horizontal positioning to prevent overflow
            let left = rect.left + window.scrollX;
            if (left + dropdownWidth > viewportWidth) {
                left = viewportWidth - dropdownWidth - 10; // 10px margin from edge
            }
            if (left < 10) {
                left = 10; // 10px margin from left edge
            }
            setDropdownPosition({
                top: Math.max(10, top), // Ensure dropdown doesn't go above viewport
                left
            });
            setOpenDropdown(userId);
        }
    };
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (!target.closest('.dropdown-container')) {
                setOpenDropdown(null);
                setDropdownPosition(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const skeleton = useMemo(() => Array.from({ length: 4 }).map((_, i) => (_jsxs("div", { className: "table__row", role: "row", children: [_jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: "60%" } }) }), _jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: "40%" } }) }), _jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: "35%" } }) }), _jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: 80 } }) }), _jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: 80 } }) }), _jsx("div", { className: "table__cell", children: _jsx("div", { className: "skel", style: { width: 180, height: 24 } }) })] }, `sk-${i}`))), []);
    return (_jsxs("main", { className: "admin-page", children: [_jsxs("header", { className: "page-head", children: [_jsx("h1", { children: "Admin Panel" }), _jsx("p", { children: "Manage users, invitations, and system settings." })] }), _jsxs("section", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("button", { className: "btn btn-sm btn--outline", onClick: () => toggleSection('users'), style: {
                                        minWidth: "32px",
                                        height: "32px",
                                        padding: "0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "16px"
                                    }, children: sectionsExpanded.users ? "▼" : "▶" }), _jsx("h2", { children: "Users" })] }) }), sectionsExpanded.users && (_jsxs(_Fragment, { children: [_jsx("div", { className: "toolbar", children: _jsxs("div", { className: "toolbar-left", children: [_jsx("input", { className: "input", placeholder: "Search by email or name\u2026", value: search, onChange: (e) => setSearch(e.target.value) }), _jsxs("select", { className: "select", value: role, onChange: (e) => setRoleFilter(e.target.value), children: [_jsx("option", { value: "", children: "All roles" }), _jsx("option", { value: "USER", children: "USER" }), _jsx("option", { value: "EDITOR", children: "EDITOR" }), _jsx("option", { value: "ADMIN", children: "ADMIN" })] }), _jsx("button", { className: "btn btn--outline", onClick: () => load(search, role), disabled: loading, children: "Search" })] }) }), ok && _jsx("div", { className: "alert alert--ok", children: ok }), error && _jsx("div", { className: "alert alert--error", children: error }), _jsx("div", { className: "card", children: _jsxs("div", { className: "table", role: "table", "aria-label": "Users list", children: [_jsxs("div", { className: "table__row table__row--header", role: "row", children: [_jsx("div", { className: "table__cell", children: "Email" }), _jsx("div", { className: "table__cell", children: "Name" }), _jsx("div", { className: "table__cell", children: "UserName" }), _jsx("div", { className: "table__cell", children: "Role" }), _jsx("div", { className: "table__cell", children: "Status" }), _jsx("div", { className: "table__cell", children: "Actions" })] }), loading ? (skeleton) : rows.length ? (rows.map((u) => (_jsxs("div", { className: "table__row", role: "row", children: [_jsx("div", { className: "table__cell", children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [(u.avatarUrl || u.image) ? (_jsx("img", { src: u.avatarUrl || u.image, alt: "", className: "avatar", style: {
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "50%",
                                                                    objectFit: "cover"
                                                                }, onError: (e) => {
                                                                    // Hide the broken image and show initials
                                                                    e.target.style.display = "none";
                                                                    e.target.nextElementSibling.style.display = "flex";
                                                                } })) : null, _jsx("div", { className: "avatar", style: {
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "#374151",
                                                                    color: "white",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontSize: "12px",
                                                                    fontWeight: "600",
                                                                    display: (u.avatarUrl || u.image) ? "none" : "flex"
                                                                }, children: u.name ? u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : u.email[0].toUpperCase() }), _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u.email })] }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u.name ?? "—" }) }), _jsx("div", { className: "table__cell", children: _jsxs("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [console.log("Rendering username for user:", u.email, "username:", u.username), u.username ? (_jsx("span", { style: { color: "#16a34a", fontWeight: "600" }, children: u.username })) : (_jsx("span", { style: { color: "#6b7280" }, children: "\u2014" }))] }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { className: "badge", "data-role": u.role, children: u.role }) }), _jsxs("div", { className: "table__cell", children: [_jsx("span", { className: "badge", style: {
                                                                backgroundColor: u.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                                                                color: "white"
                                                            }, children: u.status }), u.status === "SUSPENDED" && u.suspendedUntil && (_jsxs("div", { style: { fontSize: "12px", color: "#6b7280", marginTop: "2px" }, children: ["Until: ", new Date(u.suspendedUntil).toLocaleDateString()] }))] }), _jsx("div", { className: "table__cell", children: _jsxs("div", { className: "dropdown-container", style: { position: "relative", display: "inline-block" }, children: [_jsxs("button", { className: "btn btn-sm btn-chip", disabled: !canManage || savingId === u.id, onClick: (e) => handleDropdownToggle(u.id, e.currentTarget), style: {
                                                                    minWidth: "120px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    gap: "8px"
                                                                }, children: ["Actions", _jsx("span", { style: { fontSize: "12px" }, children: "\u25BC" })] }), openDropdown === u.id && dropdownPosition && (_jsxs("div", { className: "dropdown-menu", style: {
                                                                    position: "fixed",
                                                                    top: dropdownPosition.top,
                                                                    left: dropdownPosition.left,
                                                                    zIndex: 9999
                                                                }, children: [_jsx("button", { className: "dropdown-item", disabled: u.role === "USER", onClick: () => {
                                                                            handleSetRole(u, "USER");
                                                                            setOpenDropdown(null);
                                                                            setDropdownPosition(null);
                                                                        }, children: "Set USER" }), _jsx("button", { className: "dropdown-item", disabled: u.role === "EDITOR", onClick: () => {
                                                                            handleSetRole(u, "EDITOR");
                                                                            setOpenDropdown(null);
                                                                            setDropdownPosition(null);
                                                                        }, children: "Set EDITOR" }), _jsx("button", { className: "dropdown-item", disabled: u.role === "ADMIN", onClick: () => {
                                                                            handleSetRole(u, "ADMIN");
                                                                            setOpenDropdown(null);
                                                                            setDropdownPosition(null);
                                                                        }, children: "Set ADMIN" }), _jsx("div", { style: {
                                                                            height: "1px",
                                                                            backgroundColor: "var(--ad-b)",
                                                                            margin: "4px 0"
                                                                        } }), u.status === "ACTIVE" ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "dropdown-item", disabled: u.id === myId, onClick: () => {
                                                                                    const days = 7;
                                                                                    const reason = prompt(`Suspend ${u.email} for ${days} days. Reason (optional):`);
                                                                                    if (reason !== null) {
                                                                                        handleSuspendUser(u, days, reason || undefined);
                                                                                    }
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#f59e0b" }, children: "Suspend 7 days" }), _jsx("button", { className: "dropdown-item", disabled: u.id === myId, onClick: () => {
                                                                                    const days = 30;
                                                                                    const reason = prompt(`Suspend ${u.email} for ${days} days. Reason (optional):`);
                                                                                    if (reason !== null) {
                                                                                        handleSuspendUser(u, days, reason || undefined);
                                                                                    }
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#f59e0b" }, children: "Suspend 30 days" }), _jsx("button", { className: "dropdown-item", disabled: u.id === myId, onClick: () => {
                                                                                    const days = parseInt(prompt(`Suspend ${u.email} for how many days? (1-365):`) || "0");
                                                                                    if (days > 0 && days <= 365) {
                                                                                        const reason = prompt(`Reason (optional):`);
                                                                                        handleSuspendUser(u, days, reason || undefined);
                                                                                    }
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#f59e0b" }, children: "Suspend custom days" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "dropdown-item", onClick: () => {
                                                                                    handleUnbanUser(u);
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#059669", fontWeight: "600" }, children: "\u26A1 Quick Unban" }), _jsx("button", { className: "dropdown-item", onClick: () => {
                                                                                    handleUnsuspendUser(u);
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#16a34a" }, children: "Unsuspend" }), _jsx("button", { className: "dropdown-item", onClick: () => {
                                                                                    if (confirm(`Unban user ${u.email}?\nThis will immediately restore their access.`)) {
                                                                                        handleUnbanUser(u);
                                                                                    }
                                                                                    setOpenDropdown(null);
                                                                                    setDropdownPosition(null);
                                                                                }, style: { color: "#059669", fontWeight: "600" }, children: "\uD83D\uDD13 Unban User" })] })), _jsx("div", { style: {
                                                                            height: "1px",
                                                                            backgroundColor: "var(--ad-b)",
                                                                            margin: "4px 0"
                                                                        } }), _jsx("button", { className: "dropdown-item", disabled: !u.image, onClick: () => {
                                                                            handleSaveGoogleAvatar(u);
                                                                            setOpenDropdown(null);
                                                                            setDropdownPosition(null);
                                                                        }, style: { color: "#059669" }, children: "Save Google Avatar" }), _jsx("button", { className: "dropdown-item", disabled: u.id === myId, onClick: () => {
                                                                            if (confirm(`Delete user ${u.email}? This action cannot be undone!`)) {
                                                                                handleDeleteUser(u);
                                                                            }
                                                                            setOpenDropdown(null);
                                                                            setDropdownPosition(null);
                                                                        }, style: { color: "#dc2626" }, children: "Delete User" })] }))] }) })] }, u.id ?? u.email)))) : (_jsx("div", { className: "table__row", role: "row", children: _jsx("div", { className: "table__cell", style: { gridColumn: "1 / -1", color: "#94a3b8" }, children: "No users to display." }) }))] }) })] }))] }), _jsxs("section", { className: "card", style: { marginTop: "24px" }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("button", { className: "btn btn-sm btn--outline", onClick: () => toggleSection('invitations'), style: {
                                            minWidth: "32px",
                                            height: "32px",
                                            padding: "0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "16px"
                                        }, children: sectionsExpanded.invitations ? "▼" : "▶" }), _jsx("h2", { children: "User Invitations" })] }), _jsx("button", { className: "btn btn-primary", onClick: () => setShowInviteForm(!showInviteForm), children: showInviteForm ? "Cancel" : "Invite User" })] }), sectionsExpanded.invitations && (_jsxs(_Fragment, { children: [showInviteForm && (_jsxs("div", { className: "card-body", style: { padding: "20px", borderTop: "1px solid #334155" }, children: [_jsxs("div", { style: { display: "flex", gap: "12px", alignItems: "end", marginBottom: "16px" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }, children: "Email Address" }), _jsx("input", { type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), placeholder: "user@example.com", className: "input", style: { width: "100%" } })] }), _jsxs("div", { style: { minWidth: "120px" }, children: [_jsx("label", { style: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }, children: "Role" }), _jsxs("select", { value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "select", style: { width: "100%" }, children: [_jsx("option", { value: "USER", children: "User" }), _jsx("option", { value: "EDITOR", children: "Editor" }), _jsx("option", { value: "ADMIN", children: "Admin" })] })] }), _jsx("button", { className: "btn btn-primary", onClick: handleInviteUser, disabled: !inviteEmail.trim(), children: "Send Invitation" })] }), _jsx("p", { style: { margin: 0, fontSize: "12px", color: "#94a3b8" }, children: "The user will receive access to sign in with their Google account." })] })), _jsxs("div", { className: "table", children: [_jsxs("div", { className: "table__row--header", role: "rowheader", children: [_jsx("div", { className: "table__cell", children: "Email" }), _jsx("div", { className: "table__cell", children: "Role" }), _jsx("div", { className: "table__cell", children: "Invited" }), _jsx("div", { className: "table__cell", children: "Status" }), _jsx("div", { className: "table__cell", children: "Actions" })] }), invitationsLoading ? (_jsx("div", { className: "table__row", children: _jsx("div", { className: "table__cell", colSpan: 5, style: { textAlign: "center", padding: "40px" }, children: "Loading invitations..." }) })) : invitations.filter(inv => !inv.usedAt).length === 0 ? (_jsx("div", { className: "table__row", children: _jsx("div", { className: "table__cell", colSpan: 5, style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: "No pending invitations" }) })) : (invitations.filter(inv => !inv.usedAt).map((invitation) => (_jsxs("div", { className: "table__row", children: [_jsx("div", { className: "table__cell", children: _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: invitation.email }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { className: "badge", "data-role": invitation.role, children: invitation.role }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: new Date(invitation.createdAt).toLocaleDateString() }) }), _jsx("div", { className: "table__cell", children: _jsx("span", { style: {
                                                        color: invitation.usedAt ? "#16a34a" : invitation.isActive ? "#f59e0b" : "#6b7280",
                                                        fontWeight: "600"
                                                    }, children: invitation.usedAt ? "Used" : invitation.isActive ? "Pending" : "Inactive" }) }), _jsx("div", { className: "table__cell", children: !invitation.usedAt && (_jsx("button", { className: "btn btn-danger btn-sm", onClick: () => handleRemoveInvitation(invitation), disabled: savingId === invitation.id, children: "Remove" })) })] }, invitation.id))))] })] }))] }), _jsxs("section", { className: "card", style: { marginTop: "24px" }, children: [_jsx("div", { className: "card-header", children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("button", { className: "btn btn-sm btn--outline", onClick: () => toggleSection('invitationSettings'), style: {
                                        minWidth: "32px",
                                        height: "32px",
                                        padding: "0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "16px"
                                    }, children: sectionsExpanded.invitationSettings ? "▼" : "▶" }), _jsx("h2", { children: "Invitation Settings" })] }) }), sectionsExpanded.invitationSettings && (_jsx("div", { style: { padding: "24px" }, children: _jsx(AdminInvitationSettings, {}) }))] })] }));
}
