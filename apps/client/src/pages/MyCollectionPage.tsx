import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import CharacterModal from '../components/CharacterModal';
import Modal from '../components/Modal';
import { MissionModal } from '../components/MissionModal';
import { setsData } from '../data/sets';
import { missionsData, Mission } from '../data/missions';
import FiltersPanel from '../components/FiltersPanel';
import { Facets } from '../lib/shpoint/characters/facets';
import { Filters } from '../components/FiltersPanel';

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
  isOwned: boolean;
  isPainted: boolean;
  isWishlist: boolean;
  isSold: boolean;
  isFavorite: boolean;
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
  isOwned: boolean;
  isPainted: boolean;
  isWishlist: boolean;
  isSold: boolean;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MissionCollection {
  id: string;
  userId: string;
  missionId: string;
  isOwned: boolean;
  isCompleted: boolean;
  isWishlist: boolean;
  isLocked: boolean;
  isFavorite: boolean;
  notes?: string;
  completedAt?: string;
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
  const [missionCollections, setMissionCollections] = useState<MissionCollection[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Usunięto activeTab - teraz mamy jeden główny widok
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'sets' | 'missions'>('characters');
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);
  const [showSetModal, setShowSetModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  
  // Use shared sets data
  const mockSets: Set[] = setsData;

  // Helper function to map character names to character IDs
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

      // Additional character mappings
      'Cad Bane': 'cad-bane-notorious-hunter',
      'Cad Bane, Notorious Hunter': 'cad-bane-notorious-hunter',
      'Aurra Sing': 'aurra-sing',
      'Bounty Hunters (Chadra-Fan, Todo 360, Devaronian)': 'bounty-hunters',
      'Count Dooku': 'count-dooku-separatist-leader',
      'Count Dooku, Separatist Leader': 'count-dooku-separatist-leader',
      'Jango Fett': 'jango-fett-bounty-hunter',
      'Jango Fett, Bounty Hunter': 'jango-fett-bounty-hunter',
      'IG-100 MagnaGuards': 'magnaguard',
    };
    
    return nameMap[characterName] || characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    text: '',
    unitTypes: [],
    factions: [],
    eras: [],
    tags: []
  });

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  // Refresh mission collections when switching to missions tab
  useEffect(() => {
    if (user && activeTab === 'missions') {
      loadMissionCollections();
    }
  }, [activeTab, user]);

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
      console.log('🔍 Character collections loaded:', characterData.collections);
      setCharacterCollections(characterData.collections || []);

      // Load set collections
      const setResponse = await fetch(api('/api/shatterpoint/sets'), {
        credentials: 'include',
      });
      if (!setResponse.ok) throw new Error('Failed to load set collections');
      const setData = await setResponse.json();
      console.log('🔍 Set collections loaded:', setData.collections);
      setSetCollections(setData.collections || []);

      // Load mission collections
      const missionResponse = await fetch(api('/api/shatterpoint/missions'), {
        credentials: 'include',
      });
      if (!missionResponse.ok) throw new Error('Failed to load mission collections');
      const missionData = await missionResponse.json();
      console.log('🔍 Mission collections loaded:', missionData.missionCollections || missionData.collections);
      setMissionCollections(missionData.missionCollections || missionData.collections || []);

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

  const loadMissionCollections = async () => {
    try {
      console.log('🔄 Refreshing mission collections...');
      console.log('🔍 User status:', user ? 'logged in' : 'not logged in');
      console.log('🔍 Auth status:', auth.status);
      const missionResponse = await fetch(api('/api/shatterpoint/missions'), {
        credentials: 'include',
        cache: 'no-cache' // Force refresh
      });
      console.log('📡 Mission response status:', missionResponse.status);
      if (!missionResponse.ok) {
        const errorText = await missionResponse.text();
        console.error('❌ Mission response error:', errorText);
        throw new Error('Failed to load mission collections');
      }
      const missionData = await missionResponse.json();
      console.log('🔍 Mission collections refreshed:', missionData.missionCollections || missionData.collections);
      setMissionCollections(missionData.missionCollections || missionData.collections || []);
    } catch (err) {
      console.error('Error refreshing mission collections:', err);
    }
  };

  const handleRemoveMission = async (missionId: string) => {
    if (!user) return;

    try {
      const response = await fetch(api(`/api/shatterpoint/missions/${missionId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from local state
        setMissionCollections(prev =>
          prev.filter(c => c && c.missionId && c.missionId !== missionId)
        );
        console.log('Mission removed from collection');
      }
    } catch (error) {
      console.error('Error removing mission:', error);
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
      const existingCollection = setCollections.find(c => c.setId === setId);
      let response;

      if (existingCollection) {
        // Update existing collection
        response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus
          }),
        });
      } else {
        // Create new collection entry
        response = await fetch(api('/api/shatterpoint/sets'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            setId: setId,
            status: newStatus
          }),
        });
      }

      if (response.ok) {
        if (existingCollection) {
          // Update existing collection with boolean fields
          setSetCollections(prev => 
            prev.map(c => c.setId === setId ? { 
              ...c, 
              isOwned: newStatus === 'OWNED' || newStatus === 'PAINTED',
              isPainted: newStatus === 'PAINTED',
              isWishlist: newStatus === 'WISHLIST',
              isSold: newStatus === 'SOLD',
              isFavorite: newStatus === 'FAVORITE'
            } : c)
          );
        } else {
          // Add new collection entry with boolean fields
          setSetCollections(prev => [...prev, { 
            setId, 
            isOwned: newStatus === 'OWNED' || newStatus === 'PAINTED',
            isPainted: newStatus === 'PAINTED',
            isWishlist: newStatus === 'WISHLIST',
            isSold: newStatus === 'SOLD',
            isFavorite: newStatus === 'FAVORITE',
            id: Date.now().toString() 
          }]);
        }
        
        // If set is marked as PAINTED, also mark all characters from this set as PAINTED
        // If set is marked as OWNED (from PAINTED), also mark all characters from this set as OWNED
        const currentSet = mockSets.find(s => s.id === setId);
        const currentSetCollection = setCollections.find(sc => sc.setId === setId);
        
        if (newStatus === 'PAINTED' || (newStatus === 'OWNED' && currentSetCollection?.isPainted)) {
          if (currentSet && currentSet.characters) {
            for (const character of currentSet.characters) {
              const characterId = getCharacterId(character.name);
              const existingCollection = characterCollections.find(c => c.characterId === characterId);
              
              if (existingCollection) {
                try {
                  await fetch(api(`/api/shatterpoint/characters/${existingCollection.id}`), {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ status: newStatus }),
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
      
      // Update local state with boolean fields
      setCharacterCollections(prev => 
        prev.map(c => 
          c.id === collectionId 
            ? { 
                ...c, 
                isOwned: newStatus === 'OWNED' || newStatus === 'PAINTED',
                isPainted: newStatus === 'PAINTED',
                isWishlist: newStatus === 'WISHLIST',
                isSold: newStatus === 'SOLD',
                isFavorite: newStatus === 'FAVORITE'
              }
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
    
    // Filter by text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchText) ||
        c.faction.toLowerCase().includes(searchText)
      );
    }
    
    // Filter by unit types (roles)
    if (filters.unitTypes.length > 0) {
      filtered = filtered.filter(c => 
        c.role && filters.unitTypes.includes(c.role)
      );
    }
    
    // Filter by factions
    if (filters.factions.length > 0) {
      filtered = filtered.filter(c => 
        filters.factions.includes(c.faction)
      );
    }
    
    // Filter by eras
    if (filters.eras.length > 0) {
      filtered = filtered.filter(c => {
        const charEras = Array.isArray(c.era) ? c.era : [c.era].filter(Boolean);
        return filters.eras.some(era => charEras.includes(era));
      });
    }
    
    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags && filters.tags.some(tag => c.tags.includes(tag))
      );
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
    })).filter(set => set.collection && (
      set.collection.isOwned || 
      set.collection.isPainted || 
      set.collection.isWishlist || 
      set.collection.isSold || 
      set.collection.isFavorite
    ));
  };

  const getCollectedMissions = () => {
    return missionCollections.map(collection => {
      const mission = missionsData.find(m => m.id === collection.missionId);
      return mission ? { ...mission, collection } : null;
    }).filter(Boolean) as (Mission & { collection: MissionCollection })[];
  };

  const getFilteredSets = () => {
    let filtered = getCollectedSets();
    
    // Filter by text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchText) ||
        s.type.toLowerCase().includes(searchText)
      );
    }
    
    // Filter by unit types (set types)
    if (filters.unitTypes.length > 0) {
      filtered = filtered.filter(s => 
        filters.unitTypes.includes(s.type)
      );
    }
    
    return filtered;
  };

  // Generate facets for filters
  const getCharacterFacets = (): Facets => {
    const characters = getCollectedCharacters();
    const unitTypes = [...new Set(characters.map(c => c.role).filter(Boolean))];
    const factions = [...new Set(characters.map(c => c.faction).filter(Boolean))];
    const eras = [...new Set(characters.flatMap(c => Array.isArray(c.era) ? c.era : [c.era]).filter(Boolean))];
    const tags = [...new Set(characters.flatMap(c => c.tags || []))];

    return {
      unitTypes: unitTypes.sort(),
      factions: factions.sort(),
      eras: eras.sort(),
      tags: tags.sort(),
      squadPointsMin: 0,
      squadPointsMax: 10,
      hasSetCode: ["With set", "No set"]
    };
  };

  const getSetFacets = (): Facets => {
    const sets = getCollectedSets();
    const unitTypes = [...new Set(sets.map(s => s.type).filter(Boolean))];

    return {
      unitTypes: unitTypes.sort(),
      factions: [],
      eras: [],
      tags: [],
      squadPointsMin: 0,
      squadPointsMax: 10,
      hasSetCode: ["With set", "No set"]
    };
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
          { id: 'missions', label: 'Missions', count: getCollectedMissions().length }
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
          <FiltersPanel
            facets={getCharacterFacets()}
            filters={filters}
            onChange={setFilters}
            darkMode={true}
            unitTypeLabel="Roles"
          />

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
                        backgroundColor: character.collection.isOwned ? '#16a34a' :
                                        character.collection.isPainted ? '#2563eb' :
                                        character.collection.isWishlist ? '#ea580c' :
                                        character.collection.isFavorite ? '#f59e0b' :
                                        character.collection.isSold ? '#dc2626' :
                                        '#6b7280',
                        color: "white"
                      }}>
                        {character.collection.isOwned ? 'OWNED' :
                         character.collection.isPainted ? 'PAINTED' :
                         character.collection.isWishlist ? 'WISHLIST' :
                         character.collection.isFavorite ? 'FAVORITE' :
                         character.collection.isSold ? 'SOLD' : 'UNKNOWN'}
                      </span>
                    </div>
                    
                    {/* Mark as Painted Button */}
                    {character.collection.isOwned && !character.collection.isPainted && (
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
                      {character.collection.isPainted && (
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
                      {!character.collection.isFavorite && (
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
          <FiltersPanel
            facets={getSetFacets()}
            filters={filters}
            onChange={setFilters}
            darkMode={true}
            unitTypeLabel="Set Types"
            hideFactions={true}
            hideTags={true}
          />

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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent modal from opening
                            // Toggle logic for PAINTED status
                            if (status === 'PAINTED' && set.collection?.isPainted) {
                              handleUpdateStatus(set.id, 'OWNED');
                            } else {
                              handleUpdateStatus(set.id, status as any);
                            }
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: (() => {
                              switch (status) {
                                case 'OWNED': return set.collection?.isOwned ? '#16a34a' : '#374151';
                                case 'PAINTED': return set.collection?.isPainted ? '#2563eb' : '#374151';
                                case 'WISHLIST': return set.collection?.isWishlist ? '#ea580c' : '#374151';
                                case 'SOLD': return set.collection?.isSold ? '#dc2626' : '#374151';
                                default: return '#374151';
                              }
                            })(),
                            color: 'white',
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            const isActive = (() => {
                              switch (status) {
                                case 'OWNED': return set.collection?.isOwned;
                                case 'PAINTED': return set.collection?.isPainted;
                                case 'WISHLIST': return set.collection?.isWishlist;
                                case 'SOLD': return set.collection?.isSold;
                                default: return false;
                              }
                            })();
                            if (!isActive) {
                              e.currentTarget.style.background = '#4b5563';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const isActive = (() => {
                              switch (status) {
                                case 'OWNED': return set.collection?.isOwned;
                                case 'PAINTED': return set.collection?.isPainted;
                                case 'WISHLIST': return set.collection?.isWishlist;
                                case 'SOLD': return set.collection?.isSold;
                                default: return false;
                              }
                            })();
                            if (!isActive) {
                              e.currentTarget.style.background = '#374151';
                            }
                          }}
                        >
                          {status}
                        </button>
                      ))}
                      
                      {/* Remove button in same row */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal from opening
                          handleRemoveFromCollection(set.id);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#dc2626",
                          color: 'white',
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#b91c1c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap"
                  }}>
                    {(!set.collection || (!set.collection.isOwned && !set.collection.isPainted && !set.collection.isWishlist && !set.collection.isSold && !set.collection.isFavorite)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal from opening
                          handleUpdateStatus(set.id, 'OWNED');
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
                    
                    {(!set.collection || (!set.collection.isOwned && !set.collection.isPainted && !set.collection.isWishlist && !set.collection.isSold && !set.collection.isFavorite)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal from opening
                          handleUpdateStatus(set.id, 'WISHLIST');
                        }}
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
        <div>
          {getCollectedMissions().length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
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
                No missions in collection
              </h2>
              <p style={{
                color: '#9ca3af',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                Visit the Missions page to add missions to your collection.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {getCollectedMissions().map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => setSelectedMission(mission)}
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    border: '2px solid #444',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    {mission.thumbnail && (
                      <img
                        src={mission.thumbnail}
                        alt={mission.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          marginRight: '15px',
                          objectFit: 'cover',
                          border: '2px solid #444'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h3 style={{
                        color: '#ffd700',
                        margin: '0 0 5px 0',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        {mission.name}
                      </h3>
                      <p style={{
                        color: '#ccc',
                        margin: '0',
                        fontSize: '14px',
                        textTransform: 'capitalize'
                      }}>
                        {mission.source}
                      </p>
                    </div>
                  </div>
                  
                  {mission.description && (
                    <p style={{
                      color: '#aaa',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      margin: '0 0 15px 0'
                    }}>
                      {mission.description}
                    </p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '15px'
                  }}>
                    <span>Struggles: {mission.struggles.length}</span>
                    <span>Objectives: {mission.objectives.length}</span>
                  </div>

                  {/* Status Badges */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    {mission.collection.isOwned && (
                      <span style={{
                        background: '#10b981',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        OWNED
                      </span>
                    )}
                    {mission.collection.isCompleted && (
                      <span style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        COMPLETED
                      </span>
                    )}
                    {mission.collection.isWishlist && (
                      <span style={{
                        background: '#f59e0b',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        WISHLIST
                      </span>
                    )}
                    {mission.collection.isFavorite && (
                      <span style={{
                        background: '#ef4444',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        FAVORITE
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMission(mission.id);
                      }}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        width: '100%'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      Remove from Collection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {selectedSet && showSetModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setShowSetModal(false);
            setSelectedSet(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 900,
              maxHeight: "90vh",
              background: "#1f2937",
              borderRadius: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,.2)",
              overflow: "hidden",
              border: "1px solid #374151",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Header with title and close button */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "16px 20px 8px 20px",
              borderBottom: "1px solid #374151"
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '600',
                margin: 0,
                color: '#f9fafb'
              }}>
                {selectedSet.name}
              </h2>
              <button
                onClick={() => {
                  setShowSetModal(false);
                  setSelectedSet(null);
                }}
                style={{
                  border: "1px solid #4b5563",
                  borderRadius: 999,
                  padding: "6px 10px",
                  background: "#374151",
                  color: "#f9fafb",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable content */}
            <div style={{ 
              padding: "16px 20px 20px 20px",
              overflowY: "auto",
              flex: 1
            }}>
              {/* Set info section */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                alignItems: 'flex-start'
              }}>
                <div style={{ flexShrink: 0 }}>
                  <SetImageWithFallback set={selectedSet} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#d1d5db',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    {selectedSet.type}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    lineHeight: '1.4',
                    margin: 0
                  }}>
                    {selectedSet.description}
                  </p>
                </div>
              </div>

              {/* Characters section header */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#f9fafb',
                textAlign: 'center',
                borderBottom: '1px solid #374151',
                paddingBottom: '8px'
              }}>
                Characters in this set
              </h3>

              {/* Characters grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
                padding: '4px'
              }}>
                {selectedSet.characters?.map((character, index) => {
                  const characterId = getCharacterId(character.name);
                  const characterData = allCharacters.find(c => c.id === characterId);
                  
                  // Get role color
                  const getRoleColor = (role: string) => {
                    switch (role.toLowerCase()) {
                      case 'primary': return '#ef4444'; // Red
                      case 'secondary': return '#f59e0b'; // Amber
                      case 'supporting': return '#10b981'; // Green
                      default: return '#6b7280'; // Gray
                    }
                  };
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (characterData) {
                          setSelectedCharacter(characterData);
                          setShowSetModal(false);
                          setSelectedSet(null);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                        borderRadius: '10px',
                        padding: '12px',
                        border: '2px solid #4b5563',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = getRoleColor(character.role);
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 20px ${getRoleColor(character.role)}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#4b5563';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >

                      {/* Character Portrait */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        border: '2px solid #6b7280',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative'
                      }}>
                        {characterData?.portrait ? (
                          <img
                            src={characterData.portrait}
                            alt={character.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'top'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#d1d5db',
                            fontSize: '20px',
                            fontWeight: '600'
                          }}>
                            ?
                          </div>
                        )}
                      </div>
                      
                      {/* Character Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#f9fafb',
                          marginBottom: '4px',
                          lineHeight: '1.2',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {character.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            background: getRoleColor(character.role),
                            color: 'white',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {character.role}
                          </span>
                          {characterData?.faction && characterData.faction !== 'Unknown' && (
                            <span style={{
                              background: '#374151',
                              color: '#9ca3af',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              fontSize: '10px'
                            }}>
                              {characterData.faction}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Click indicator */}
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '14px',
                        opacity: 0.6,
                        flexShrink: 0
                      }}>
                        →
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
}
