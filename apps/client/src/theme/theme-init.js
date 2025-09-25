// Proste przełączanie motywu: czyta z localStorage ('theme') lub z prefers-color-scheme
export function initTheme() {
    try {
        const saved = localStorage.getItem("theme"); // "dark" | "light" | null
        const prefersDark = typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        const html = document.documentElement;
        const theme = saved === "dark" || saved === "light"
            ? saved
            : prefersDark
                ? "dark"
                : "light";
        html.classList.remove("theme-dark", "theme-light");
        html.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
    }
    catch {
        // w razie CSP/SSR po prostu nic
    }
}
