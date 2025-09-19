import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./NavBar.css";
function cx(...parts) {
    return parts.filter(Boolean).join(" ");
}
function ThemeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    useEffect(() => {
        const html = document.documentElement;
        if (theme === "dark")
            html.classList.add("dark");
        else
            html.classList.remove("dark");
        localStorage.setItem("theme", theme);
    }, [theme]);
    return (_jsx("button", { className: "nb-btn nb-btn-icon", "aria-label": "Toggle theme", onClick: () => setTheme((t) => (t === "dark" ? "light" : "dark")), title: "Toggle theme", children: theme === "dark" ? "🌙" : "☀️" }));
}
export default function NavBar() {
    const { user, doLogin, doLogout } = useAuth();
    const role = (user?.role || "USER");
    const isAdmin = role === "ADMIN";
    const isEditor = role === "EDITOR" || isAdmin;
    const loc = useLocation();
    const navigate = useNavigate();
    // mobilne menu
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [loc.pathname]);
    return (_jsxs("header", { className: "nb-root", children: [_jsxs("div", { className: "nb-inner", children: [_jsxs("button", { className: "nb-brand", onClick: () => navigate("/builder"), "aria-label": "Go home", children: [_jsx("span", { className: "nb-brand-dot" }), _jsx("span", { className: "nb-brand-name", children: "ShPoint" })] }), _jsxs("nav", { className: "nb-nav", children: [_jsx(NavLink, { to: "/builder", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "Builder" }), _jsx(NavLink, { to: "/characters", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "Characters" }), user && (_jsx(NavLink, { to: "/my-collection", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "My Collection" })), isEditor && (_jsx(NavLink, { to: "/editor", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "Editor" })), isAdmin && (_jsx(NavLink, { to: "/admin", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "Admin" })), _jsx(NavLink, { to: "/users", className: ({ isActive }) => cx("nb-link", isActive && "is-active"), children: "Users" })] }), _jsxs("div", { className: "nb-actions", children: [_jsx(ThemeToggle, {}), user ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "nb-user", title: user.email ?? "", children: [user.name ?? "User", " ", _jsx("span", { className: cx("nb-role", `r-${role.toLowerCase()}`), children: role })] }), _jsx("button", { className: "nb-btn", onClick: () => doLogout().then(() => navigate("/login")), children: "Logout" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "nb-guest", children: "Guest" }), _jsx("button", { className: "nb-btn", onClick: () => doLogin(), children: "Sign in" })] })), _jsx("button", { className: "nb-btn nb-btn-icon nb-burger", "aria-label": "Open menu", "aria-expanded": open, onClick: () => setOpen((v) => !v), children: "\u2630" })] })] }), _jsxs("div", { className: cx("nb-drawer", open && "is-open"), children: [_jsx(NavLink, { to: "/builder", className: "nb-drawer-link", children: "Builder" }), _jsx(NavLink, { to: "/characters", className: "nb-drawer-link", children: "Characters" }), user && (_jsx(NavLink, { to: "/my-collection", className: "nb-drawer-link", children: "My Collection" })), isEditor && (_jsx(NavLink, { to: "/editor", className: "nb-drawer-link", children: "Editor" })), isAdmin && (_jsx(NavLink, { to: "/admin", className: "nb-drawer-link", children: "Admin" })), _jsx(NavLink, { to: "/users", className: "nb-drawer-link", children: "Users" }), _jsx("div", { className: "nb-drawer-sep" }), user ? (_jsx("button", { className: "nb-drawer-btn", onClick: () => doLogout().then(() => navigate("/login")), children: "Logout" })) : (_jsx("button", { className: "nb-drawer-btn", onClick: () => doLogin(), children: "Sign in" }))] })] }));
}
