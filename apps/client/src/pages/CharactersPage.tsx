// apps/client/src/pages/CharactersPage.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/env";

type Character = { 
  id: string; 
  name: string; 
  image?: string | null;
  faction?: string;
  unitType?: string;
  squadPoints?: number;
  stamina?: number;
  durability?: number;
  force?: number;
  hanker?: number;
  boxSetCode?: string;
  characterNames?: string;
  numberOfCharacters?: number;
  era?: string[];
  period?: string[];
  tags?: string[];
  factions?: string[];
  portraitUrl?: string;
  imageUrl?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
};
type ApiList = { 
  items: Character[]; 
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function CharactersPage() {
  const [data, setData] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try new database API first
        const res = await fetch(api("/api/v2/characters"), { 
          credentials: "include",
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const json = (await res.json()) as ApiList;
          if (alive) {
            setData(json.items ?? []);
            setPagination({
              page: json.page,
              limit: json.limit,
              total: json.total,
              totalPages: json.totalPages
            });
          }
        } else {
          // Fallback to old API
          console.log('🔄 Falling back to old API for characters');
          const fallbackRes = await fetch(api("/api/characters"), { credentials: "include" });
          const fallbackJson = (await fallbackRes.json()) as { items: Character[]; total: number };
          if (alive) {
            setData(fallbackJson.items ?? []);
            setPagination({
              page: 1,
              limit: fallbackJson.items?.length || 0,
              total: fallbackJson.total || 0,
              totalPages: 1
            });
          }
        }
      } catch (e: any) {
        if (alive) {
          console.error('❌ Error loading characters:', e);
          setError(e?.message ?? "Failed to load characters");
          setData([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h1 style={{maxWidth: 1100, margin: "18px auto 0", padding: "0 16px"}}>
        Characters 
        {pagination.total > 0 && (
          <span style={{fontSize: "14px", fontWeight: "normal", color: "#6b7280", marginLeft: "8px"}}>
            ({pagination.total} total)
          </span>
        )}
      </h1>
      
      {loading ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>Loading…</p>
      ) : null}
      
      {error ? (
        <div style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px", color: "#ef4444"}}>
          ❌ Error: {error}
        </div>
      ) : null}
      
      {!loading && !error && data.length === 0 ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>No characters found.</p>
      ) : null}

      <div className="grid">
        {data.map((c) => (
          <div className="card" key={c.id} role="article">
            <img 
              src={c.portraitUrl || c.imageUrl || c.image || "https://picsum.photos/seed/placeholder/400/520"} 
              alt={c.name}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                objectPosition: "center"
              }}
            />
            <div className="title">{c.name}</div>
            <div className="meta">
              <div>Faction: {c.faction || "Unknown"}</div>
              <div>Type: {c.unitType || "Unknown"}</div>
              <div>Points: {c.squadPoints || 0}</div>
              {c.version && <div>Version: {c.version}</div>}
            </div>
          </div>
        ))}
      </div>
      
      {pagination.totalPages > 1 && (
        <div style={{maxWidth: 1100, margin: "20px auto", padding: "0 16px", textAlign: "center"}}>
          <p style={{color: "#6b7280", fontSize: "14px"}}>
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
      )}
    </div>
  );
}