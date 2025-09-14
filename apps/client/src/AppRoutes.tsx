import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import CollectionsPage from "./pages/CollectionsPage";
import FiltersPanel, { type Filters } from "./components/FiltersPanel";
import CharacterModal from "./components/CharacterModal";
import "./components/NavBar.css";

/* ===== NavBar (w tym pliku dla prostoty) ===== */
type MeResponse =
  | { user: { id: string; email?: string; name?: string; role?: string; picture?: string | null } }
  | { user?: undefined };

function useAuthMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!alive) return;
        setData(res.ok ? ((await res.json()) as MeResponse) : { user: undefined });
      } catch {
        setData({ user: undefined });
      } finally { alive && setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  return { data, loading };
}

function RoleChip({ role }: { role?: string }) {
  const cls =
    role === "ADMIN" ? "nb-role r-admin"
      : role === "EDITOR" ? "nb-role r-editor"
      : "nb-role r-user";
  return <span className={cls}>{role ?? "USER"}</span>;
}

function NavBar() {
  const { data, loading } = useAuthMe();
  const me = data?.user;

  const initials = useMemo(() => {
    const n = me?.name || me?.email || "User";
    const p = n.split(" ");
    return (p.length > 1 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
  }, [me?.name, me?.email]);

  const gotoLogin = () => (window.location.href = "/auth/google");
  const doLogout = async () => { await fetch("/auth/logout", { method: "POST", credentials: "include" }); location.href = "/"; };

  return (
    <nav className="nb-root">
      <div className="nb-inner">
        <NavLink to="/" className="nb-brand">
          <div className="nb-brand-dot"></div>
          <span className="nb-brand-name">ShPoint</span>
        </NavLink>
        <div className="nb-nav">
          <NavLink to="/" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>Home</NavLink>
          <NavLink to="/characters" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>Characters</NavLink>
          <NavLink to="/collections" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>Collections</NavLink>
          <NavLink to="/builder" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>Builder</NavLink>
        </div>
        <div className="nb-actions">
          {!loading && !me && (
            <button className="nb-btn" onClick={gotoLogin}>Sign in</button>
          )}
          {loading ? (
            <span className="nb-guest">...</span>
          ) : me ? (
            <>
              {me.picture ? (
                <img className="nb-btn-icon" src={me.picture} alt="avatar" style={{borderRadius: "50%"}} />
              ) : (
                <div className="nb-btn-icon" style={{borderRadius: "50%", fontSize:12, fontWeight:600, background: "#374151"}}>{initials}</div>
              )}
              <span className="nb-user">{me.name ?? me.email ?? "User"}</span>
              <RoleChip role={me.role} />
              <button className="nb-btn" onClick={doLogout}>Sign out</button>
            </>
          ) : (
            <span className="nb-guest">Guest</span>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ====== Characters (galeria) ====== */
type Character = { 
  id: string; 
  name: string; 
  role?: string;
  faction?: string;
  portrait?: string | null;
  tags?: string[];
  sp?: number | null;
  pc?: number | null;
  force?: number;
  stamina?: number;
  durability?: number;
  era?: string;
};
type ApiList = { items: Character[]; total: number };

function CharactersPage() {
  const [data, setData] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/characters", { credentials: "include" });
        const json = (await res.json()) as ApiList;
        if (alive) setData(json.items ?? []);
      } catch { if (alive) setData([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  // Filter characters based on current filters
  const filteredData = useMemo(() => {
    return data.filter((char) => {
      // Text search
      if (filters.text) {
        const searchText = filters.text.toLowerCase();
        const matchesText = 
          char.name.toLowerCase().includes(searchText) ||
          char.faction?.toLowerCase().includes(searchText) ||
          char.tags?.some(tag => tag.toLowerCase().includes(searchText));
        if (!matchesText) return false;
      }

      // Unit type filter
      if (filters.unitTypes?.length && !filters.unitTypes.includes(char.role || '')) {
        return false;
      }

      // Faction filter
      if (filters.factions?.length && !filters.factions.some(f => char.faction?.includes(f))) {
        return false;
      }

      // Era filter
      if (filters.eras?.length && !filters.eras.includes(char.era || '')) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Generate facets from data
  const facets = useMemo(() => {
    const unitTypes = [...new Set(data.map(c => c.role).filter(Boolean))];
    const factions = [...new Set(data.flatMap(c => c.faction?.split(', ') || []).filter(Boolean))];
    const tags = [...new Set(data.flatMap(c => c.tags || []))];
    const eras = [...new Set(data.map(c => c.era).filter(Boolean))];
    
    return {
      unitTypes,
      factions,
      eras,
      tags
    };
  }, [data]);

  return (
    <div style={{maxWidth: 1200, margin: "0 auto", padding: "0 16px"}}>
      <h1 style={{margin: "18px 0"}}>Characters</h1>
      {loading ? <p>Loading…</p> : null}
      
      {!loading && data.length > 0 && (
        <>
          {/* Filters Panel - Single Line */}
          <div style={{ display: 'block', width: '100%' }}>
            <FiltersPanel
              facets={facets}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          {/* Results count */}
          <div style={{marginBottom: "16px", fontSize: "14px", color: "#6b7280"}}>
            Showing {filteredData.length} of {data.length} characters
          </div>
        </>
      )}

      {!loading && data.length === 0 ? (
        <p>No data (empty list).</p>
      ) : null}

      {!loading && filteredData.length === 0 && data.length > 0 ? (
        <p>No characters match your filters.</p>
      ) : null}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
        marginTop: "20px"
      }}>
        {filteredData.map(c => (
            <div key={c.id} style={{
              background: "#1f2937",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #374151",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={() => setSelectedCharacter(c)}>
              <div style={{
                width: "100%",
                height: "320px",
                overflow: "hidden",
                position: "relative",
                background: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <img 
                  src={c.portrait?.startsWith('/') ? c.portrait : (c.portrait ?? "https://picsum.photos/seed/placeholder/400/520")} 
                  alt={c.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    objectPosition: "center"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/placeholder/400/520";
                  }}
                />
              </div>
              <div style={{padding: "12px"}}>
                <div style={{
                  fontWeight: "600",
                  color: "#f9fafb",
                  marginBottom: "4px",
                  fontSize: "14px",
                  lineHeight: "1.3"
                }}>{c.name}</div>
                <div style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "6px"
                }}>
                  {c.role} • {c.faction || "Unknown"}
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginBottom: "8px",
                  fontStyle: "italic"
                }}>
                  {c.era || "Unknown Era"}
                </div>
                <div style={{
                  display: "flex",
                  gap: "6px",
                  fontSize: "11px",
                  marginBottom: "6px"
                }}>
                  {c.sp && (
                    <span style={{
                      background: "#374151",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#d1d5db",
                      fontWeight: "500"
                    }}>SP: {c.sp}</span>
                  )}
                  {c.pc && (
                    <span style={{
                      background: "#374151", 
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#d1d5db",
                      fontWeight: "500"
                    }}>PC: {c.pc}</span>
                  )}
                  {c.force && c.force > 0 && (
                    <span style={{
                      background: "#7c2d12",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#fbbf24",
                      fontWeight: "500"
                    }}>Force: {c.force}</span>
                  )}
                </div>
                {(c.stamina || c.durability) && (
                  <div style={{
                    fontSize: "10px",
                    color: "#6b7280",
                    marginBottom: "8px"
                  }}>
                    {c.stamina && `Stamina: ${c.stamina}`}
                    {c.stamina && c.durability && " • "}
                    {c.durability && `Durability: ${c.durability}`}
                  </div>
                )}
                {c.tags && c.tags.length > 0 && (
                  <div style={{
                    marginTop: "8px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "3px"
                  }}>
                    {c.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} style={{
                        background: "#1e40af",
                        color: "#dbeafe",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        fontSize: "10px",
                        fontWeight: "500"
                      }}>
                        {tag}
                      </span>
                    ))}
                    {c.tags.length > 2 && (
                      <span style={{
                        background: "#4b5563",
                        color: "#d1d5db",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        fontSize: "10px"
                      }}>
                        +{c.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
        ))}
      </div>

      {/* Character Modal */}
      {selectedCharacter && (
        <CharacterModal
          open={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          id={selectedCharacter.id}
          character={{
            id: selectedCharacter.id,
            name: selectedCharacter.name,
            unit_type: selectedCharacter.role as "Primary" | "Secondary" | "Support",
            squad_points: selectedCharacter.sp || selectedCharacter.pc || 0,
            portrait: selectedCharacter.portrait
          }}
        />
      )}
    </div>
  );
}

/* ====== Routes ====== */
export default function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={
          <div style={{maxWidth:1100,margin:"12px auto",padding:"0 16px"}}>
            <h1>Home</h1><p>Welcome to ShPoint.</p>
          </div>
        }/>
        <Route path="/characters" element={<CharactersPage/>}/>
        <Route path="/collections" element={<CollectionsPage/>}/>
        <Route path="/builder" element={
          <div style={{maxWidth:1100,margin:"12px auto",padding:"0 16px"}}>
            <h1>Builder</h1><p>Work in progress…</p>
          </div>
        }/>
      </Routes>
    </>
  );
}