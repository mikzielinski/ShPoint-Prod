import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import CharacterModal from '../components/CharacterModal';
import Modal from '../components/Modal';
import { setsData } from '../data/sets';

// SetImageWithFallback component for displaying set images
const SetImageWithFallback: React.FC<{ set: Set }> = ({ set }) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Generate possible image URLs for the set - use same URLs as SetsPage
  const generateUrls = (code: string): string[] => {
    const urls = [];
    const setCode = code.toUpperCase();
    
    // Real URLs scraped from AMG gallery (same as SetsPage)
    const knownUrls: { [key: string]: string[] } = {
      'SWP01': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP01_3DBox-Black-Background.webp'],
      'SWP02': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP02-image0@500-3.webp'],
      'SWP03': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP03-Featured-Image.webp'],
      'SWP04': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/07/SWP04-Featured-Image.webp'],
      'SWP05': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/07/SWP05-Featured-Image.webp'],
      'SWP06': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP06-Featured-Image-1.webp'],
      'SWP07': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/05/SWP07-Featured-Image.webp'],
      'SWP08': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/05/SWP08-Featured-Image.webp'],
      'SWP09': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/07/SWP09-Product-Image.webp'],
      'SWP10': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/02/SWP10-Featured-Image.webp'],
      'SWP11': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/12/SWP11-web@500.webp'],
      'SWP12': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/05/SWP12-Featured-Image.webp'],
      'SWP15': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/07/SWP15-Featured-Image.webp'],
      'SWP16': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/08/SWP16-Featured-Image.webp'],
      'SWP17': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP17-Featured-Image.webp'],
      'SWP18': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/05/SWP18-Featured-Image.webp'],
      'SWP19': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP19-Featured-Image.webp'],
      'SWP20': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/02/SWP20-Featured-Image.webp'],
      'SWP21': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/11/SWP21_Feature-Image.webp'],
      'SWP22': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/11/SWP22_Featured-Image.webp'],
      'SWP24': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/02/SWP24-Featured-Image.webp'],
      'SWP25': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/08/SWP25-Featured-Image.webp'],
      'SWP26': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/02/SWP26-Featured-Image.webp'],
      'SWP27': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/12/SWP27-web@500.webp'],
      'SWP28': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/05/SWP28-Featured-Image.webp'],
      'SWP29': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/05/SWP29-Featured-Image-2.webp'],
      'SWP30': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/05/SWP30-Featured-Image.webp'],
      'SWP31': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/01/SWP31-Featured-Image.webp'],
      'SWP34': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/04/SWP34-Featured-Image.webp'],
      'SWP35': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/04/SWP35-Featured-Image.webp'],
      'SWP36': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/07/SWP36-Featured-Image.webp'],
      'SWP37': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/12/SWP37-Featured-Image.webp'],
      'SWP38': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/02/SWP38-Featured-Image.webp'],
      'SWP39': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/12/SWP39-web@500.webp'],
      'SWP41': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/05/SWP41-Featured-Image.webp'],
      'SWP42': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/07/SWP42-image0@500.webp'],
      'SWP44': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/05/SWP44-Featured-Image.webp'],
      'SWP45': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2023/09/SWP45-Featured-Image-1.webp'],
      'SWP46': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/08/SWP46-Featured-Image.webp'],
      'SWP47': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/08/SWP47-Featured-Image.webp'],
      'SWP48': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/04/SWP48-Featured-Image.webp'],
      'SWP49': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/01/SWP49-Featured-Image.webp'],
      'SWP50': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2024/12/SWP50-Featured-Image.webp'],
      'SWP51': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/01/SWP51-Featured-Image.webp'],
      'SWP52': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/07/SWP52@500.webp'],
      'SWP60': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/07/SWP60@500.webp'],
      'SWP63': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/07/SWP63@500.webp'],
      'SWP81': ['https://cdn.svc.asmodee.net/production-amgcom/uploads/image-converter/2025/02/SWP81-Featured-Image.webp']
    };
    
    // Add known URLs for this set
    if (knownUrls[setCode] && Array.isArray(knownUrls[setCode])) {
      urls.push(...knownUrls[setCode]);
    }
    
    // Local fallback
    urls.push(`/images/sets/${set.code.toLowerCase()}.jpg`);
    
    return urls;
  };

  const possibleUrls = generateUrls(set.code);

  const handleImageError = () => {
    if (currentImageIndex < possibleUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  const getSetIcon = (set: Set): string => {
    switch (set.type) {
      case 'Core Set': return '🎯';
      case 'Squad Pack': return '👥';
      case 'Terrain Pack': return '🏗️';
      case 'Duel Pack': return '⚔️';
      case 'Mission Pack': return '📋';
      case 'Accessories': return '🎲';
      default: return '📦';
    }
  };

  if (imageError || possibleUrls.length === 0) {
    return (
      <div style={{
        width: "60px",
        height: "60px",
        background: "#374151",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#9ca3af",
        flexShrink: 0
      }}>
        <div style={{ fontSize: "16px", marginBottom: "2px" }}>
          {getSetIcon(set)}
        </div>
        <div style={{ fontSize: "8px", textAlign: "center" }}>
          {set.code}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "60px",
      height: "60px",
      borderRadius: "6px",
      overflow: "hidden",
      background: "#000000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }}>
      <img
        src={possibleUrls[currentImageIndex]}
        alt={set.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center"
        }}
        onError={handleImageError}
      />
    </div>
  );
};

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

interface Set {
  id: string;
  name: string;
  code: string; // SWPXX
  type: 'Core Set' | 'Squad Pack' | 'Terrain Pack' | 'Duel Pack' | 'Mission Pack';
  image?: string;
  characters?: string[]; // Character IDs included in this set
  description?: string;
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
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [setCollections, setSetCollections] = useState<SetCollection[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Usunięto activeTab - teraz mamy jeden główny widok
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'sets' | 'missions'>('characters');
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);
  const [showSetModal, setShowSetModal] = useState(false);
  
  // Use shared sets data
  const mockSets: Set[] = setsData;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [factionFilter, setFactionFilter] = useState<string>('ALL');
  const [eraFilter, setEraFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');

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

  // Handle removing set from collection
  const handleRemoveFromCollection = async (setId: string) => {
    if (!user) return;

    try {
      const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSetCollections(prev => prev.filter(c => c.setId !== setId));
        alert('Set removed from collection!');
      } else {
        console.error('Failed to remove set from collection');
        alert('Failed to remove set from collection');
      }
    } catch (error) {
      console.error('Error removing set from collection:', error);
      alert('Error removing set from collection');
    }
  };

  // Handle updating set status
  const handleUpdateStatus = async (setId: string, newStatus: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD') => {
    if (!user) return;

    try {
      const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        setSetCollections(prev => 
          prev.map(c => c.setId === setId ? { ...c, status: newStatus } : c)
        );
        
        // If set is marked as PAINTED, also mark all characters from this set as PAINTED
        if (newStatus === 'PAINTED') {
          const set = mockSets.find(s => s.id === setId);
          if (set && set.characters) {
            for (const character of set.characters) {
              const characterId = getCharacterId(character.name);
              const existingCollection = characterCollections.find(c => c.characterId === characterId);
              
              if (existingCollection && existingCollection.status === 'OWNED') {
                try {
                  await fetch(api(`/api/shatterpoint/characters/${existingCollection.id}`), {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ status: 'PAINTED' }),
                  });
                } catch (error) {
                  console.error(`Error updating character ${character.name} status:`, error);
                }
              }
            }
            // Reload character collections to reflect changes
            loadCollections();
          }
        }
        
        alert(`Set status updated to ${newStatus.toLowerCase()}!`);
      } else {
        console.error('Failed to update set status');
        alert('Failed to update set status');
      }
    } catch (error) {
      console.error('Error updating set status:', error);
      alert('Error updating set status');
    }
  };

  // Handle set click to show character modal
  const handleSetClick = (set: Set) => {
    setSelectedSet(set);
    setShowSetModal(true);
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
    
    // Filter by faction - handle string format
    if (factionFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        // Use the correct field name 'faction' from the API (string)
        return c.faction === factionFilter;
      });
    }
    
    // Filter by era - handle array format
    if (eraFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        // Use the correct field name 'era' from the API (array)
        const charEras = Array.isArray(c.era) ? c.era : [c.era].filter(Boolean);
        return charEras.includes(eraFilter);
      });
    }
    
    // Filter by tags
    if (tagFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        return c.tags && c.tags.includes(tagFilter);
      });
    }
    
    return filtered;
  };

  const getSetCollection = (setId: string): SetCollection | null => {
    return setCollections.find(sc => sc.setId === setId) || null;
  };

  const getCollectedSets = () => {
    return mockSets.map(set => ({
      ...set,
      collection: getSetCollection(set.id)
    })).filter(set => set.collection);
  };

  const getFilteredSets = () => {
    let filtered = getCollectedSets();
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.collection?.status === statusFilter);
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
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        borderBottom: '1px solid #374151'
      }}>
        {[
          { id: 'characters', label: 'Characters', count: getCollectedCharacters().length },
          { id: 'sets', label: 'Sets/Boxes', count: getCollectedSets().length },
          { id: 'missions', label: 'Missions', count: 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'characters' | 'sets' | 'missions')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#374151' : 'transparent',
              color: activeTab === tab.id ? '#f9fafb' : '#9ca3af',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.color = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'characters' && (
        <>
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
          {Array.from(new Set(
            getCollectedCharacters().map(c => {
              // Use the correct field name 'faction' from the API (string)
              if (typeof c.faction === 'string' && c.faction !== 'Unknown') {
                return c.faction;
              }
              return null;
            }).filter(Boolean) // Filter out null values
          )).map(faction => (
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
          {Array.from(new Set(
            getCollectedCharacters().flatMap(c => {
              // Use the correct field name 'era' from the API (array)
              if (Array.isArray(c.era)) {
                return c.era;
              } else if (typeof c.era === 'string') {
                return [c.era];
              }
              return [];
            }).filter(Boolean) // Filter out empty values
          )).map(era => (
            <option key={era} value={era}>{era}</option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px"
          }}
        >
          <option value="ALL">All Tags</option>
          {Array.from(new Set(
            getCollectedCharacters().flatMap(c => c.tags || [])
          )).map(tag => (
            <option key={tag} value={tag}>{tag}</option>
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
                      {Array.isArray(character.era) ? character.era.join(', ') : (character.era || "Unknown Era")}
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
        </>
      )}

      {/* Sets/Boxes Tab */}
      {activeTab === 'sets' && (
        <>
          {/* Filters for Sets */}
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
              <option value="SOLD">Sold</option>
            </select>
          </div>

          {/* Sets Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px"
          }}>
            {getFilteredSets().length > 0 ? (
              getFilteredSets().map((set) => (
                <div
                  key={set.id}
                  onClick={() => handleSetClick(set)}
                  style={{
                    background: "#1f2937",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    padding: "16px",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#4b5563";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "12px"
                  }}>
                    <SetImageWithFallback set={set} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#f9fafb",
                        margin: "0 0 4px 0",
                        lineHeight: "1.3"
                      }}>
                        {set.name}
                      </h3>
                      <div style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginBottom: "8px"
                      }}>
                        {set.type}
                      </div>
                      {set.description && (
                        <p style={{
                          fontSize: "12px",
                          color: "#d1d5db",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4"
                        }}>
                          {set.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Buttons */}
                  {set.collection && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "12px",
                      flexWrap: "nowrap"
                    }}>
                      {['OWNED', 'PAINTED', 'WISHLIST', 'SOLD'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(set.id, status as any)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: set.collection?.status === status ? 
                              (status === 'OWNED' ? '#16a34a' :
                               status === 'PAINTED' ? '#2563eb' :
                               status === 'WISHLIST' ? '#ea580c' :
                               status === 'SOLD' ? '#dc2626' : '#6b7280') : '#374151',
                            color: 'white',
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (set.collection?.status !== status) {
                              e.currentTarget.style.background = '#4b5563';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (set.collection?.status !== status) {
                              e.currentTarget.style.background = '#374151';
                            }
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap"
                  }}>
                    {set.collection?.status !== 'OWNED' && (
                      <button
                        onClick={() => {
                          // TODO: Add to collection
                          console.log('Add to collection:', set.id);
                        }}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#15803d";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#16a34a";
                        }}
                      >
                        + Add to Collection
                      </button>
                    )}
                    
                    {set.collection?.status !== 'WISHLIST' && (
                      <button
                        onClick={() => handleUpdateStatus(set.id, 'WISHLIST')}
                        style={{
                          background: "#ea580c",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
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
                    )}
                    
                    {set.collection && (
                      <button
                        onClick={() => handleRemoveFromCollection(set.id)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
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
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#d1d5db",
                  marginBottom: "8px"
                }}>
                  No sets in your collection yet
                </h3>
                <p style={{
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  Start building your Star Wars: Shatterpoint collection by adding sets and expansion packs!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <div style={{
          padding: '20px',
          background: '#1f2937',
          borderRadius: '8px',
          border: '1px solid #374151'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '16px'
          }}>
            Missions Collection
          </h2>
          <p style={{
            color: '#9ca3af',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Track your completed missions and campaign progress here.
            <br />
            <em>Coming soon - this feature will allow you to track mission completion, campaign progress, and unlock rewards.</em>
          </p>
        </div>
      )}

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

      {/* Set Modal */}
      {selectedSet && (
        <Modal
          open={showSetModal}
          onClose={() => {
            setShowSetModal(false);
            setSelectedSet(null);
          }}
          maxWidth={800}
        >
          <div style={{
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#f9fafb'
            }}>
              {selectedSet.name}
            </h2>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <SetImageWithFallback set={selectedSet} />
              <div>
                <p style={{
                  fontSize: '16px',
                  color: '#d1d5db',
                  marginBottom: '8px'
                }}>
                  {selectedSet.type}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  lineHeight: '1.5'
                }}>
                  {selectedSet.description}
                </p>
              </div>
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#f9fafb'
            }}>
              Characters in this set:
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {selectedSet.characters?.map((character, index) => (
                <div
                  key={index}
                  style={{
                    background: '#374151',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #4b5563'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#f9fafb',
                    marginBottom: '4px'
                  }}>
                    {character.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {character.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
