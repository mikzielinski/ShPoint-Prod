import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "../auth/AuthContext";
export default function UsersPage() {
    const { auth } = useAuth();
    if (auth.status === "loading")
        return _jsx("div", { style: { padding: 16 }, children: "\u0141adowanie\u2026" });
    if (auth.status === "anonymous")
        return _jsx("div", { style: { padding: 16 }, children: "Brak dost\u0119pu \u2014 zaloguj si\u0119." });
    return (_jsxs("div", { style: { padding: 16 }, children: [_jsx("h1", { children: "Users" }), _jsx("pre", { children: JSON.stringify(auth.user, null, 2) })] }));
}
