// apps/client/src/pages/CharactersPage.tsx
import { useEffect, useState } from "react";

type Character = { id: string; name: string; image?: string | null };
type ApiList = { items: Character[]; total: number };

export default function CharactersPage() {
  console.log('=== CHARACTERS PAGE RENDER ===');
  console.log('You are on the WRONG page! Go to /content-management instead!');
  
  const [data, setData] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/characters", { credentials: "include" });
        const json = (await res.json()) as ApiList;
        if (alive) setData(json.items ?? []);
      } catch {
        if (alive) setData([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h1 style={{maxWidth: 1100, margin: "18px auto 0", padding: "0 16px"}}>Characters</h1>
      {loading ? <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>Loading…</p> : null}
      {!loading && data.length === 0 ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>No data (empty list).</p>
      ) : null}

      <div className="grid">
        {data.map((c) => (
          <div className="card" key={c.id} role="article">
            <img src={c.image ?? "https://picsum.photos/seed/placeholder/400/520"} alt={c.name} />
            <div className="title">{c.name}</div>
            <div className="meta">id: {c.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}