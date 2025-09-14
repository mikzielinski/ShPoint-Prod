import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("sp-theme") as "light" | "dark") || "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    localStorage.setItem("sp-theme", theme);
  }, [theme]);

  return (
    <button
      aria-label="Toggle theme"
      className="sp-btn sp-btn--ghost"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}