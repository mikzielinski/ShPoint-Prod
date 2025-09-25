import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
export default function LogoutPage() {
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
