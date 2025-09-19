import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/client/src/components/UserButton.tsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
function initialsFromName(name, email) {
    const base = (name || email || "U").trim();
    const parts = base.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
}
export const UserButton = () => {
    const { auth, googleLoginHref, doLogout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    // zamykanie menu po kliknięciu poza
    useEffect(() => {
        const onDoc = (e) => {
            if (!ref.current)
                return;
            if (!ref.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);
    if (auth.status === "loading") {
        return _jsx("div", { className: "opacity-70 text-sm", children: "..." });
    }
    if (auth.status === "anonymous") {
        return (_jsxs("a", { href: googleLoginHref, className: "inline-flex items-center gap-2 rounded-full border px-3 py-1 hover:bg-gray-50 transition", children: [_jsx("span", { className: "i-[g-logo]", "aria-hidden": true }), " Zaloguj"] }));
    }
    // authenticated
    const name = auth.user.name || auth.user.email || "Użytkownik";
    const initials = initialsFromName(auth.user.name, auth.user.email);
    return (_jsxs("div", { className: "relative", ref: ref, children: [_jsxs("button", { onClick: () => setOpen(o => !o), className: "flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50 transition", "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold", children: initials }), _jsx("span", { className: "text-sm max-w-[150px] truncate", children: name })] }), open && (_jsxs("div", { role: "menu", className: "absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg overflow-hidden", children: [_jsx("a", { href: "/user", className: "block px-3 py-2 text-sm hover:bg-gray-50", onClick: () => setOpen(false), children: "M\u00F3j profil" }), _jsx("button", { className: "w-full text-left px-3 py-2 text-sm hover:bg-gray-50", onClick: async () => {
                            await doLogout();
                            setOpen(false);
                            window.location.reload();
                        }, children: "Wyloguj" })] }))] }));
};
