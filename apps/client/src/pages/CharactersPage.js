import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/client/src/pages/CharactersPage.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/env";
export default function CharactersPage() {
    console.log('=== CHARACTERS PAGE RENDER ===');
    console.log('You are on the WRONG page! Go to /content-management instead!');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(api("/api/characters"), { credentials: "include" });
                const json = (await res.json());
                if (alive)
                    setData(json.items ?? []);
            }
            catch {
                if (alive)
                    setData([]);
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { style: { maxWidth: 1100, margin: "18px auto 0", padding: "0 16px" }, children: "Characters" }), loading ? _jsx("p", { style: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" }, children: "Loading\u2026" }) : null, !loading && data.length === 0 ? (_jsx("p", { style: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" }, children: "No data (empty list)." })) : null, _jsx("div", { className: "grid", children: data.map((c) => (_jsxs("div", { className: "card", role: "article", children: [_jsx("img", { src: c.image ?? "https://picsum.photos/seed/placeholder/400/520", alt: c.name }), _jsx("div", { className: "title", children: c.name }), _jsxs("div", { className: "meta", children: ["id: ", c.id] })] }, c.id))) })] }));
}
