import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
export default function RequireAuth({ children, role, }) {
    const { auth } = useAuth();
    const location = useLocation();
    // While auth is loading, render nothing to avoid flicker
    if (auth.status === "loading")
        return null;
    if (auth.status !== "authenticated") {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    const myRole = auth.user?.role;
    if (role === "ADMIN" && myRole !== "ADMIN") {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (role === "EDITOR" && !(myRole === "EDITOR" || myRole === "ADMIN")) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return children;
}
