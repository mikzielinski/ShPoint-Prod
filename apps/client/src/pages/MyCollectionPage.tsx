import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import CharacterModal from '../components/CharacterModal';

interface CharacterCollection {
  id: string;
  characterId: string;
  status: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Character {
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
}

interface SetCollection {
  id: string;
  setId: string;
  status: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionStats {
  characters: {
    total: number;
    owned: number;
    painted: number;
    wishlist: number;
  };
  sets: {
    total: number;
    owned: number;
    painted: number;
    wishlist: number;
  };
}

export default function MyCollectionPage() {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  const [characterCollections, setCharacterCollections] = useState<CharacterCollection[]>([]);
  const [setCollections, setSetCollections] = useState<SetCollection[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Usunięto activeTab - teraz mamy jeden główny widok
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [factionFilter, setFactionFilter] = useState<string>('ALL');
  const [eraFilter, setEraFilter] = useState<string>('ALL');

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all characters first
      const charactersResponse = await fetch(api('/api/characters'), {
        credentials: 'include',
      });
      if (!charactersResponse.ok) throw new Error('Failed to load characters');
      const charactersData = await charactersResponse.json();
      setAllCharacters(charactersData.items || []);

      // Load character collections
      const characterResponse = await fetch(api('/api/shatterpoint/characters'), {
        credentials: 'include',
      });
      if (!characterResponse.ok) throw new Error('Failed to load character collections');
      const characterData = await characterResponse.json();
      setCharacterCollections(characterData.collections || []);

      // Load set collections
      const setResponse = await fetch(api('/api/shatterpoint/sets'), {
        credentials: 'include',
      });
      if (!setResponse.ok) throw new Error('Failed to load set collections');
      const setData = await setResponse.json();
      setSetCollections(setData.collections || []);

      // Load stats
      const statsResponse = await fetch(api('/api/shatterpoint/stats'), {
        credentials: 'include',
      });
      if (!statsResponse.ok) throw new Error('Failed to load collection stats');
      const statsData = await statsResponse.json();
      setStats(statsData.stats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCharacter = async (characterId: string) => {
    try {
      const response = await fetch(api(`/api/shatterpoint/characters/${characterId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove character');
      
      setCharacterCollections(prev => prev.filter(c => c.characterId !== characterId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove character');
    }
  };

  const handleUpdateCharacterStatus = async (collectionId: string, newStatus: string) => {
    try {
      const response = await fetch(api(`/api/shatterpoint/characters/${collectionId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update character status');
      
      // Update local state
      setCharacterCollections(prev => 
        prev.map(c => 
          c.id === collectionId 
            ? { ...c, status: newStatus as any }
            : c
        )
      );
      
      // Refresh stats to update the percentages
      const statsResponse = await fetch(api('/api/shatterpoint/stats'), {
        credentials: 'include',
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
      
      // Show success message
      const character = allCharacters.find(c => 
        characterCollections.find(cc => cc.id === collectionId)?.characterId === c.id
      );
      if (character) {
        alert(`✅ ${character.name} marked as painted!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update character status');
    }
  };

  const handleRemoveSet = async (setId: string) => {
    try {
      const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove set');
      
      setSetCollections(prev => prev.filter(c => c.setId !== setId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove set');
    }
  };

  // Get characters with collection data
  const getCollectedCharacters = () => {
    return characterCollections.map(collection => {
      const character = allCharacters.find(c => c.id === collection.characterId);
      return character ? { ...character, collection } : null;
    }).filter(Boolean) as (Character & { collection: CharacterCollection })[];
  };

  const getFilteredCharacters = () => {
    let filtered = getCollectedCharacters();
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.collection.status === statusFilter);
    }
    
    // Filter by faction
    if (factionFilter !== 'ALL') {
      filtered = filtered.filter(c => c.faction === factionFilter);
    }
    
    // Filter by era
    if (eraFilter !== 'ALL') {
      filtered = filtered.filter(c => c.era === eraFilter);
    }
    
    return filtered;
  };

  if (auth.status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">My Collection</h1>
        <p className="text-gray-600 mb-4">Please log in to view your collection.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div style={{maxWidth: 1200, margin: "0 auto", padding: "0 16px"}}>
      <h1 style={{margin: "18px 0"}}>My Collection</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px"
          }}
        >
          <option value="ALL">All Status</option>
          <option value="OWNED">Owned</option>
          <option value="PAINTED">Painted</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="FAVORITE">Favorites</option>
          <option value="SOLD">Sold</option>
        </select>

        <select
          value={factionFilter}
          onChange={(e) => setFactionFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px"
          }}
        >
          <option value="ALL">All Factions</option>
          {Array.from(new Set(getCollectedCharacters().map(c => c.faction).filter(Boolean))).map(faction => (
            <option key={faction} value={faction}>{faction}</option>
          ))}
        </select>

        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px"
          }}
        >
          <option value="ALL">All Eras</option>
          {Array.from(new Set(getCollectedCharacters().map(c => c.era).filter(Boolean))).map(era => (
            <option key={era} value={era}>{era}</option>
          ))}
        </select>

        {/* Quick Paint Filter Button */}
        <button
          onClick={() => {
            if (statusFilter === 'PAINTED') {
              setStatusFilter('ALL');
            } else {
              setStatusFilter('PAINTED');
            }
          }}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: statusFilter === 'PAINTED' ? '#2563eb' : '#1f2937',
            color: "#f9fafb",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
          onMouseEnter={(e) => {
            if (statusFilter !== 'PAINTED') {
              e.currentTarget.style.background = '#374151';
            }
          }}
          onMouseLeave={(e) => {
            if (statusFilter !== 'PAINTED') {
              e.currentTarget.style.background = '#1f2937';
            }
          }}
        >
          🎨 {statusFilter === 'PAINTED' ? 'Show All' : 'Show Painted Only'}
        </button>
      </div>

      {/* Main layout: Left sidebar with stats, Right main area with characters */}
      <div style={{
        display: "flex",
        gap: "24px",
        marginTop: "20px"
      }}>
        {/* Left sidebar - Statistics */}
        <div style={{
          width: "280px",
          flexShrink: 0
        }}>
          {stats && (
            <div style={{
              background: "#1f2937",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #374151"
            }}>
              <h3 style={{
                color: "#f9fafb",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px"
              }}>Collection Statistics</h3>
              
              {/* Character Stats */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{
                  color: "#d1d5db",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px"
                }}>Characters</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Total:</span>
                    <span style={{ color: "#f9fafb", fontWeight: "500" }}>{stats.characters.total}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Owned:</span>
                    <span style={{ color: "#16a34a", fontWeight: "500" }}>{stats.characters.owned}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Painted:</span>
                    <span style={{ color: "#2563eb", fontWeight: "500" }}>
                      {stats.characters.painted} 
                      {stats.characters.owned > 0 && (
                        <span style={{ color: "#6b7280", fontSize: "10px", marginLeft: "4px" }}>
                          ({Math.round((stats.characters.painted / stats.characters.owned) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Wishlist:</span>
                    <span style={{ color: "#ea580c", fontWeight: "500" }}>{stats.characters.wishlist}</span>
                  </div>
                </div>
              </div>

              {/* Set Stats */}
              <div>
                <h4 style={{
                  color: "#d1d5db",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px"
                }}>Sets</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Total:</span>
                    <span style={{ color: "#f9fafb", fontWeight: "500" }}>{stats.sets.total}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Owned:</span>
                    <span style={{ color: "#16a34a", fontWeight: "500" }}>{stats.sets.owned}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Painted:</span>
                    <span style={{ color: "#2563eb", fontWeight: "500" }}>{stats.sets.painted}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#9ca3af" }}>Wishlist:</span>
                    <span style={{ color: "#ea580c", fontWeight: "500" }}>{stats.sets.wishlist}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right main area - Characters */}
        <div style={{ flex: 1 }}>
          {characterCollections.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#6b7280"
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#f9fafb"
              }}>No characters in collection</h2>
              <p style={{ marginBottom: "16px" }}>Visit the Characters page to add characters to your collection.</p>
              <a 
                href="/characters" 
                style={{
                  background: "#3b82f6",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  display: "inline-block"
                }}
              >
                Browse Characters
              </a>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "16px"
            }}>
              {getFilteredCharacters().map((character) => (
                <div key={character.id} style={{
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
                onClick={() => setSelectedCharacter(character)}>
                  <div style={{
                    width: "100%",
                    height: "240px",
                    overflow: "hidden",
                    position: "relative",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <img 
                      src={character.portrait?.startsWith('/') ? character.portrait : (character.portrait ?? "https://picsum.photos/seed/placeholder/400/520")} 
                      alt={character.name}
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
                    {/* Status Badge */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px"
                    }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "600",
                        backgroundColor: character.collection.status === 'OWNED' ? '#16a34a' :
                                        character.collection.status === 'PAINTED' ? '#2563eb' :
                                        character.collection.status === 'WISHLIST' ? '#ea580c' :
                                        character.collection.status === 'FAVORITE' ? '#f59e0b' :
                                        '#6b7280',
                        color: "white"
                      }}>
                        {character.collection.status}
                      </span>
                    </div>
                    
                    {/* Mark as Painted Button */}
                    {character.collection.status === 'OWNED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateCharacterStatus(character.collection.id, 'PAINTED');
                        }}
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "10px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1d4ed8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#2563eb";
                        }}
                      >
                        Mark Painted
                      </button>
                    )}
                  </div>
                  <div style={{padding: "12px"}}>
                    <div style={{
                      fontWeight: "600",
                      color: "#f9fafb",
                      marginBottom: "4px",
                      fontSize: "14px",
                      lineHeight: "1.3"
                    }}>{character.name}</div>
                    <div style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px"
                    }}>
                      {character.role} • {character.faction || "Unknown"}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      marginBottom: "8px",
                      fontStyle: "italic"
                    }}>
                      {character.era || "Unknown Era"}
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "6px",
                      fontSize: "11px",
                      marginBottom: "6px"
                    }}>
                      {character.sp && (
                        <span style={{
                          background: "#374151",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#d1d5db",
                          fontWeight: "500"
                        }}>SP: {character.sp}</span>
                      )}
                      {character.pc && (
                        <span style={{
                          background: "#374151", 
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#d1d5db",
                          fontWeight: "500"
                        }}>PC: {character.pc}</span>
                      )}
                      {character.force && character.force > 0 && (
                        <span style={{
                          background: "#7c2d12",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#fbbf24",
                          fontWeight: "500"
                        }}>Force: {character.force}</span>
                      )}
                    </div>
                    {(character.stamina || character.durability) && (
                      <div style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        marginBottom: "8px"
                      }}>
                        {character.stamina && `Stamina: ${character.stamina}`}
                        {character.stamina && character.durability && " • "}
                        {character.durability && `Durability: ${character.durability}`}
                      </div>
                    )}
                    {character.tags && character.tags.length > 0 && (
                      <div style={{
                        marginTop: "8px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "3px"
                      }}>
                        {character.tags.slice(0, 2).map((tag, i) => (
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
                        {character.tags.length > 2 && (
                          <span style={{
                            background: "#4b5563",
                            color: "#d1d5db",
                            padding: "1px 4px",
                            borderRadius: "3px",
                            fontSize: "10px"
                          }}>
                            +{character.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Collection Notes */}
                    {character.collection.notes && (
                      <div style={{
                        marginTop: "8px",
                        padding: "4px 6px",
                        background: "#374151",
                        borderRadius: "4px",
                        fontSize: "10px",
                        color: "#9ca3af",
                        fontStyle: "italic"
                      }}>
                        Note: {character.collection.notes}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap"
                    }}>
                      {/* Unpaint Button - only show for painted characters */}
                      {character.collection.status === 'PAINTED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCharacterStatus(character.collection.id, 'OWNED');
                          }}
                          style={{
                            background: "#16a34a",
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
                          Unpaint
                        </button>
                      )}

                      {/* Mark as Favorite Button - only show for non-favorite characters */}
                      {character.collection.status !== 'FAVORITE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCharacterStatus(character.collection.id, 'FAVORITE');
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
                      )}

                      {/* Remove from Collection Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${character.name} from your collection?`)) {
                            handleRemoveCharacter(character.id);
                          }
                        }}
                        style={{
                          background: "#dc2626",
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
                          e.currentTarget.style.background = "#b91c1c";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#dc2626";
                        }}
                        >
                          Remove
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
