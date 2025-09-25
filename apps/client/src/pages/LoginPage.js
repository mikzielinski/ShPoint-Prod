import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/client/src/pages/LoginPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LoginCard } from "../components/auth/LoginCard";
const DEFAULT_USER_PATH = "/builder";
const DEFAULT_EDITOR_PATH = "/editor";
const DEFAULT_ADMIN_PATH = "/admin";
function defaultPathFor(role) {
    if (role === "ADMIN")
        return DEFAULT_ADMIN_PATH;
    if (role === "EDITOR")
        return DEFAULT_EDITOR_PATH;
    return DEFAULT_USER_PATH;
}
function canAccess(path, role) {
    if (!path)
        return false;
    // admin only
    if (path.startsWith("/admin"))
        return role === "ADMIN";
    // editor or admin
    if (path.startsWith("/editor"))
        return role === "EDITOR" || role === "ADMIN";
    // reszta dostępna dla zalogowanych
    return true;
}
export default function LoginPage() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || null;
    const fromPath = state?.from?.pathname;
    useEffect(() => {
        if (auth.status === "authenticated") {
            const role = auth.user?.role;
            const fallback = defaultPathFor(role);
            // ignorujemy bezsensowne cele
            const invalid = ["/login", "/logout"];
            const hasValidFrom = !!fromPath && !invalid.includes(fromPath) && canAccess(fromPath, role);
            const target = hasValidFrom ? fromPath : fallback;
            navigate(target, { replace: true });
        }
    }, [auth.status, auth.user?.role, fromPath, navigate]);
    if (auth.status === "loading") {
        return (_jsx("main", { style: { padding: 24 }, children: _jsxs("div", { className: "card", style: { maxWidth: 420, margin: "0 auto" }, children: [_jsxs("div", { className: "card__header", children: [_jsx("h2", { className: "card__title", children: "Logowanie" }), _jsx("p", { className: "card__subtitle", children: "Sprawdzam sesj\u0119\u2026" })] }), _jsx("div", { className: "card__content", children: _jsxs("button", { className: "btn btn--secondary btn--lg btn--loading", disabled: true, children: [_jsx("span", { className: "btn__spinner", "aria-hidden": true }), _jsx("span", { className: "visually-hidden", children: "\u0141adowanie\u2026" })] }) })] }) }));
    }
    return (_jsx("main", { style: { padding: 24 }, children: _jsx(LoginCard, {}) }));
}
