import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import { Set } from '../types';
import { setsData } from '../data/sets';
import CharacterModal from '../components/CharacterModal';

// SetImageWithFallback component for displaying set images
const SetImageWithFallback: React.FC<{ set: Set }> = ({ set }) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Generate possible image URLs for the set
  const generateUrls = (code: string): string[] => {
    const urls = [];
    const setCode = code.toUpperCase();
    
    // Real URLs scraped from AMG gallery
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
        width: '60px',
        height: '60px',
        borderRadius: '6px',
        border: '1px solid #374151',
        background: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '20px'
      }}>
        {getSetIcon(set)}
      </div>
    );
  }

  return (
    <div style={{
      width: '60px',
      height: '60px',
      borderRadius: '6px',
      border: '1px solid #374151',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <img
        src={possibleUrls[currentImageIndex]}
        alt={set.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        onError={handleImageError}
      />
    </div>
  );
};

const SetsPage: React.FC = () => {
  const { auth, me } = useAuth();
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [setCollections, setSetCollections] = useState<any[]>([]);
  const [characterCollections, setCharacterCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Core Set' | 'Squad Pack' | 'Duel Pack' | 'Terrain Pack' | 'Mission Pack' | 'Accessories'>('ALL');
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);
  const [showSetModal, setShowSetModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  

  // Use shared sets data
  const mockSets: Set[] = setsData;
  useEffect(() => {
    setAllSets(mockSets);
    setLoading(false);
  }, []);

  // Load user's set collections
  useEffect(() => {
    const loadSetCollections = async () => {
      // Only proceed if user is authenticated
      if (auth.status !== 'authenticated' || !me) {
        setSetCollections([]);
        return;
      }
      
      try {
        const response = await fetch(api('/api/shatterpoint/sets'), {
          credentials: 'include'
        });
        
        if (response.ok) {
          const responseData = await response.json();
          
          // Extract collections array from response
          const collections = responseData.collections || responseData;
          setSetCollections(collections);
        } else {
          // If unauthorized, set empty collections so buttons show
          if (response.status === 401) {
            setSetCollections([]);
          }
        }
      } catch (error) {
        console.error('Error loading set collections:', error);
        // On error, set empty collections so buttons show
        setSetCollections([]);
      }
    };

    loadSetCollections();
  }, [auth.status, me]);

  // Load user's character collections
  useEffect(() => {
    const loadCharacterCollections = async () => {
      if (auth.status !== 'authenticated' || !me) {
        setCharacterCollections([]);
        return;
      }
      
      try {
        const response = await fetch(api('/api/shatterpoint/characters'), {
          credentials: 'include'
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const collections = responseData.collections || responseData || [];
          setCharacterCollections(collections);
        } else if (response.status === 401) {
          setCharacterCollections([]);
        } else {
          console.error('Error loading character collections:', response.status);
          setCharacterCollections([]);
        }
      } catch (error) {
        console.error('Error loading character collections:', error);
        setCharacterCollections([]);
      }
    };

    loadCharacterCollections();
  }, [auth.status, me]);

  // Auto-add sets to collection when character collections change
  useEffect(() => {
    if (characterCollections.length > 0 && allSets.length > 0) {
      allSets.forEach(set => {
        autoAddSetIfComplete(set);
      });
    }
  }, [characterCollections, allSets, me]);

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
      'Luminara Unduli': 'jedi-master-luminara-unduli',
      'Jedi Master Luminara Unduli': 'jedi-master-luminara-unduli',
      'Barriss Offee': 'barriss-offee-jedi-padawan',
      'Barriss Offee, Jedi Padawan': 'barriss-offee-jedi-padawan',
      'Republic Clone Commandos': 'republic-clone-commandos',
      'General Grievous': 'general-grievous',
      'Kraken (Super Tactical Droid)': 'kraken-super-tactical-droid',
      'B2 Battle Droids': 'b2-battle-droids',
      'General Obi-Wan Kenobi': 'general-obi-wan-kenobi',
      'Clone Commander Cody': 'cc-2224-clone-commander-cody',
      '212th Clone Troopers': '212th-clone-troopers',
      'Mother Talzin': 'mother-talzin',
      'Savage Opress': 'savage-opress',
      'Nightsister Acolytes': 'nightsister-acolytes',
      'Mace Windu': 'jedi-master-mace-windu',
      'Jedi Master Mace Windu': 'jedi-master-mace-windu',
      'CT-411 "Ponds"': 'ct-411-commander-ponds',
      'CT-411 Commander Ponds': 'ct-411-commander-ponds',
      'ARF Clone Troopers': 'arf-clone-troopers',
      'Hondo Ohnaka': 'hondo-honest-businessman',
      'Hondo, Honest Businessman': 'hondo-honest-businessman',
      'Gwarm': 'gwarm',
      'Weequay Pirates': 'weequay-pirates',
      'Plo Koon': 'jedi-master-plo-koon',
      'Jedi Master Plo Koon': 'jedi-master-plo-koon',
      'Clone Commander Wolffe': 'cc-3636-commander-wolffe',
      '104th Battalion "Wolfpack" Clone Troopers': '104th-wolfpack-troopers',
      '104th Wolfpack Troopers': '104th-wolfpack-troopers',
    };
    
    return nameMap[characterName] || characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  // Check if user has all characters from a set
  const hasAllCharactersFromSet = (set: Set): boolean => {
    if (!set.characters || set.characters.length === 0) return false;
    if (!characterCollections || characterCollections.length === 0) return false;
    
    console.log(`\n🔍 Checking set "${set.name}" for auto-add...`);
    console.log(`Set characters:`, set.characters.map(c => c.name));
    console.log(`User has ${characterCollections.length} characters in collection`);
    
    const hasAll = set.characters.every(character => {
      const characterId = getCharacterId(character.name);
      const hasCharacter = characterCollections.some(collection => 
        collection.characterId === characterId && 
        (collection.status === 'OWNED' || collection.status === 'PAINTED')
      );
      
      console.log(`  - "${character.name}" → ID: "${characterId}" → ${hasCharacter ? '✅ FOUND' : '❌ NOT FOUND'}`);
      return hasCharacter;
    });
    
    console.log(`🎯 Set "${set.name}" has all characters: ${hasAll ? '✅ YES' : '❌ NO'}`);
    return hasAll;
  };

  const getCollectedSets = useMemo(() => {
    if (!allSets || !Array.isArray(allSets)) {
      return [];
    }
    
    const result = allSets.map(set => {
      if (!set || typeof set !== 'object') {
        return null;
      }
      
      const collection = (setCollections && Array.isArray(setCollections)) 
        ? setCollections.find(c => c.setId === set.id) || null
        : null;
      
      return {
        ...set,
        collection
      };
    }).filter(Boolean); // Remove null entries
    
    return result;
  }, [allSets, setCollections]);

  const getFilteredSets = useMemo(() => {
    let filtered = getCollectedSets;
    
    // Only show Duel Packs, Core Sets, and Squad Packs
    filtered = filtered.filter(s => 
      s.type === 'Duel Pack' || 
      s.type === 'Core Set' || 
      s.type === 'Squad Pack'
    );
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.collection?.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(s => s.type === typeFilter);
    }
    
    return filtered;
  }, [getCollectedSets, statusFilter, typeFilter]);

  const handleAddToCollection = async (setId: string, status: 'OWNED' | 'WISHLIST') => {
    if (!me) {
      alert('Please log in to add sets to your collection');
      return;
    }

    try {
      // Add set to collection
      const response = await fetch(api('/api/shatterpoint/sets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          setId,
          status
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newCollection = responseData.collection;
        
        setSetCollections(prev => {
          if (!Array.isArray(prev)) {
            return [newCollection];
          }
          
          return [...prev, newCollection];
        });
        
        // Show success message
        const set = allSets.find(s => s.id === setId);
        if (status === 'OWNED') {
          alert(`✅ Added "${set?.name}" to your collection as OWNED!`);
        } else {
          alert(`⭐ Added "${set?.name}" to your wishlist!`);
        }
        
        // If adding as OWNED, also add all characters from the set to collection
        if (status === 'OWNED') {
          if (set && set.characters) {
            for (const character of set.characters) {
              try {
                const characterId = getCharacterId(character.name);
                await fetch(api('/api/shatterpoint/characters'), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    characterId: characterId,
                    status: 'OWNED'
                  }),
                });
                console.log(`Added character: ${character.name} (ID: ${characterId})`);
              } catch (error) {
                console.error(`Error adding character ${character.name} to collection:`, error);
              }
            }
          }
        }
      } else {
        console.error('Failed to add set to collection');
        alert('❌ Failed to add set to collection. Please try again.');
      }
    } catch (error) {
      console.error('Error adding set to collection:', error);
      alert('❌ Error adding set to collection: ' + error.message);
    }
  };

  // Auto-add set to collection if user has all characters
  const autoAddSetIfComplete = async (set: Set) => {
    console.log(`Checking auto-add for set "${set.name}":`, {
      hasUser: !!me,
      alreadyCollected: !!set.collection,
      hasAllCharacters: hasAllCharactersFromSet(set)
    });
    
    if (!me || set.collection || !hasAllCharactersFromSet(set)) {
      console.log(`Skipping auto-add for set "${set.name}"`);
      return;
    }

    console.log(`🚀 Auto-adding set "${set.name}" to collection!`);

    try {
      const response = await fetch(api('/api/shatterpoint/sets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          setId: set.id,
          status: 'OWNED'
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const newCollection = responseData.collection;
        
        // Update local state
        setSetCollections(prev => {
          if (!Array.isArray(prev)) return [newCollection];
          return [...prev.filter(c => c.setId !== set.id), newCollection];
        });

        console.log(`🎉 Auto-added set "${set.name}" to collection - user has all characters!`);
      } else {
        console.error(`Failed to auto-add set "${set.name}":`, response.status);
      }
    } catch (error) {
      console.error(`Error auto-adding set ${set.name}:`, error);
    }
  };

  const handleUpdateStatus = async (setId: string, newStatus: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD') => {
    if (!me) {
      alert('Please log in to update set status');
      return;
    }

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
        setSetCollections(prev => {
          if (!Array.isArray(prev)) {
            return [];
          }
          
          return prev.map(c => c.setId === setId ? { ...c, status: newStatus } : c);
        });
      } else {
        console.error('Failed to update set status');
      }
    } catch (error) {
      console.error('Error updating set status:', error);
    }
  };

  const handleRemoveFromCollection = async (setId: string) => {
    if (!me) {
      alert('Please log in to remove sets from collection');
      return;
    }

    try {
      // Remove set from collection
      const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSetCollections(prev => {
          if (!Array.isArray(prev)) {
            return [];
          }
          
          return prev.filter(c => c.setId !== setId);
        });
        
        // Show success message
        const set = allSets.find(s => s.id === setId);
        alert(`🗑️ Removed "${set?.name}" from your collection!`);
        
        // Also remove all characters from the set from collection
        if (set && set.characters) {
          for (const character of set.characters) {
            try {
              const characterId = getCharacterId(character.name);
              await fetch(api(`/api/shatterpoint/characters/${characterId}`), {
                method: 'DELETE',
                credentials: 'include'
              });
              console.log(`Removed character: ${character.name} (ID: ${characterId})`);
            } catch (error) {
              console.error(`Error removing character ${character.name} from collection:`, error);
            }
          }
        }
      } else {
        console.error('Failed to remove set from collection');
        alert('❌ Failed to remove set from collection. Please try again.');
      }
    } catch (error) {
      console.error('Error removing set from collection:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OWNED': return '#16a34a';
      case 'PAINTED': return '#3b82f6';
      case 'WISHLIST': return '#f59e0b';
      case 'SOLD': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Core Set': return '#dc2626';
      case 'Squad Pack': return '#3b82f6';
      case 'Terrain Pack': return '#16a34a';
      case 'Duel Pack': return '#8b5cf6';
      case 'Mission Pack': return '#f59e0b';
      case 'Accessories': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Modal handlers
  const handleSetClick = (set: Set) => {
    setSelectedSet(set);
    setShowSetModal(true);
  };

  const handleCloseSetModal = () => {
    setShowSetModal(false);
    setSelectedSet(null);
  };

  const handleCharacterClick = async (characterName: string) => {
    try {
      // Load character data from API
      const response = await fetch(api('/api/characters'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const responseData = await response.json();
        // Handle different response formats
        const charactersData = responseData.items || responseData || [];
        
        if (Array.isArray(charactersData)) {
          const character = charactersData.find((char: any) => 
            char.name.toLowerCase() === characterName.toLowerCase() ||
            char.id === getCharacterId(characterName)
          );
          
          if (character) {
            setSelectedCharacter(character);
            setShowCharacterModal(true);
          } else {
            console.log(`Character not found: ${characterName}`);
          }
        } else {
          console.error('Characters data is not an array:', charactersData);
        }
      }
    } catch (error) {
      console.error('Error loading character:', error);
    }
  };

  const handleCloseCharacterModal = () => {
    setShowCharacterModal(false);
    setSelectedCharacter(null);
  };

  // CharacterPortrait Component with fallback
  const CharacterPortrait: React.FC<{ character: any }> = ({ character }) => {
    const [imageError, setImageError] = useState(false);
    const characterId = getCharacterId(character.name);
    
    // Use character.portrait if available, otherwise construct URL
    const imageSrc = character.portrait || `/characters/${characterId}/portrait.png`;

    return (
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        border: '1px solid #6b7280',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!imageError ? (
          <img
            src={imageSrc}
            alt={character.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {character.name.split(' ').map((word: string) => word[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
    );
  };

  // SetModal Component
  const SetModal: React.FC<{ set: Set; onClose: () => void }> = ({ set, onClose }) => {
    const getCollection = () => {
      return (setCollections && Array.isArray(setCollections)) 
        ? setCollections.find(c => c.setId === set.id) || null
        : null;
    };

    const collection = getCollection();

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #374151',
          position: 'relative'
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>

          <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                border: '1px solid #374151',
                background: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {set.code}
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f9fafb'
                }}>
                  {set.name}
                </h2>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getTypeColor(set.type),
                    color: 'white'
                  }}>
                    {set.type}
                  </span>
                  {collection && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(collection.status),
                      color: 'white'
                    }}>
                      {collection.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {set.description && (
              <p style={{
                margin: '0 0 20px 0',
                color: '#d1d5db',
                lineHeight: '1.5'
              }}>
                {set.description}
              </p>
            )}

            {/* Characters */}
            {set.characters && set.characters.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#f9fafb'
                }}>
                  Characters ({set.characters.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  {set.characters.map((character, index) => (
                    <div
                      key={index}
                      onClick={() => handleCharacterClick(character.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#374151',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }}
                    >
                      <CharacterPortrait character={character} />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#f9fafb',
                          marginBottom: '2px'
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product URL */}
            {set.product_url && (
              <div style={{ marginBottom: '20px' }}>
                <a
                  href={set.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  View on Atomic Mass Games →
                </a>
              </div>
            )}

            {/* Action Buttons */}
            {me && (
              <div 
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {!set.collection ? (
                  <>
                    <button
                      onClick={() => handleAddToCollection(set.id, 'OWNED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#16a34a',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#16a34a';
                      }}
                    >
                      Add to Collection
                    </button>
                    <button
                      onClick={() => handleAddToCollection(set.id, 'WISHLIST')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#f59e0b',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d97706';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f59e0b';
                      }}
                    >
                      Add to Wishlist
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'OWNED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: collection?.status === 'OWNED' ? '#16a34a' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Owned
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'PAINTED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: collection?.status === 'PAINTED' ? '#3b82f6' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Painted
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'WISHLIST')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: collection?.status === 'WISHLIST' ? '#f59e0b' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => handleRemoveFromCollection(set.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#9ca3af'
      }}>
        Loading sets...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{
        margin: '0 0 20px 0',
        fontSize: '28px',
        fontWeight: '700',
        color: '#f9fafb'
      }}>
        Sets & Boxes Collection
      </h1>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px'
          }}
        >
          <option value="ALL">All Status</option>
          <option value="OWNED">Owned</option>
          <option value="PAINTED">Painted</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="SOLD">Sold</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px'
          }}
        >
          <option value="ALL">All Types</option>
          <option value="Core Set">Core Set</option>
          <option value="Squad Pack">Squad Pack</option>
          <option value="Duel Pack">Duel Pack</option>
          <option value="Terrain Pack">Terrain Pack</option>
          <option value="Mission Pack">Mission Pack</option>
          <option value="Accessories">Accessories</option>
        </select>
      </div>

      {/* Sets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {getFilteredSets.map((set) => (
          <div
            key={set.id}
            onClick={() => handleSetClick(set)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #374151',
              backgroundColor: '#1f2937',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6b7280';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Status Badge */}
            {set.collection && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: getStatusColor(set.collection.status),
                color: 'white'
              }}>
                {set.collection.status}
              </div>
            )}

            {/* Set Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <SetImageWithFallback set={set} />
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f9fafb',
                  marginBottom: '4px'
                }}>
                  {set.name}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: getTypeColor(set.type),
                    color: 'white'
                  }}>
                    {set.type}
                  </span>
                  {set.characters && (
                    <span style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      {set.characters.length} characters
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {set.description && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#d1d5db',
                lineHeight: '1.4'
              }}>
                {set.description}
              </p>
            )}

            {/* Action Buttons */}
            {me && (
              <div 
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {!set.collection ? (
                  <>
                    <button
                      onClick={() => handleAddToCollection(set.id, 'OWNED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#16a34a',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#16a34a';
                      }}
                    >
                      Add to Collection
                    </button>
                    <button
                      onClick={() => handleAddToCollection(set.id, 'WISHLIST')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#f59e0b',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d97706';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f59e0b';
                      }}
                    >
                      Add to Wishlist
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'OWNED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: set.collection?.status === 'OWNED' ? '#16a34a' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Owned
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'PAINTED')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: set.collection?.status === 'PAINTED' ? '#3b82f6' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Painted
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(set.id, 'WISHLIST')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: set.collection?.status === 'WISHLIST' ? '#f59e0b' : '#374151',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => handleRemoveFromCollection(set.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showSetModal && selectedSet && (
        <SetModal set={selectedSet} onClose={handleCloseSetModal} />
      )}

      {showCharacterModal && selectedCharacter && (
        <CharacterModal
          open={showCharacterModal}
          onClose={handleCloseCharacterModal}
          character={selectedCharacter}
        />
      )}
    </div>
  );
};

export default SetsPage;