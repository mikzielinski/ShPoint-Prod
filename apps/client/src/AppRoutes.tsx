import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import CollectionsPage from "./pages/CollectionsPage";
import MyCollectionPage from "./pages/MyCollectionPage";
import MyStrikeTeamsPage from "./pages/MyStrikeTeamsPage";
import ShatterpointLibraryPage from "./pages/ShatterpointLibraryPage";
import SetsPage from "./pages/SetsPage";
import MissionsPage from "./pages/MissionsPage";
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
          <NavLink to="/library" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>Library</NavLink>
          {me && (
            <>
              <NavLink to="/my-collection" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>My Collection</NavLink>
              <NavLink to="/my-strike-teams" className={({isActive}) => `nb-link ${isActive ? "is-active" : ""}`}>My Strike Teams</NavLink>
            </>
          )}
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
  const { data: authData } = useAuthMe();
  const me = authData?.user;

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
          (char.faction && char.faction.toLowerCase().includes(searchText)) ||
          char.tags?.some(tag => tag.toLowerCase().includes(searchText));
        if (!matchesText) return false;
      }

      // Unit type filter
      if (filters.unitTypes?.length && !filters.unitTypes.includes(char.role || '')) {
        return false;
      }

      // Faction filter - handle string format
      if (filters.factions?.length) {
        if (!filters.factions.includes(char.faction || '')) {
          return false;
        }
      }

      // Era filter - handle both array and string formats
      if (filters.eras?.length) {
        const charEras = Array.isArray(char.era) ? char.era : [char.era].filter(Boolean);
        if (!filters.eras.some(e => charEras.includes(e))) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags?.length && !filters.tags.some(t => char.tags?.includes(t))) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Helper function to map character names to character IDs (same as in SetsPage)
  const getCharacterId = (characterName: string): string => {
    const nameMap: { [key: string]: string } = {
      // SWP24 - Certified Guild Squad Pack
      'Din Djarin (The Mandalorian)': 'the-mandalorian',
      'The Mandalorian': 'the-mandalorian', // Alternative name
      'IG-11': 'ig-11-assassin-droid',
      'IG-11, Assassin Droid': 'ig-11-assassin-droid', // Alternative name
      'Greef Karga': 'greef-karga',
      
      // Core Set and other common characters
      'General Anakin Skywalker': 'general-anakin-skywalker',
      'Captain Rex (CC-7567)': 'cc-7567-captain-rex',
      '501st Clone Troopers': '501st-clone-troopers',
      'Ahsoka Tano, Jedi no more': 'ahsoka-tano-jedi-no-more',
      'Ahsoka Tano (Rebels era)': 'ahsoka-tano-fulcrum',
      'Bo-Katan Kryze': 'bo-katan-kryze',
      'Clan Kryze Mandalorians': 'clan-kryze-mandalorians',
      'Asajj Ventress, Sith Assassin': 'asajj-ventress-sith-assassin',
      'Kalani (Super Tactical Droid)': 'kalani-super-tactical-droid',
      'B1 Battle Droids': 'b1-battle-droids',
      'Darth Maul (Lord Maul)': 'lord-maul',
      'Gar Saxon': 'gar-saxon-merciless-commander',
      'Shadow Collective Commandos': 'mandalorian-super-commandos',
      
      // More characters from various sets
      'The Armorer': 'the-armorer',
      'Paz Vizsla': 'paz-vizsla',
      'Covert Mandalorians': 'covert-mandalorians',
      'Darth Vader': 'darth-vader-jedi-hunter',
      'Commander (Imperial Officer)': 'commander-iden-versio',
      'Stormtroopers': 'stormtroopers',
      'Luke Skywalker (Jedi Knight)': 'jedi-knight-luke-skywalker',
      'Leia Organa (Boushh Disguise)': 'boushh-leia-organa',
      'Lando Calrissian & R2-D2': 'lando-and-r2-d2-inside-job',
    };
    
    return nameMap[characterName] || characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  // Auto-add sets to collection when character is added
  const checkAndAutoAddSets = async () => {
    if (!me) return;
    
    try {
      // Get current character collections
      const charResponse = await fetch("/api/shatterpoint/characters", {
        credentials: "include"
      });
      
      if (!charResponse.ok) return;
      
      const charData = await charResponse.json();
      const characterCollections = charData.collections || charData || [];
      
      // Get all sets (we'll need to define this or fetch from API)
      const sets = [
        {
          id: 'swp24',
          name: 'Certified Guild Squad Pack',
          code: 'SWP24',
          type: 'Squad Pack',
          description: 'Din Djarin and his allies',
          characters: [
            { role: 'Primary', name: 'Din Djarin (The Mandalorian)' },
            { role: 'Secondary', name: 'IG-11' },
            { role: 'Supporting', name: 'Greef Karga' }
          ]
        }
        // Add more sets as needed
      ];
      
      // Check each set for auto-add
      for (const set of sets) {
        if (!set.characters || set.characters.length === 0) continue;
        
        // Check if user has all characters from this set
        const hasAllCharacters = set.characters.every(character => {
          const characterId = getCharacterId(character.name);
          return characterCollections.some(collection => 
            collection.characterId === characterId && 
            (collection.status === 'OWNED' || collection.status === 'PAINTED')
          );
        });
        
        if (hasAllCharacters) {
          console.log(`🎉 Auto-adding set "${set.name}" to collection!`);
          
          // Add set to collection
          const setResponse = await fetch("/api/shatterpoint/sets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              setId: set.id,
              status: 'OWNED'
            })
          });
          
          if (setResponse.ok) {
            console.log(`✅ Successfully auto-added set "${set.name}"`);
            alert(`🎉 Set "${set.name}" automatically added to your collection!`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking auto-add sets:", error);
    }
  };

  // Make the function available globally for testing
  (window as any).checkAndAutoAddSets = checkAndAutoAddSets;
  
  // Add a function to manually add SWP24 set
  (window as any).addSWP24Set = async () => {
    try {
      const response = await fetch('/api/shatterpoint/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          setId: 'swp24',
          status: 'OWNED'
        })
      });
      
      const result = await response.json();
      console.log('SWP24 set add result:', result);
      
      if (response.ok) {
        alert('✅ SWP24 set added successfully! Please refresh the page to see it.');
      } else {
        alert('❌ Failed to add SWP24 set: ' + (result.error || 'Unknown error'));
      }
      
      return result;
    } catch (error) {
      console.error('Error adding SWP24 set:', error);
      alert('❌ Error adding SWP24 set: ' + error.message);
    }
  };

  // Handle adding character to collection
  const handleAddToCollection = async (characterId: string) => {
    if (!me) return;
    
    try {
      const response = await fetch("/api/shatterpoint/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          characterId,
          status: "OWNED"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add character to collection");
      }
      
      // Show success message
      alert(`Added ${characterId} to your collection!`);
      
      // Check if any sets should be auto-added
      await checkAndAutoAddSets();
      
    } catch (error) {
      console.error("Error adding character to collection:", error);
      alert("Failed to add character to collection");
    }
  };

  // Handle adding character to wishlist
  const handleAddToWishlist = async (characterId: string) => {
    if (!me) return;
    
    try {
      const response = await fetch("/api/shatterpoint/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          characterId,
          status: "WISHLIST"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add character to wishlist");
      }
      
      // Show success message
      alert(`Added ${characterId} to your wishlist!`);
      
      // Check if any sets should be auto-added (wishlist doesn't trigger auto-add, but we can check for owned characters)
      // await checkAndAutoAddSets();
      
    } catch (error) {
      console.error("Error adding character to wishlist:", error);
      alert("Failed to add character to wishlist");
    }
  };

  // Handle adding character to favorites
  const handleAddToFavorites = async (characterId: string) => {
    if (!me) return;
    
    try {
      const response = await fetch("/api/shatterpoint/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          characterId,
          status: "FAVORITE"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add character to favorites");
      }
      
      // Show success message
      alert(`Added ${characterId} to your favorites!`);
      
      // Check if any sets should be auto-added (favorites don't trigger auto-add, but we can check for owned characters)
      // await checkAndAutoAddSets();
      
    } catch (error) {
      console.error("Error adding character to favorites:", error);
      alert("Failed to add character to favorites");
    }
  };

  // Generate facets from data
  const facets = useMemo(() => {
    const unitTypes = [...new Set(data.map(c => c.role).filter(Boolean))];
    
    // Fix factions - handle string format from API
    const allFactions = data.map(c => {
      if (typeof c.faction === 'string' && c.faction !== 'Unknown') {
        return c.faction;
      }
      return null;
    }).filter(Boolean);
    
    const factions = [...new Set(allFactions)];
    
    // Fix eras - handle both array and string formats, remove duplicates
    const allEras = data.flatMap(c => {
      if (Array.isArray(c.era)) {
        return c.era;
      } else if (typeof c.era === 'string') {
        return [c.era];
      }
      return [];
    });
    const eras = [...new Set(allEras.filter(Boolean))];
    
    // Tags - get all unique tags
    const tags = [...new Set(data.flatMap(c => c.tags || []))];
    
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
                {/* Collection, Wishlist and Favorites buttons - only show for logged in users */}
                {me && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    display: "flex",
                    gap: "4px"
                  }}>
                    {/* Collection button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening modal
                        handleAddToCollection(c.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Add to collection"
                    >
                      +
                    </button>
                    
                    {/* Wishlist button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening modal
                        handleAddToWishlist(c.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(220, 38, 38, 0.9)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Add to wishlist"
                    >
                      ⭐
                    </button>

                    {/* Favorites button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening modal
                        handleAddToFavorites(c.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 193, 7, 0.9)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Add to favorites"
                    >
                      ♥
                    </button>
                  </div>
                )}
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
        <Route path="/library" element={<ShatterpointLibraryPage/>}/>
        <Route path="/characters" element={<CharactersPage/>}/>
        <Route path="/sets" element={<SetsPage/>}/>
        <Route path="/missions" element={<MissionsPage/>}/>
        <Route path="/my-collection" element={<MyCollectionPage/>}/>
        <Route path="/my-strike-teams" element={<MyStrikeTeamsPage/>}/>
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