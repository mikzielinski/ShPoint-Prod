import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem("sp-theme") || "dark");
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        localStorage.setItem("sp-theme", theme);
    }, [theme]);
    return (_jsx("button", { "aria-label": "Toggle theme", className: "sp-btn sp-btn--ghost", onClick: () => setTheme((t) => (t === "dark" ? "light" : "dark")), title: "Toggle theme", children: theme === "dark" ? "🌙" : "☀️" }));
}
