import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useState, } from "react";
import { API_BASE } from "../lib/env";
const AuthContext = createContext(undefined);
async function fetchStatus() {
    try {
        return await fetch(`${API_BASE}/auth/status`, {
            credentials: "include",
        });
    }
    catch {
        return undefined;
    }
}
export const AuthProvider = ({ children, }) => {
    const [auth, setAuth] = useState({ status: "loading" });
    const refresh = useCallback(async () => {
        const res = await fetchStatus();
        if (!res || !res.ok) {
            setAuth({ status: "anonymous" });
            return;
        }
        try {
            const data = await res.json();
            if (data?.authenticated && data?.user) {
                setAuth({ status: "authenticated", user: data.user });
            }
            else {
                setAuth({ status: "anonymous" });
            }
        }
        catch {
            setAuth({ status: "anonymous" });
        }
    }, []);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const doLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        }
        finally {
            setAuth({ status: "anonymous" });
        }
    };
    const redirectTarget = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const googleLoginHref = `${API_BASE}/auth/google`;
    return (_jsx(AuthContext.Provider, { value: { auth, googleLoginHref, refresh, doLogout }, children: children }));
};
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within <AuthProvider>");
    }
    return ctx;
}
