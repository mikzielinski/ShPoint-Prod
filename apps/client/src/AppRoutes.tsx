import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "./lib/env";
import { MissionsProvider } from "./contexts/MissionsContext";
import { PlayersProvider } from "./contexts/PlayersContext";
import { StrikeTeamsProvider } from "./contexts/StrikeTeamsContext";
import HomePage from "./pages/HomePage";
import CollectionsPage from "./pages/CollectionsPage";
import MyCollectionPage from "./pages/MyCollectionPage";
import PublicStrikeTeamsPage from "./pages/PublicStrikeTeamsPage";
import ShatterpointLibraryPage from "./pages/ShatterpointLibraryPage";
import SetsPage from "./pages/SetsPage";
import MissionsPage from "./pages/MissionsPage";
import AdminPage from "./pages/AdminPage";
import ContentManagementPage from "./pages/ContentManagementPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import BannedPage from "./pages/BannedPage";
import TableAssistantPage from "./pages/TableAssistantPage";
import PlayPage from "./pages/PlayPage";
import HeroVsHeroPage from "./pages/HeroVsHeroPage";
import StrikeTeamVsStrikeTeamPage from "./pages/StrikeTeamVsStrikeTeamPage";
import BattlePage from "./pages/BattlePage";
import FAQPage from "./pages/FAQPage";
import UserProfile from "./components/UserProfile";
import SquadBuilder from "./components/SquadBuilder";
import AchievementsPage from "./components/AchievementsPage";
import RequireAuth from "./routers/RequireAuth";
import FiltersPanel, { type Filters } from "./components/FiltersPanel";
import CharacterModal from "./components/CharacterModal";
import AvatarManager from "./components/AvatarManager";
import Modal from "./components/Modal";
import UserInvitationModal from "./components/UserInvitationModal";
import NavBar from "./components/NavBar";

/* ===== Auth hook for user status checks ===== */
type MeResponse =
  | { user: { id: string; email?: string; name?: string; username?: string | null; role?: string; status?: string; image?: string | null; avatarUrl?: string | null; suspendedUntil?: string | null } }
  | { user?: undefined };

function useAuthMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const refetch = async () => {
    try {
      const res = await fetch(api("/api/me"), { credentials: "include" });
      setData(res.ok ? ((await res.json()) as MeResponse) : { user: undefined });
    } catch {
      setData({ user: undefined });
    }
  };
  
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(api("/api/me"), { credentials: "include" });
        if (!alive) return;
        setData(res.ok ? ((await res.json()) as MeResponse) : { user: undefined });
      } catch {
        setData({ user: undefined });
      } finally { alive && setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  
  return { data, loading, refetch };
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
  const [characterCollections, setCharacterCollections] = useState<any[]>([]);
  const { data: authData } = useAuthMe();
  const me = authData?.user;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        console.log('🔍 Fetching characters from:', api("/api/characters"));
        const res = await fetch(api("/api/characters"), { credentials: "include" });
        console.log('📊 Characters response status:', res.status);
        const json = (await res.json()) as ApiList;
        console.log('📊 Characters data:', { ok: json.ok, itemsCount: json.items?.length, total: json.total });
        if (alive) setData(json.items ?? []);
      } catch (error) { 
        console.error('❌ Error loading characters:', error);
        if (alive) setData([]); 
      }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  // Load character collections
  useEffect(() => {
    if (!me) return;
    
    let alive = true;
    (async () => {
      try {
        const res = await fetch(api("/api/shatterpoint/characters"), { credentials: "include" });
        const json = await res.json();
        if (alive && json.ok) {
          setCharacterCollections(json.collections || []);
        }
      } catch (err) {
        console.error('Error loading character collections:', err);
      }
    })();
    return () => { alive = false; };
  }, [me]);

  // Check if character is in collection
  const isCharacterInCollection = (characterId: string) => {
    return characterCollections.some(c => c.characterId === characterId && c.isOwned);
  };

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
      
      // SWP28 - Not Accepting Surrenders Squad Pack
      'Grand Admiral Thrawn': 'grand-admiral-thrawn',
      'Agent Kallus': 'agent-kallus-inside-man',
      'Agent Kallus, Inside Man': 'agent-kallus-inside-man',
      'ISB Agents': 'isb-agents',
    };
    
    return nameMap[characterName] || characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  // Auto-add sets to collection when character is added
  const checkAndAutoAddSets = async (addedCharacterId: string) => {
    if (!me) return;
    
    try {
      // Get current character collections
      const charResponse = await fetch(api("/api/shatterpoint/characters"), {
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
        },
        {
          id: 'swp28',
          name: 'Not Accepting Surrenders Squad Pack',
          code: 'SWP28',
          type: 'Squad Pack',
          description: 'Imperial forces led by Grand Admiral Thrawn',
          characters: [
            { role: 'Primary', name: 'Grand Admiral Thrawn' },
            { role: 'Secondary', name: 'Agent Kallus, Inside Man' },
            { role: 'Supporting', name: 'ISB Agents' }
          ]
        }
        // Add more sets as needed
      ];
      
      // Find sets that contain the added character
      const relevantSets = sets.filter(set => {
        if (!set.characters || set.characters.length === 0) return false;
        return set.characters.some(character => {
          const characterId = getCharacterId(character.name);
          return characterId === addedCharacterId;
        });
      });
      
      console.log(`🔍 Checking sets for character ${addedCharacterId}:`, relevantSets.map(s => s.name));
      console.log(`📊 Current character collections:`, characterCollections.map((c: any) => ({ characterId: c.characterId, isOwned: c.isOwned, isPainted: c.isPainted })));
      
      // Check only relevant sets for auto-add
      for (const set of relevantSets) {
        console.log(`🔍 Checking set "${set.name}" for completeness...`);
        // Check if user has all characters from this set
        const hasAllCharacters = set.characters.every(character => {
          const characterId = getCharacterId(character.name);
          const hasCharacter = characterCollections.some((collection: any) => 
            collection.characterId === characterId && 
            (collection.isOwned || collection.isPainted)
          );
          console.log(`  - Character "${character.name}" (ID: ${characterId}): ${hasCharacter ? '✅' : '❌'}`);
          return hasCharacter;
        });
        
        if (hasAllCharacters) {
          console.log(`🎉 Auto-adding set "${set.name}" to collection!`);
          
          // Add set to collection
          const setResponse = await fetch(api("/api/shatterpoint/sets"), {
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
      const response = await fetch(api('/api/shatterpoint/sets'), {
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
      alert('❌ Error adding SWP24 set: ' + (error as Error).message);
    }
  };

  // Handle adding character to collection
  const handleAddToCollection = async (characterId: string) => {
    if (!me) return;
    
    try {
      const response = await fetch(api("/api/shatterpoint/characters"), {
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
      
      // Refresh character collections
      const res = await fetch(api("/api/shatterpoint/characters"), { credentials: "include" });
      const json = await res.json();
      if (json.ok) {
        setCharacterCollections(json.collections || []);
      }
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('characterCollectionUpdated', { 
        detail: { characterId, action: 'added' } 
      }));
      
      // Check if any sets should be auto-added for this specific character
      await checkAndAutoAddSets(characterId);
      
      // Check achievements after adding character
      try {
        const achievementResponse = await fetch(api(`/api/dev/check-achievements/${me.id}`), {
          method: 'POST',
          credentials: 'include'
        });
        if (achievementResponse.ok) {
          console.log('✅ Achievements checked after adding character');
        }
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
        // Don't fail the whole operation if achievement check fails
      }
      
    } catch (error) {
      console.error("Error adding character to collection:", error);
      alert("Failed to add character to collection");
    }
  };

  // Handle adding character to wishlist
  const handleAddToWishlist = async (characterId: string) => {
    if (!me) return;
    
    try {
      const response = await fetch(api("/api/shatterpoint/characters"), {
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
      const response = await fetch(api("/api/shatterpoint/characters"), {
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
    const unitTypes = [...new Set(data.map(c => c.role).filter(Boolean))] as string[];
    
    // Fix factions - handle string format from API
    const allFactions = data.map(c => {
      if (typeof c.faction === 'string' && c.faction !== 'Unknown') {
        return c.faction;
      }
      return null;
    }).filter(Boolean);
    
    const factions = [...new Set(allFactions)] as string[];
    
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
          <div style={{ 
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <FiltersPanel
              facets={facets}
              filters={filters}
              onChange={setFilters}
              darkMode={true}
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
                background: "#1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <img 
                  src={c.portrait?.startsWith('/') ? c.portrait : (c.portrait ?? "https://picsum.photos/seed/placeholder/400/520")} 
                  alt={c.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/placeholder/400/520";
                  }}
                />
                {/* Sign in message for unauthenticated users */}
                {!me && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0, 0, 0, 0.8)",
                    color: "#9ca3af",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "500"
                  }}>
                    Sign in to add
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

                {/* Action Buttons */}
                {me && (
                  <div style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap"
                  }}>
                    {/* Add to Collection / Owned Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCollection(c.id);
                      }}
                      style={{
                        background: isCharacterInCollection(c.id) ? "#16a34a" : "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        flex: "1",
                        minWidth: "80px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#15803d";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#16a34a";
                      }}
                    >
                      {isCharacterInCollection(c.id) ? "✓ Owned" : "+ Collection"}
                    </button>

                    {/* Add to Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(c.id);
                      }}
                      style={{
                        background: "#ea580c",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        flex: "1",
                        minWidth: "80px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#c2410c";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ea580c";
                      }}
                    >
                      ⭐ Wishlist
                    </button>

                    {/* Add to Favorites Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToFavorites(c.id);
                      }}
                      style={{
                        background: "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        flex: "1",
                        minWidth: "80px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#d97706";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f59e0b";
                      }}
                    >
                      ♥ Favorite
                    </button>
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
            portrait: selectedCharacter.portrait || undefined
          }}
        />
      )}
    </div>
  );
}

/* ====== Routes ====== */
export default function AppRoutes() {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const { data: me, refetch } = useAuthMe();

  // Check user status and redirect if needed
  useEffect(() => {
    if (me?.user) {
      const user = me.user;
      
      // Check if user is suspended
      if (user.status === 'SUSPENDED' && user.suspendedUntil) {
        const now = new Date();
        const suspendedUntil = new Date(user.suspendedUntil);
        
        // If suspension has ended, refresh user data
        if (now >= suspendedUntil) {
          // Refresh user data to get updated status
          refetch();
          return;
        }
        
        // Only redirect if suspension is still active
        if (now < suspendedUntil) {
          // Allow only /banned and /library pages during suspension
          if (!['/banned', '/library'].includes(window.location.pathname)) {
            window.location.href = '/banned';
            return;
          }
        }
      }
      
      // Check if user is not authorized (no role or invalid role)
      if (!user.role || user.role === 'GUEST') {
        // Allow access to library and unauthorized page
        if (!['/library', '/unauthorized'].includes(window.location.pathname)) {
          window.location.href = '/unauthorized';
          return;
        }
      }
    }
  }, [me, refetch]);

  return (
    <MissionsProvider>
      <PlayersProvider>
        <StrikeTeamsProvider>
          <NavBar />
          <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/builder" element={
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
            <SquadBuilder />
          </div>
        }/>
        <Route path="/library" element={<ShatterpointLibraryPage/>}/>
        <Route path="/characters" element={<CharactersPage/>}/>
        <Route path="/sets" element={<SetsPage/>}/>
        <Route path="/missions" element={<MissionsPage/>}/>
        <Route path="/play" element={<PlayPage/>}/>
        <Route path="/play/hero-vs-hero" element={<HeroVsHeroPage/>}/>
        <Route path="/play/strike-team-vs-strike-team" element={<StrikeTeamVsStrikeTeamPage/>}/>
        <Route path="/play/battle" element={<BattlePage/>}/>
        <Route path="/play/table-assistant" element={<TableAssistantPage/>}/>
        <Route path="/my-collection" element={<MyCollectionPage/>}/>
        <Route path="/strike-teams" element={<PublicStrikeTeamsPage/>}/>
        <Route path="/collections" element={<CollectionsPage/>}/>
        <Route path="/admin" element={<AdminPage/>}/>
        <Route path="/content-management" element={<ContentManagementPage/>}/>
        <Route path="/faq" element={<FAQPage/>}/>
        <Route path="/user" element={<RequireAuth><UserProfile/></RequireAuth>}/>
        <Route path="/achievements" element={<RequireAuth><AchievementsPage/></RequireAuth>}/>
        <Route path="/unauthorized" element={<UnauthorizedPage/>}/>
        <Route path="/banned" element={<BannedPage/>}/>
        <Route path="/auth/google/failure" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Authentication Failed</h2>
            <p>There was an error during Google authentication.</p>
            <button onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
          </div>
        }/>
      </Routes>
      
      {/* Avatar Manager Modal */}
      {showAvatarModal && (
        <Modal open={showAvatarModal} onClose={() => setShowAvatarModal(false)}>
          <AvatarManager 
            onAvatarUpdate={() => setShowAvatarModal(false)}
            onClose={() => setShowAvatarModal(false)}
          />
        </Modal>
      )}
      
      {/* User Invitation Modal */}
      <UserInvitationModal 
        isOpen={showInvitationModal} 
        onClose={() => setShowInvitationModal(false)} 
      />
        </StrikeTeamsProvider>
      </PlayersProvider>
    </MissionsProvider>
  );
}