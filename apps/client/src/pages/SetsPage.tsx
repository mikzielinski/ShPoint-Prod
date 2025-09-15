import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import CharacterModal from '../components/CharacterModal';
import { setsData } from '../data/sets';

// Component to handle image loading with multiple fallback URLs
const SetImageWithFallback: React.FC<{ set: Set }> = ({ set }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  const getSetIcon = (set: Set) => {
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

            // Generate URLs - use actual URLs scraped from AMG gallery
            const generateUrls = () => {
              const urls = [];
              const code = set.code.toUpperCase();
              
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
              if (knownUrls[code] && Array.isArray(knownUrls[code])) {
                urls.push(...knownUrls[code]);
              }
              
              // Local fallback
              urls.push(`/images/sets/${set.code.toLowerCase()}.jpg`);
              
              return urls;
            };

  const possibleUrls = generateUrls();

  const handleImageError = () => {
    if (currentImageIndex < possibleUrls.length - 1) {
      // Try next URL
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      // All URLs failed, show icon fallback
      setShowFallback(true);
    }
  };

  if (showFallback) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#f9fafb',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '8px'
        }}>
          {getSetIcon(set)}
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#d1d5db',
          maxWidth: '200px',
          lineHeight: '1.2'
        }}>
          {set.name}
        </div>
      </div>
    );
  }

  return (
    <img
      src={possibleUrls[currentImageIndex]}
      alt={set.name}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block'
      }}
      onError={handleImageError}
    />
  );
};

interface Set {
  id: string;
  name: string;
  code: string; // SWPXX
  type: 'Core Set' | 'Squad Pack' | 'Terrain Pack' | 'Duel Pack' | 'Mission Pack' | 'Accessories';
  image?: string;
  characters?: Array<{
    role: 'Primary' | 'Secondary' | 'Supporting';
    name: string;
  }>;
  description?: string;
  product_url?: string;
}

interface SetCollection {
  id: string;
  setId: string;
  status: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const SetsPage: React.FC = () => {
  const { auth } = useAuth();
  
  // Get user from auth state
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [setCollections, setSetCollections] = useState<SetCollection[]>([]);
  const [characterCollections, setCharacterCollections] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Core Set' | 'Squad Pack' | 'Terrain Pack' | 'Duel Pack' | 'Mission Pack' | 'Accessories'>('ALL');
  
  // Modal state
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
      name: 'Twice the Pride Squad Pack',
      code: 'SWP03',
      type: 'Squad Pack',
      description: 'Count Dooku and his allies',
      product_url: 'https://www.atomicmassgames.com/character/twice-the-pride-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Count Dooku, Separatist Leader' },
        { role: 'Secondary', name: 'Jango Fett, Bounty Hunter' },
        { role: 'Supporting', name: 'IG-100 MagnaGuards' }
      ]
    },
    {
      id: 'swp04',
      name: 'Plans and Preparations Squad Pack',
      code: 'SWP04',
      type: 'Squad Pack',
      description: 'Luminara Unduli and her allies',
      product_url: 'https://www.atomicmassgames.com/character/plans-and-preparations-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jedi Master Luminara Unduli' },
        { role: 'Secondary', name: 'Barriss Offee, Jedi Padawan' },
        { role: 'Supporting', name: 'Republic Clone Commandos' }
      ]
    },
    {
      id: 'swp05',
      name: 'Appetite for Destruction Squad Pack',
      code: 'SWP05',
      type: 'Squad Pack',
      description: 'General Grievous and his allies',
      product_url: 'https://www.atomicmassgames.com/character/appetite-for-destruction-squad-pack/',
      characters: [
        { role: 'Primary', name: 'General Grievous' },
        { role: 'Secondary', name: 'Kraken (Super Tactical Droid)' },
        { role: 'Supporting', name: 'B2 Battle Droids' }
      ]
    },
    {
      id: 'swp06',
      name: 'Hello There Squad Pack',
      code: 'SWP06',
      type: 'Squad Pack',
      description: 'General Obi-Wan Kenobi and his allies',
      product_url: 'https://www.atomicmassgames.com/character/hello-there-squad-pack/',
      characters: [
        { role: 'Primary', name: 'General Obi-Wan Kenobi' },
        { role: 'Secondary', name: 'Clone Commander Cody' },
        { role: 'Supporting', name: '212th Clone Troopers' }
      ]
    },
    {
      id: 'swp07',
      name: 'Witches of Dathomir Squad Pack',
      code: 'SWP07',
      type: 'Squad Pack',
      description: 'Mother Talzin and the Nightsisters',
      product_url: 'https://www.atomicmassgames.com/character/witches-of-dathomir-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Mother Talzin' },
        { role: 'Secondary', name: 'Savage Opress' },
        { role: 'Supporting', name: 'Nightsister Acolytes' }
      ]
    },
    {
      id: 'swp08',
      name: 'This Party\'s Over Squad Pack',
      code: 'SWP08',
      type: 'Squad Pack',
      description: 'Mace Windu and his allies',
      product_url: 'https://www.atomicmassgames.com/character/this-partys-over-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jedi Master Mace Windu' },
        { role: 'Secondary', name: 'CT-411 Commander Ponds' },
        { role: 'Supporting', name: 'ARF Clone Troopers' }
      ]
    },
    {
      id: 'swp09',
      name: 'Fistful of Credits Squad Pack',
      code: 'SWP09',
      type: 'Squad Pack',
      description: 'Cad Bane and the bounty hunters',
      product_url: 'https://www.atomicmassgames.com/character/fistful-of-credits-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Cad Bane, Notorious Hunter' },
        { role: 'Secondary', name: 'Aurra Sing' },
        { role: 'Supporting', name: 'Bounty Hunters (Chadra-Fan, Todo 360, Devaronian)' }
      ]
    },
    {
      id: 'swp10',
      name: 'That\'s Good Business Squad Pack',
      code: 'SWP10',
      type: 'Squad Pack',
      description: 'Hondo Ohnaka and his pirates',
      product_url: 'https://www.atomicmassgames.com/character/thats-good-business-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Hondo, Honest Businessman' },
        { role: 'Secondary', name: 'Gwarm' },
        { role: 'Supporting', name: 'Weequay Pirates' }
      ]
    },
    {
      id: 'swp11',
      name: 'Lead By Example Squad Pack',
      code: 'SWP11',
      type: 'Squad Pack',
      description: 'Plo Koon and the Wolfpack',
      product_url: 'https://www.atomicmassgames.com/character/lead-by-example-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jedi Master Plo Koon' },
        { role: 'Secondary', name: 'Clone Commander Wolffe' },
        { role: 'Supporting', name: '104th Wolfpack Troopers' }
      ]
    },
    {
      id: 'swp16',
      name: 'This Is the Way Squad Pack',
      code: 'SWP16',
      type: 'Squad Pack',
      description: 'The Armorer and her Mandalorians',
      product_url: 'https://www.atomicmassgames.com/character/this-is-the-way-squad-pack/',
      characters: [
        { role: 'Primary', name: 'The Armorer' },
        { role: 'Secondary', name: 'Paz Vizsla' },
        { role: 'Supporting', name: 'Covert Mandalorians' }
      ]
    },
    {
      id: 'swp21',
      name: 'Fear and Dead Men Squad Pack',
      code: 'SWP21',
      type: 'Squad Pack',
      description: 'Darth Vader and the Empire',
      product_url: 'https://www.atomicmassgames.com/character/fear-and-dead-men-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Darth Vader' },
        { role: 'Secondary', name: 'Commander (Imperial Officer)' },
        { role: 'Supporting', name: 'Stormtroopers' }
      ]
    },
    {
      id: 'swp22',
      name: 'Fearless and Inventive Squad Pack',
      code: 'SWP22',
      type: 'Squad Pack',
      description: 'Luke Skywalker and the Rebellion',
      product_url: 'https://www.atomicmassgames.com/character/fearless-and-inventive-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Luke Skywalker (Jedi Knight)' },
        { role: 'Secondary', name: 'Leia Organa (Boushh Disguise)' },
        { role: 'Supporting', name: 'Lando Calrissian & R2-D2' }
      ]
    },
    {
      id: 'swp24',
      name: 'Certified Guild Squad Pack',
      code: 'SWP24',
      type: 'Squad Pack',
      description: 'Din Djarin and his allies',
      product_url: 'https://www.atomicmassgames.com/character/certified-guild-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Din Djarin (The Mandalorian)' },
        { role: 'Secondary', name: 'IG-11' },
        { role: 'Supporting', name: 'Greef Karga' }
      ]
    },
    {
      id: 'swp25',
      name: 'We Don\'t Need Their Scum Squad Pack',
      code: 'SWP25',
      type: 'Squad Pack',
      description: 'Bossk and the bounty hunters',
      product_url: 'https://www.atomicmassgames.com/character/we-dont-need-their-scum-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Bossk' },
        { role: 'Secondary', name: 'Zuckuss & 4-LOM' },
        { role: 'Supporting', name: 'Bounty Hunters' }
      ]
    },
    {
      id: 'swp36',
      name: 'Good Soldiers Follow Orders Squad Pack',
      code: 'SWP36',
      type: 'Squad Pack',
      description: 'Crosshair and the Empire',
      product_url: 'https://www.atomicmassgames.com/character/good-soldiers-follow-orders-squad-pack/',
      characters: [
        { role: 'Primary', name: 'CT-9904 "Crosshair"' },
        { role: 'Secondary', name: 'ES-04' },
        { role: 'Supporting', name: 'Elite Squad Troopers' }
      ]
    },
    {
      id: 'swp38',
      name: 'Clone Force 99 Squad Pack',
      code: 'SWP38',
      type: 'Squad Pack',
      description: 'The Bad Batch',
      product_url: 'https://www.atomicmassgames.com/character/clone-force-99-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Hunter' },
        { role: 'Secondary', name: 'Wrecker & Omega' },
        { role: 'Supporting', name: 'Echo & Tech' },
        { role: 'Secondary', name: 'Crosshair (Clone Force 99)' }
      ]
    },
    {
      id: 'swp41',
      name: 'This Is Some Rescue! Squad Pack',
      code: 'SWP41',
      type: 'Squad Pack',
      description: 'Princess Leia and the rescue team',
      product_url: 'https://www.atomicmassgames.com/character/this-is-some-rescue-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Princess Leia Organa' },
        { role: 'Secondary', name: 'Luke Skywalker (Stormtrooper Disguise)' },
        { role: 'Secondary', name: 'Han Solo (Stormtrooper Disguise)' },
        { role: 'Supporting', name: 'Chewbacca' }
      ]
    },
    {
      id: 'swp44',
      name: 'Make The Impossible Possible Squad Pack',
      code: 'SWP44',
      type: 'Squad Pack',
      description: 'Hera Syndulla and the Ghost crew',
      product_url: 'https://www.atomicmassgames.com/character/make-the-impossible-possible-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Hera Syndulla' },
        { role: 'Secondary', name: 'Sabine Wren' },
        { role: 'Supporting', name: 'C1-10P "Chopper"' }
      ]
    },
    {
      id: 'swp52',
      name: 'This Is Rogue One Squad Pack',
      code: 'SWP52',
      type: 'Squad Pack',
      description: 'Jyn Erso and Rogue One',
      product_url: 'https://www.atomicmassgames.com/character/this-is-rogue-one-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jyn Erso' },
        { role: 'Secondary', name: 'Chirrut Îmwe' },
        { role: 'Supporting', name: 'Baze Malbus' },
        { role: 'Supporting', name: 'Bodhi Rook' }
      ]
    },
    {
      id: 'swp48',
      name: 'Never Tell Me the Odds Mission Pack',
      code: 'SWP48',
      type: 'Mission Pack',
      description: 'Mission pack for campaign play',
      product_url: 'https://www.atomicmassgames.com/character/never-tell-me-the-odds-mission-pack/',
      characters: []
    },
    {
      id: 'swp12',
      name: 'Jedi Hunters Squad Pack',
      code: 'SWP12',
      type: 'Squad Pack',
      description: 'Jedi hunters and their allies',
      product_url: 'https://www.atomicmassgames.com/character/jedi-hunters-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jedi Hunter' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp15',
      name: 'We Are Brave Squad Pack',
      code: 'SWP15',
      type: 'Squad Pack',
      description: 'Brave heroes and their allies',
      product_url: 'https://www.atomicmassgames.com/character/we-are-brave-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Brave Hero' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp17',
      name: 'Take Cover Terrain Pack',
      code: 'SWP17',
      type: 'Terrain Pack',
      description: 'Terrain for cover and tactical gameplay',
      product_url: 'https://www.atomicmassgames.com/character/take-cover-terrain-pack/',
      characters: []
    },
    {
      id: 'swp18',
      name: 'Maintenance Bay Terrain Pack',
      code: 'SWP18',
      type: 'Terrain Pack',
      description: 'Industrial terrain for maintenance areas',
      product_url: 'https://www.atomicmassgames.com/character/maintenance-bay-terrain-pack/',
      characters: []
    },
    {
      id: 'swp19',
      name: 'Shatterpoint Dice Pack',
      code: 'SWP19',
      type: 'Accessories',
      description: 'Additional dice for gameplay',
      product_url: 'https://www.atomicmassgames.com/character/shatterpoint-dice-pack/',
      characters: []
    },
    {
      id: 'swp20',
      name: 'Shatterpoint Measuring Tools',
      code: 'SWP20',
      type: 'Accessories',
      description: 'Measuring tools for precise gameplay',
      product_url: 'https://www.atomicmassgames.com/character/shatterpoint-measuring-tools/',
      characters: []
    },
    {
      id: 'swp26',
      name: 'You Have Something I Want Squad Pack',
      code: 'SWP26',
      type: 'Squad Pack',
      description: 'Bounty hunters and their targets',
      product_url: 'https://www.atomicmassgames.com/character/you-have-something-i-want-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Bounty Hunter' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp27',
      name: 'Ee Chee Wa Maa! Squad Pack',
      code: 'SWP27',
      type: 'Squad Pack',
      description: 'Ewok warriors and their allies',
      product_url: 'https://www.atomicmassgames.com/character/ee-chee-wa-maa-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Ewok Chief' },
        { role: 'Secondary', name: 'Ewok Warriors' },
        { role: 'Supporting', name: 'Ewok Scouts' }
      ]
    },
    {
      id: 'swp28',
      name: 'Not Accepting Surrenders Squad Pack',
      code: 'SWP28',
      type: 'Squad Pack',
      description: 'Determined warriors who fight to the end',
      product_url: 'https://www.atomicmassgames.com/character/not-accepting-surrenders-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Determined Leader' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp29',
      name: 'Stronger Than Fear Squad Pack',
      code: 'SWP29',
      type: 'Squad Pack',
      description: 'Heroes who overcome their fears',
      product_url: 'https://www.atomicmassgames.com/character/stronger-than-fear-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Fearless Hero' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp30',
      name: 'You Cannot Run Duel Pack',
      code: 'SWP30',
      type: 'Duel Pack',
      description: 'Epic duel between two powerful characters',
      product_url: 'https://www.atomicmassgames.com/character/you-cannot-run-duel-pack/',
      characters: [
        { role: 'Primary', name: 'Duelist 1' },
        { role: 'Primary', name: 'Duelist 2' }
      ]
    },
    {
      id: 'swp31',
      name: 'All The Way Squad Pack',
      code: 'SWP31',
      type: 'Squad Pack',
      description: 'Characters who go all the way',
      product_url: 'https://www.atomicmassgames.com/character/all-the-way-squad-pack/',
      characters: [
        { role: 'Primary', name: 'All-in Leader' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp34',
      name: 'Today The Rebellion Dies Squad Pack',
      code: 'SWP34',
      type: 'Squad Pack',
      description: 'Imperial forces determined to crush the rebellion',
      product_url: 'https://www.atomicmassgames.com/character/today-the-rebellion-dies-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Imperial Commander' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp35',
      name: 'Real Quiet Like Squad Pack',
      code: 'SWP35',
      type: 'Squad Pack',
      description: 'Stealthy operatives and their missions',
      product_url: 'https://www.atomicmassgames.com/character/real-quiet-like-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Stealth Operative' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp37',
      name: 'Requesting Your Surrender Squad Pack',
      code: 'SWP37',
      type: 'Squad Pack',
      description: 'Diplomatic but firm approach to conflict',
      product_url: 'https://www.atomicmassgames.com/character/requesting-your-surrender-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Diplomatic Leader' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp39',
      name: 'Yub Nub Squad Pack',
      code: 'SWP39',
      type: 'Squad Pack',
      description: 'Ewok celebration and victory',
      product_url: 'https://www.atomicmassgames.com/character/yub-nub-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Ewok Chief' },
        { role: 'Secondary', name: 'Ewok Warriors' },
        { role: 'Supporting', name: 'Ewok Scouts' }
      ]
    },
    {
      id: 'swp45',
      name: 'Sabotage Showdown Mission Pack',
      code: 'SWP45',
      type: 'Mission Pack',
      description: 'Mission pack for sabotage scenarios',
      product_url: 'https://www.atomicmassgames.com/character/sabotage-showdown-mission-pack/',
      characters: []
    },
    {
      id: 'swp46',
      name: 'Maximum Firepower Squad Pack',
      code: 'SWP46',
      type: 'Squad Pack',
      description: 'Heavy weapons and maximum destruction',
      product_url: 'https://www.atomicmassgames.com/character/maximum-firepower-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Heavy Weapons Specialist' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp47',
      name: 'What Have We Here Squad Pack',
      code: 'SWP47',
      type: 'Squad Pack',
      description: 'Curious characters and their discoveries',
      product_url: 'https://www.atomicmassgames.com/character/what-have-we-here-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Curious Explorer' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp49',
      name: 'First Contact Mission Pack',
      code: 'SWP49',
      type: 'Mission Pack',
      description: 'Mission pack for first contact scenarios',
      product_url: 'https://www.atomicmassgames.com/character/first-contact-mission-pack/',
      characters: []
    },
    {
      id: 'swp50',
      name: 'Wisdom of the Council Squad Pack',
      code: 'SWP50',
      type: 'Squad Pack',
      description: 'Jedi Council members and their wisdom',
      product_url: 'https://www.atomicmassgames.com/character/wisdom-of-the-council-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Jedi Master' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp51',
      name: 'Deploy the Garrison Squad Pack',
      code: 'SWP51',
      type: 'Squad Pack',
      description: 'Military garrison deployment',
      product_url: 'https://www.atomicmassgames.com/character/deploy-the-garrison-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Garrison Commander' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp60',
      name: 'Outer Rim Outpost Terrain Pack',
      code: 'SWP60',
      type: 'Terrain Pack',
      description: 'Terrain for outer rim outposts',
      product_url: 'https://www.atomicmassgames.com/character/outer-rim-outpost-terrain-pack/',
      characters: []
    },
    {
      id: 'swp63',
      name: 'Terror from Below Squad Pack',
      code: 'SWP63',
      type: 'Squad Pack',
      description: 'Creatures and terrors from below',
      product_url: 'https://www.atomicmassgames.com/character/terror-from-below-squad-pack/',
      characters: [
        { role: 'Primary', name: 'Terror Leader' },
        { role: 'Secondary', name: 'Secondary Unit' },
        { role: 'Supporting', name: 'Supporting Unit' }
      ]
    },
    {
      id: 'swp81',
      name: 'I Am No Jedi Duel Pack',
      code: 'SWP81',
      type: 'Duel Pack',
      description: 'Ahsoka Tano vs Darth Vader',
      product_url: 'https://www.atomicmassgames.com/character/i-am-no-jedi-duel-pack/',
      characters: [
        { role: 'Primary', name: 'Ahsoka Tano (Rebels era)' },
        { role: 'Primary', name: 'Darth Vader' }
      ]
    }
  ];

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
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Set Image */}
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #6b7280',
                flexShrink: 0
              }}>
                <SetImageWithFallback set={set} />
              </div>

              {/* Set Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  background: getTypeColor(set.type),
                  display: 'inline-block',
                  marginBottom: '12px'
                }}>
                  {set.type}
                </div>

                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f9fafb',
                  marginBottom: '8px'
                }}>
                  {set.name}
                </h2>

                <div style={{
                  fontSize: '16px',
                  color: '#3b82f6',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  {set.code}
                </div>

                {set.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    {set.description}
                  </p>
                )}

                {/* Status Badge */}
                {collection && (
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    background: getStatusColor(collection.status),
                    display: 'inline-block',
                    marginBottom: '16px'
                  }}>
                    {collection.status}
                  </div>
                )}

                {/* Action Buttons */}
                {me && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {!collection ? (
                      <>
                        <button
                          onClick={() => {
                            handleAddToCollection(set.id, 'OWNED');
                            onClose();
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#16a34a',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          Add to Collection
                        </button>
                        <button
                          onClick={() => {
                            handleAddToCollection(set.id, 'WISHLIST');
                            onClose();
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#f59e0b',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          ⭐ Add to Wishlist
                        </button>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {['OWNED', 'PAINTED', 'WISHLIST', 'SOLD'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(set.id, status as any)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              background: collection?.status === status ? getStatusColor(status) : '#374151',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background 0.2s ease'
                            }}
                          >
                            {status}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            handleRemoveFromCollection(set.id);
                            onClose();
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Characters Section */}
            {set.characters && set.characters.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#f9fafb',
                  marginBottom: '16px'
                }}>
                  Characters in this Set ({set.characters.length})
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {set.characters.map((character, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #4b5563',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCharacterClick(character.name)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <CharacterPortrait character={character} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: character.role === 'Primary' ? '#dc2626' :
                                   character.role === 'Secondary' ? '#2563eb' :
                                   '#16a34a',
                            marginBottom: '2px'
                          }}>
                            {character.role}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            lineHeight: '1.2'
                          }}>
                            {character.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Link */}
            {set.product_url && (
              <div style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #374151',
                textAlign: 'center'
              }}>
                <a
                  href={set.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '14px',
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

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#ef4444'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#f9fafb',
            marginBottom: '16px'
          }}>
            Sets & Boxes Collection
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Track your Star Wars: Shatterpoint expansion sets and core boxes
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
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
              padding: '8px 16px',
              borderRadius: '8px',
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
              style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #374151',
                transition: 'all 0.3s ease',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => handleSetClick(set)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Type Badge - moved above image */}
              <div style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                background: getTypeColor(set.type),
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                {set.type}
              </div>

              {/* Product Image/Icon */}
              <div style={{
                width: '100%',
                height: '200px',
                marginBottom: '16px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '2px solid #6b7280'
              }}>
                {/* Status Badge - now inside image container */}
                {set.collection && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getStatusColor(set.collection.status),
                    zIndex: 10
                  }}>
                    {set.collection.status}
                  </div>
                )}
                <SetImageWithFallback set={set} />
              </div>

              {/* Content */}
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#f9fafb',
                  marginBottom: '8px'
                }}>
                  {set.name}
                </h3>
                
                <div style={{
                  fontSize: '14px',
                  color: '#3b82f6',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {set.code}
                </div>
                
                {set.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {set.description}
                  </p>
                )}

                {/* Characters included */}
                {set.characters && set.characters.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#d1d5db',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      Characters ({set.characters.length}):
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      {set.characters.slice(0, 3).map((char, index) => (
                        <span
                          key={index}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: char.role === 'Primary' ? '#dc2626' :
                                       char.role === 'Secondary' ? '#2563eb' :
                                       '#16a34a',
                            color: 'white',
                            fontWeight: '500'
                          }}
                        >
                          {char.name}
                        </span>
                      ))}
                      {set.characters.length > 3 && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: '#6b7280',
                          color: 'white',
                          fontWeight: '500'
                        }}>
                          +{set.characters.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Product link */}
                {set.product_url && (
                  <div style={{ marginBottom: '16px' }}>
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
                          ⭐ Wishlist
                        </button>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        flexWrap: 'wrap'
                      }}>
                        {['OWNED', 'PAINTED', 'WISHLIST', 'SOLD'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(set.id, status as any)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              background: set.collection?.status === status ? getStatusColor(status) : '#374151',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background 0.2s ease'
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
                        <button
                          onClick={() => handleRemoveFromCollection(set.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {getFilteredSets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📦
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#d1d5db',
              marginBottom: '8px'
            }}>
              No sets found
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#9ca3af'
            }}>
              Try adjusting your filters or add some sets to your collection
            </p>
          </div>
        )}
      </div>

      {/* Set Modal */}
      {showSetModal && selectedSet && (
        <SetModal set={selectedSet} onClose={handleCloseSetModal} />
      )}

      {/* Character Modal */}
      {showCharacterModal && selectedCharacter && (
        <CharacterModal
          open={showCharacterModal}
          onClose={handleCloseCharacterModal}
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
};

export default SetsPage;
