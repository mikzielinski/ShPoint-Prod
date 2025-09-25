import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import CharacterModal from '../components/CharacterModal';
import Modal from '../components/Modal';
import { MissionModal } from '../components/MissionModal';
import SquadBuilder from '../components/SquadBuilder';
import CustomCardGenerator from '../components/CustomCardGenerator';
import { setsData } from '../data/sets';
import { missionsData } from '../data/missions';
import FiltersPanel from '../components/FiltersPanel';
// SetImageWithFallback component for displaying set images
const SetImageWithFallback = ({ set }) => {
    const [imageError, setImageError] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // Generate possible image URLs for the set - use same URLs as SetsPage
    const generateUrls = (code) => {
        const urls = [];
        const setCode = code.toUpperCase();
        // Real URLs scraped from AMG gallery (same as SetsPage)
        const knownUrls = {
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
        }
        else {
            setImageError(true);
        }
    };
    const getSetIcon = (set) => {
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
        return (_jsxs("div", { style: {
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
            }, children: [_jsx("div", { style: { fontSize: "16px", marginBottom: "2px" }, children: getSetIcon(set) }), _jsx("div", { style: { fontSize: "8px", textAlign: "center" }, children: set.code })] }));
    }
    return (_jsx("div", { style: {
            width: "60px",
            height: "60px",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
        }, children: _jsx("img", { src: possibleUrls[currentImageIndex], alt: set.name, style: {
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center"
            }, onError: handleImageError }) }));
};
export default function MyCollectionPage() {
    const { auth } = useAuth();
    const user = auth.status === 'authenticated' ? auth.user : null;
    const [characterCollections, setCharacterCollections] = useState([]);
    const [allCharacters, setAllCharacters] = useState([]);
    const [allSets, setAllSets] = useState([]);
    const [setCollections, setSetCollections] = useState([]);
    const [missionCollections, setMissionCollections] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Usunięto activeTab - teraz mamy jeden główny widok
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [activeTab, setActiveTab] = useState('characters');
    const [strikeTeamSubTab, setStrikeTeamSubTab] = useState('published');
    const [selectedSet, setSelectedSet] = useState(null);
    const [showSetModal, setShowSetModal] = useState(false);
    const [selectedMission, setSelectedMission] = useState(null);
    const [strikeTeams, setStrikeTeams] = useState([]);
    const [showSquadBuilder, setShowSquadBuilder] = useState(false);
    const [showCustomCardGenerator, setShowCustomCardGenerator] = useState(false);
    // Debug log for showCustomCardGenerator state
    console.log('showCustomCardGenerator state:', showCustomCardGenerator);
    // Use shared sets data
    const mockSets = setsData;
    // Helper function to map character names to character IDs
    const getCharacterId = (characterName) => {
        const nameMap = {
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
    const [filters, setFilters] = useState({
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
            if (!charactersResponse.ok)
                throw new Error('Failed to load characters');
            const charactersData = await charactersResponse.json();
            setAllCharacters(charactersData.items || []);
            // Load character collections
            const characterResponse = await fetch(api('/api/shatterpoint/characters'), {
                credentials: 'include',
            });
            if (!characterResponse.ok)
                throw new Error('Failed to load character collections');
            const characterData = await characterResponse.json();
            console.log('🔍 Character collections loaded:', characterData.collections);
            setCharacterCollections(characterData.collections || []);
            // Load set collections
            const setResponse = await fetch(api('/api/shatterpoint/sets'), {
                credentials: 'include',
            });
            if (!setResponse.ok)
                throw new Error('Failed to load set collections');
            const setData = await setResponse.json();
            console.log('🔍 Set collections loaded:', setData.collections);
            setSetCollections(setData.collections || []);
            // Load mission collections
            const missionResponse = await fetch(api('/api/shatterpoint/missions'), {
                credentials: 'include',
            });
            if (!missionResponse.ok)
                throw new Error('Failed to load mission collections');
            const missionData = await missionResponse.json();
            console.log('🔍 Mission collections loaded:', missionData.missionCollections || missionData.collections);
            setMissionCollections(missionData.missionCollections || missionData.collections || []);
            // Load strike teams
            const strikeTeamsResponse = await fetch(api('/api/shatterpoint/strike-teams'), {
                credentials: 'include',
            });
            if (!strikeTeamsResponse.ok)
                throw new Error('Failed to load strike teams');
            const strikeTeamsData = await strikeTeamsResponse.json();
            console.log('🔍 Strike teams loaded:', strikeTeamsData.strikeTeams);
            setStrikeTeams(strikeTeamsData.strikeTeams || []);
            // Load stats
            const statsResponse = await fetch(api('/api/shatterpoint/stats'), {
                credentials: 'include',
            });
            if (!statsResponse.ok)
                throw new Error('Failed to load collection stats');
            const statsData = await statsResponse.json();
            setStats(statsData.stats);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load collections');
            console.error('Error loading collections:', err);
        }
        finally {
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
        }
        catch (err) {
            console.error('Error refreshing mission collections:', err);
        }
    };
    const handleRemoveMission = async (missionId) => {
        if (!user)
            return;
        try {
            const response = await fetch(api(`/api/shatterpoint/missions/${missionId}`), {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                // Remove from local state
                setMissionCollections(prev => prev.filter(c => c && c.missionId && c.missionId !== missionId));
                console.log('Mission removed from collection');
            }
        }
        catch (error) {
            console.error('Error removing mission:', error);
        }
    };
    const handleRemoveCharacter = async (characterId) => {
        try {
            const response = await fetch(api(`/api/shatterpoint/characters/${characterId}`), {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok)
                throw new Error('Failed to remove character');
            setCharacterCollections(prev => prev.filter(c => c.characterId !== characterId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove character');
        }
    };
    // Handle removing set from collection
    const handleRemoveFromCollection = async (setId) => {
        if (!user)
            return;
        try {
            const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setSetCollections(prev => prev.filter(c => c.setId !== setId));
                alert('Set removed from collection!');
            }
            else {
                console.error('Failed to remove set from collection');
                alert('Failed to remove set from collection');
            }
        }
        catch (error) {
            console.error('Error removing set from collection:', error);
            alert('Error removing set from collection');
        }
    };
    // Handle updating set status
    const handleUpdateStatus = async (setId, newStatus) => {
        if (!user)
            return;
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
            }
            else {
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
                    setSetCollections(prev => prev.map(c => c.setId === setId ? {
                        ...c,
                        isOwned: newStatus === 'OWNED' || newStatus === 'PAINTED',
                        isPainted: newStatus === 'PAINTED',
                        isWishlist: newStatus === 'WISHLIST',
                        isSold: newStatus === 'SOLD',
                        isFavorite: newStatus === 'FAVORITE'
                    } : c));
                }
                else {
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
                                }
                                catch (error) {
                                    console.error(`Error updating character ${character.name} status:`, error);
                                }
                            }
                        }
                        // Reload character collections to reflect changes
                        loadCollections();
                    }
                }
                alert(`Set status updated to ${newStatus.toLowerCase()}!`);
            }
            else {
                console.error('Failed to update set status');
                alert('Failed to update set status');
            }
        }
        catch (error) {
            console.error('Error updating set status:', error);
            alert('Error updating set status');
        }
    };
    // Handle set click to show character modal
    const handleSetClick = (set) => {
        setSelectedSet(set);
        setShowSetModal(true);
    };
    const handleUpdateCharacterStatus = async (collectionId, newStatus) => {
        try {
            const response = await fetch(api(`/api/shatterpoint/characters/${collectionId}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok)
                throw new Error('Failed to update character status');
            // Update local state with boolean fields
            setCharacterCollections(prev => prev.map(c => c.id === collectionId
                ? {
                    ...c,
                    isOwned: newStatus === 'OWNED' || newStatus === 'PAINTED',
                    isPainted: newStatus === 'PAINTED',
                    isWishlist: newStatus === 'WISHLIST',
                    isSold: newStatus === 'SOLD',
                    isFavorite: newStatus === 'FAVORITE'
                }
                : c));
            // Refresh stats to update the percentages
            const statsResponse = await fetch(api('/api/shatterpoint/stats'), {
                credentials: 'include',
            });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats);
            }
            // Show success message
            const character = allCharacters.find(c => characterCollections.find(cc => cc.id === collectionId)?.characterId === c.id);
            if (character) {
                alert(`✅ ${character.name} marked as painted!`);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update character status');
        }
    };
    const handleRemoveSet = async (setId) => {
        try {
            const response = await fetch(api(`/api/shatterpoint/sets/${setId}`), {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok)
                throw new Error('Failed to remove set');
            setSetCollections(prev => prev.filter(c => c.setId !== setId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove set');
        }
    };
    // Get characters with collection data
    const getCollectedCharacters = () => {
        return characterCollections.map(collection => {
            const character = allCharacters.find(c => c.id === collection.characterId);
            return character ? { ...character, collection } : null;
        }).filter(Boolean);
    };
    const getFilteredCharacters = () => {
        let filtered = getCollectedCharacters();
        // Filter by text search
        if (filters.text) {
            const searchText = filters.text.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(searchText) ||
                c.faction.toLowerCase().includes(searchText));
        }
        // Filter by unit types (roles)
        if (filters.unitTypes.length > 0) {
            filtered = filtered.filter(c => c.role && filters.unitTypes.includes(c.role));
        }
        // Filter by factions
        if (filters.factions.length > 0) {
            filtered = filtered.filter(c => filters.factions.includes(c.faction));
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
            filtered = filtered.filter(c => c.tags && filters.tags.some(tag => c.tags.includes(tag)));
        }
        return filtered;
    };
    const getSetCollection = (setId) => {
        return setCollections.find(sc => sc.setId === setId) || null;
    };
    const getCollectedSets = () => {
        return mockSets.map(set => ({
            ...set,
            collection: getSetCollection(set.id)
        })).filter(set => set.collection && (set.collection.isOwned ||
            set.collection.isPainted ||
            set.collection.isWishlist ||
            set.collection.isSold ||
            set.collection.isFavorite));
    };
    const getCollectedMissions = () => {
        return missionCollections.map(collection => {
            const mission = missionsData.find(m => m.id === collection.missionId);
            return mission ? { ...mission, collection } : null;
        }).filter(Boolean);
    };
    // Strike Teams helper functions
    const getPublishedStrikeTeams = () => {
        return strikeTeams.filter(team => team.isPublished);
    };
    const getPrivateStrikeTeams = () => {
        return strikeTeams.filter(team => !team.isPublished);
    };
    const getRealTeams = () => {
        return strikeTeams.filter(team => {
            // Real Team = all characters are owned in collection
            return team.characters.every(teamChar => {
                const collection = characterCollections.find(c => c.characterId === teamChar.characterId);
                return collection && collection.isOwned;
            });
        });
    };
    const getDreamTeams = () => {
        return strikeTeams.filter(team => {
            // Dream Team = any character is wishlist (not owned)
            return team.characters.some(teamChar => {
                const collection = characterCollections.find(c => c.characterId === teamChar.characterId);
                return !collection || !collection.isOwned || collection.isWishlist;
            });
        });
    };
    const getFilteredSets = () => {
        let filtered = getCollectedSets();
        // Filter by text search
        if (filters.text) {
            const searchText = filters.text.toLowerCase();
            filtered = filtered.filter(s => s.name.toLowerCase().includes(searchText) ||
                s.type.toLowerCase().includes(searchText));
        }
        // Filter by unit types (set types)
        if (filters.unitTypes.length > 0) {
            filtered = filtered.filter(s => filters.unitTypes.includes(s.type));
        }
        return filtered;
    };
    // Generate facets for filters
    const getCharacterFacets = () => {
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
    const getSetFacets = () => {
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
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) }));
    }
    if (!user) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "My Collection" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please log in to view your collection." })] }));
    }
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) }));
    }
    return (_jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "0 16px" }, children: [_jsx("h1", { style: { margin: "18px 0" }, children: "My Collection" }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #374151'
                }, children: [_jsx("div", { style: {
                            display: 'flex',
                            gap: '4px'
                        }, children: [
                            { id: 'characters', label: 'Characters', count: getCollectedCharacters().length },
                            { id: 'sets', label: 'Sets/Boxes', count: getCollectedSets().length },
                            { id: 'missions', label: 'Missions', count: getCollectedMissions().length },
                            { id: 'strike-teams', label: 'Strike Teams', count: strikeTeams.length }
                        ].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), style: {
                                padding: '12px 20px',
                                border: 'none',
                                background: activeTab === tab.id ? '#374151' : 'transparent',
                                color: activeTab === tab.id ? '#f9fafb' : '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                transition: 'all 0.2s ease'
                            }, onMouseEnter: (e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = '#1f2937';
                                    e.currentTarget.style.color = '#d1d5db';
                                }
                            }, onMouseLeave: (e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#9ca3af';
                                }
                            }, children: [tab.label, " (", tab.count, ")"] }, tab.id))) }), _jsxs("button", { onClick: () => {
                            console.log('Custom Card Generator button clicked!');
                            setShowCustomCardGenerator(true);
                        }, style: {
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }, children: [_jsx("span", { style: { fontSize: '16px' }, children: "\uD83C\uDFA8" }), "Custom Card Generator"] })] }), error && (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: error })), activeTab === 'characters' && (_jsxs(_Fragment, { children: [_jsx(FiltersPanel, { facets: getCharacterFacets(), filters: filters, onChange: setFilters, darkMode: true, unitTypeLabel: "Roles" }), _jsxs("div", { style: {
                            display: "flex",
                            gap: "24px",
                            marginTop: "20px"
                        }, children: [_jsx("div", { style: {
                                    width: "280px",
                                    flexShrink: 0
                                }, children: stats && (_jsxs("div", { style: {
                                        background: "#1f2937",
                                        borderRadius: "12px",
                                        padding: "20px",
                                        border: "1px solid #374151"
                                    }, children: [_jsx("h3", { style: {
                                                color: "#f9fafb",
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                marginBottom: "16px"
                                            }, children: "Collection Statistics" }), _jsxs("div", { style: { marginBottom: "20px" }, children: [_jsx("h4", { style: {
                                                        color: "#d1d5db",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        marginBottom: "8px"
                                                    }, children: "Characters" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Total:" }), _jsx("span", { style: { color: "#f9fafb", fontWeight: "500" }, children: stats.characters.total })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Owned:" }), _jsx("span", { style: { color: "#16a34a", fontWeight: "500" }, children: stats.characters.owned })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Painted:" }), _jsxs("span", { style: { color: "#2563eb", fontWeight: "500" }, children: [stats.characters.painted, stats.characters.owned > 0 && (_jsxs("span", { style: { color: "#6b7280", fontSize: "10px", marginLeft: "4px" }, children: ["(", Math.round((stats.characters.painted / stats.characters.owned) * 100), "%)"] }))] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Wishlist:" }), _jsx("span", { style: { color: "#ea580c", fontWeight: "500" }, children: stats.characters.wishlist })] })] })] }), _jsxs("div", { children: [_jsx("h4", { style: {
                                                        color: "#d1d5db",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        marginBottom: "8px"
                                                    }, children: "Sets" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Total:" }), _jsx("span", { style: { color: "#f9fafb", fontWeight: "500" }, children: stats.sets.total })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Owned:" }), _jsx("span", { style: { color: "#16a34a", fontWeight: "500" }, children: stats.sets.owned })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Painted:" }), _jsx("span", { style: { color: "#2563eb", fontWeight: "500" }, children: stats.sets.painted })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px" }, children: [_jsx("span", { style: { color: "#9ca3af" }, children: "Wishlist:" }), _jsx("span", { style: { color: "#ea580c", fontWeight: "500" }, children: stats.sets.wishlist })] })] })] })] })) }), _jsx("div", { style: { flex: 1 }, children: characterCollections.length === 0 ? (_jsxs("div", { style: {
                                        textAlign: "center",
                                        padding: "48px 0",
                                        color: "#6b7280"
                                    }, children: [_jsx("h2", { style: {
                                                fontSize: "20px",
                                                fontWeight: "600",
                                                marginBottom: "8px",
                                                color: "#f9fafb"
                                            }, children: "No characters in collection" }), _jsx("p", { style: { marginBottom: "16px" }, children: "Visit the Characters page to add characters to your collection." }), _jsx("a", { href: "/characters", style: {
                                                background: "#3b82f6",
                                                color: "white",
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                textDecoration: "none",
                                                display: "inline-block"
                                            }, children: "Browse Characters" })] })) : (_jsx("div", { style: {
                                        display: "grid",
                                        gridTemplateColumns: "repeat(5, 1fr)",
                                        gap: "16px"
                                    }, children: getFilteredCharacters().map((character) => (_jsxs("div", { style: {
                                            background: "#1f2937",
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                            border: "1px solid #374151",
                                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                            cursor: "pointer"
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }, onClick: () => setSelectedCharacter(character), children: [_jsxs("div", { style: {
                                                    width: "100%",
                                                    height: "240px",
                                                    overflow: "hidden",
                                                    position: "relative",
                                                    background: "#f8f9fa",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }, children: [_jsx("img", { src: character.portrait?.startsWith('/') ? character.portrait : (character.portrait ?? "https://picsum.photos/seed/placeholder/400/520"), alt: character.name, style: {
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                            objectPosition: "center"
                                                        }, onError: (e) => {
                                                            e.target.src = "https://picsum.photos/seed/placeholder/400/520";
                                                        } }), _jsx("div", { style: {
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "8px"
                                                        }, children: _jsx("span", { style: {
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
                                                            }, children: character.collection.isOwned ? 'OWNED' :
                                                                character.collection.isPainted ? 'PAINTED' :
                                                                    character.collection.isWishlist ? 'WISHLIST' :
                                                                        character.collection.isFavorite ? 'FAVORITE' :
                                                                            character.collection.isSold ? 'SOLD' : 'UNKNOWN' }) }), character.collection.isOwned && !character.collection.isPainted && (_jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleUpdateCharacterStatus(character.collection.id, 'PAINTED');
                                                        }, style: {
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
                                                        }, onMouseEnter: (e) => {
                                                            e.currentTarget.style.background = "#1d4ed8";
                                                        }, onMouseLeave: (e) => {
                                                            e.currentTarget.style.background = "#2563eb";
                                                        }, children: "Mark Painted" }))] }), _jsxs("div", { style: { padding: "12px" }, children: [_jsx("div", { style: {
                                                            fontWeight: "600",
                                                            color: "#f9fafb",
                                                            marginBottom: "4px",
                                                            fontSize: "14px",
                                                            lineHeight: "1.3"
                                                        }, children: character.name }), _jsxs("div", { style: {
                                                            fontSize: "12px",
                                                            color: "#9ca3af",
                                                            marginBottom: "6px"
                                                        }, children: [character.role, " \u2022 ", character.faction || "Unknown"] }), _jsx("div", { style: {
                                                            fontSize: "11px",
                                                            color: "#6b7280",
                                                            marginBottom: "8px",
                                                            fontStyle: "italic"
                                                        }, children: Array.isArray(character.era) ? character.era.join(', ') : (character.era || "Unknown Era") }), _jsxs("div", { style: {
                                                            display: "flex",
                                                            gap: "6px",
                                                            fontSize: "11px",
                                                            marginBottom: "6px"
                                                        }, children: [character.sp && (_jsxs("span", { style: {
                                                                    background: "#374151",
                                                                    padding: "2px 6px",
                                                                    borderRadius: "4px",
                                                                    color: "#d1d5db",
                                                                    fontWeight: "500"
                                                                }, children: ["SP: ", character.sp] })), character.pc && (_jsxs("span", { style: {
                                                                    background: "#374151",
                                                                    padding: "2px 6px",
                                                                    borderRadius: "4px",
                                                                    color: "#d1d5db",
                                                                    fontWeight: "500"
                                                                }, children: ["PC: ", character.pc] })), character.force && character.force > 0 && (_jsxs("span", { style: {
                                                                    background: "#7c2d12",
                                                                    padding: "2px 6px",
                                                                    borderRadius: "4px",
                                                                    color: "#fbbf24",
                                                                    fontWeight: "500"
                                                                }, children: ["Force: ", character.force] }))] }), (character.stamina || character.durability) && (_jsxs("div", { style: {
                                                            fontSize: "10px",
                                                            color: "#6b7280",
                                                            marginBottom: "8px"
                                                        }, children: [character.stamina && `Stamina: ${character.stamina}`, character.stamina && character.durability && " • ", character.durability && `Durability: ${character.durability}`] })), character.tags && character.tags.length > 0 && (_jsxs("div", { style: {
                                                            marginTop: "8px",
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "3px"
                                                        }, children: [character.tags.slice(0, 2).map((tag, i) => (_jsx("span", { style: {
                                                                    background: "#1e40af",
                                                                    color: "#dbeafe",
                                                                    padding: "1px 4px",
                                                                    borderRadius: "3px",
                                                                    fontSize: "10px",
                                                                    fontWeight: "500"
                                                                }, children: tag }, i))), character.tags.length > 2 && (_jsxs("span", { style: {
                                                                    background: "#4b5563",
                                                                    color: "#d1d5db",
                                                                    padding: "1px 4px",
                                                                    borderRadius: "3px",
                                                                    fontSize: "10px"
                                                                }, children: ["+", character.tags.length - 2] }))] })), character.collection.notes && (_jsxs("div", { style: {
                                                            marginTop: "8px",
                                                            padding: "4px 6px",
                                                            background: "#374151",
                                                            borderRadius: "4px",
                                                            fontSize: "10px",
                                                            color: "#9ca3af",
                                                            fontStyle: "italic"
                                                        }, children: ["Note: ", character.collection.notes] })), _jsxs("div", { style: {
                                                            marginTop: "12px",
                                                            display: "flex",
                                                            gap: "6px",
                                                            flexWrap: "wrap"
                                                        }, children: [character.collection.isPainted && (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateCharacterStatus(character.collection.id, 'OWNED');
                                                                }, style: {
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
                                                                }, onMouseEnter: (e) => {
                                                                    e.currentTarget.style.background = "#15803d";
                                                                }, onMouseLeave: (e) => {
                                                                    e.currentTarget.style.background = "#16a34a";
                                                                }, children: "Unpaint" })), !character.collection.isFavorite && (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateCharacterStatus(character.collection.id, 'FAVORITE');
                                                                }, style: {
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
                                                                }, onMouseEnter: (e) => {
                                                                    e.currentTarget.style.background = "#d97706";
                                                                }, onMouseLeave: (e) => {
                                                                    e.currentTarget.style.background = "#f59e0b";
                                                                }, children: "\u2665 Favorite" })), _jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm(`Remove ${character.name} from your collection?`)) {
                                                                        handleRemoveCharacter(character.id);
                                                                    }
                                                                }, style: {
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
                                                                }, onMouseEnter: (e) => {
                                                                    e.currentTarget.style.background = "#b91c1c";
                                                                }, onMouseLeave: (e) => {
                                                                    e.currentTarget.style.background = "#dc2626";
                                                                }, children: "Remove" })] })] })] }, character.id))) })) })] })] })), activeTab === 'sets' && (_jsxs(_Fragment, { children: [_jsx(FiltersPanel, { facets: getSetFacets(), filters: filters, onChange: setFilters, darkMode: true, unitTypeLabel: "Set Types", hideFactions: true, hideTags: true }), _jsx("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "16px"
                        }, children: getFilteredSets().length > 0 ? (getFilteredSets().map((set) => (_jsxs("div", { onClick: () => handleSetClick(set), style: {
                                background: "#1f2937",
                                borderRadius: "8px",
                                border: "1px solid #374151",
                                padding: "16px",
                                transition: "all 0.2s ease",
                                cursor: "pointer"
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.borderColor = "#4b5563";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.borderColor = "#374151";
                                e.currentTarget.style.transform = "translateY(0)";
                            }, children: [_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                        marginBottom: "12px"
                                    }, children: [_jsx(SetImageWithFallback, { set: set }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("h3", { style: {
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        color: "#f9fafb",
                                                        margin: "0 0 4px 0",
                                                        lineHeight: "1.3"
                                                    }, children: set.name }), _jsx("div", { style: {
                                                        fontSize: "12px",
                                                        color: "#9ca3af",
                                                        marginBottom: "8px"
                                                    }, children: set.type }), set.description && (_jsx("p", { style: {
                                                        fontSize: "12px",
                                                        color: "#d1d5db",
                                                        margin: "0 0 8px 0",
                                                        lineHeight: "1.4"
                                                    }, children: set.description }))] })] }), set.collection && (_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        marginBottom: "12px",
                                        flexWrap: "nowrap"
                                    }, children: [['OWNED', 'PAINTED', 'WISHLIST', 'SOLD'].map((status) => (_jsx("button", { onClick: (e) => {
                                                e.stopPropagation(); // Prevent modal from opening
                                                // Toggle logic for PAINTED status
                                                if (status === 'PAINTED' && set.collection?.isPainted) {
                                                    handleUpdateStatus(set.id, 'OWNED');
                                                }
                                                else {
                                                    handleUpdateStatus(set.id, status);
                                                }
                                            }, style: {
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
                                            }, onMouseEnter: (e) => {
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
                                            }, onMouseLeave: (e) => {
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
                                            }, children: status }, status))), _jsx("button", { onClick: (e) => {
                                                e.stopPropagation(); // Prevent modal from opening
                                                handleRemoveFromCollection(set.id);
                                            }, style: {
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                border: "none",
                                                background: "#dc2626",
                                                color: 'white',
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "background 0.2s ease"
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = '#b91c1c';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = '#dc2626';
                                            }, children: "Remove" })] })), _jsxs("div", { style: {
                                        display: "flex",
                                        gap: "8px",
                                        flexWrap: "wrap"
                                    }, children: [(!set.collection || (!set.collection.isOwned && !set.collection.isPainted && !set.collection.isWishlist && !set.collection.isSold && !set.collection.isFavorite)) && (_jsx("button", { onClick: (e) => {
                                                e.stopPropagation(); // Prevent modal from opening
                                                handleUpdateStatus(set.id, 'OWNED');
                                            }, style: {
                                                background: "#16a34a",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "background 0.2s ease"
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = "#15803d";
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = "#16a34a";
                                            }, children: "+ Add to Collection" })), (!set.collection || (!set.collection.isOwned && !set.collection.isPainted && !set.collection.isWishlist && !set.collection.isSold && !set.collection.isFavorite)) && (_jsx("button", { onClick: (e) => {
                                                e.stopPropagation(); // Prevent modal from opening
                                                handleUpdateStatus(set.id, 'WISHLIST');
                                            }, style: {
                                                background: "#ea580c",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "background 0.2s ease"
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = "#c2410c";
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = "#ea580c";
                                            }, children: "\u2B50 Wishlist" }))] })] }, set.id)))) : (_jsxs("div", { style: {
                                gridColumn: "1 / -1",
                                textAlign: "center",
                                padding: "40px 20px",
                                color: "#9ca3af"
                            }, children: [_jsx("h3", { style: {
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "#d1d5db",
                                        marginBottom: "8px"
                                    }, children: "No sets in your collection yet" }), _jsx("p", { style: {
                                        fontSize: "14px",
                                        lineHeight: "1.5"
                                    }, children: "Start building your Star Wars: Shatterpoint collection by adding sets and expansion packs!" })] })) })] })), activeTab === 'missions' && (_jsx("div", { children: getCollectedMissions().length === 0 ? (_jsxs("div", { style: {
                        padding: '40px',
                        textAlign: 'center',
                        background: '#1f2937',
                        borderRadius: '8px',
                        border: '1px solid #374151'
                    }, children: [_jsx("h2", { style: {
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#f9fafb',
                                marginBottom: '16px'
                            }, children: "No missions in collection" }), _jsx("p", { style: {
                                color: '#9ca3af',
                                fontSize: '14px',
                                marginBottom: '16px'
                            }, children: "Visit the Missions page to add missions to your collection." })] })) : (_jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }, children: getCollectedMissions().map((mission) => (_jsxs("div", { onClick: () => setSelectedMission(mission), style: {
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            border: '2px solid #444',
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '15px'
                                }, children: [mission.thumbnail && (_jsx("img", { src: mission.thumbnail, alt: mission.name, style: {
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            marginRight: '15px',
                                            objectFit: 'cover',
                                            border: '2px solid #444'
                                        }, onError: (e) => {
                                            const target = e.target;
                                            target.style.display = 'none';
                                        } })), _jsxs("div", { children: [_jsx("h3", { style: {
                                                    color: '#ffd700',
                                                    margin: '0 0 5px 0',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold'
                                                }, children: mission.name }), _jsx("p", { style: {
                                                    color: '#ccc',
                                                    margin: '0',
                                                    fontSize: '14px',
                                                    textTransform: 'capitalize'
                                                }, children: mission.source })] })] }), mission.description && (_jsx("p", { style: {
                                    color: '#aaa',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    margin: '0 0 15px 0'
                                }, children: mission.description })), _jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    color: '#888',
                                    marginBottom: '15px'
                                }, children: [_jsxs("span", { children: ["Struggles: ", mission.struggles.length] }), _jsxs("span", { children: ["Objectives: ", mission.objectives.length] })] }), _jsxs("div", { style: {
                                    display: 'flex',
                                    gap: '6px',
                                    flexWrap: 'wrap'
                                }, children: [mission.collection.isOwned && (_jsx("span", { style: {
                                            background: '#10b981',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600'
                                        }, children: "OWNED" })), mission.collection.isCompleted && (_jsx("span", { style: {
                                            background: '#3b82f6',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600'
                                        }, children: "COMPLETED" })), mission.collection.isWishlist && (_jsx("span", { style: {
                                            background: '#f59e0b',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600'
                                        }, children: "WISHLIST" })), mission.collection.isFavorite && (_jsx("span", { style: {
                                            background: '#ef4444',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600'
                                        }, children: "FAVORITE" }))] }), _jsx("div", { style: { marginTop: '10px' }, children: _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleRemoveMission(mission.id);
                                    }, style: {
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
                                    }, onMouseOver: (e) => {
                                        e.currentTarget.style.background = '#dc2626';
                                    }, onMouseOut: (e) => {
                                        e.currentTarget.style.background = '#ef4444';
                                    }, children: "Remove from Collection" }) })] }, mission.id))) })) })), selectedCharacter && (_jsx(CharacterModal, { open: !!selectedCharacter, onClose: () => setSelectedCharacter(null), id: selectedCharacter.id, character: {
                    id: selectedCharacter.id,
                    name: selectedCharacter.name,
                    unit_type: selectedCharacter.role,
                    squad_points: selectedCharacter.sp || selectedCharacter.pc || 0,
                    portrait: selectedCharacter.portrait
                } })), selectedSet && showSetModal && (_jsx("div", { role: "dialog", "aria-modal": "true", onClick: () => {
                    setShowSetModal(false);
                    setSelectedSet(null);
                }, style: {
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,.5)",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 50,
                    padding: 16,
                }, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
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
                    }, children: [_jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px 20px 8px 20px",
                                borderBottom: "1px solid #374151"
                            }, children: [_jsx("h2", { style: {
                                        fontSize: '22px',
                                        fontWeight: '600',
                                        margin: 0,
                                        color: '#f9fafb'
                                    }, children: selectedSet.name }), _jsx("button", { onClick: () => {
                                        setShowSetModal(false);
                                        setSelectedSet(null);
                                    }, style: {
                                        border: "1px solid #4b5563",
                                        borderRadius: 999,
                                        padding: "6px 10px",
                                        background: "#374151",
                                        color: "#f9fafb",
                                        cursor: "pointer",
                                    }, "aria-label": "Close", children: "\u2715" })] }), _jsxs("div", { style: {
                                padding: "16px 20px 20px 20px",
                                overflowY: "auto",
                                flex: 1
                            }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        gap: '16px',
                                        marginBottom: '16px',
                                        alignItems: 'flex-start'
                                    }, children: [_jsx("div", { style: { flexShrink: 0 }, children: _jsx(SetImageWithFallback, { set: selectedSet }) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("p", { style: {
                                                        fontSize: '14px',
                                                        color: '#d1d5db',
                                                        marginBottom: '6px',
                                                        fontWeight: '500'
                                                    }, children: selectedSet.type }), _jsx("p", { style: {
                                                        fontSize: '13px',
                                                        color: '#9ca3af',
                                                        lineHeight: '1.4',
                                                        margin: 0
                                                    }, children: selectedSet.description })] })] }), _jsx("h3", { style: {
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        marginBottom: '12px',
                                        color: '#f9fafb',
                                        textAlign: 'center',
                                        borderBottom: '1px solid #374151',
                                        paddingBottom: '8px'
                                    }, children: "Characters in this set" }), _jsx("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                        gap: '12px',
                                        padding: '4px'
                                    }, children: selectedSet.characters?.map((character, index) => {
                                        const characterId = getCharacterId(character.name);
                                        const characterData = allCharacters.find(c => c.id === characterId);
                                        // Get role color
                                        const getRoleColor = (role) => {
                                            switch (role.toLowerCase()) {
                                                case 'primary': return '#ef4444'; // Red
                                                case 'secondary': return '#f59e0b'; // Amber
                                                case 'supporting': return '#10b981'; // Green
                                                default: return '#6b7280'; // Gray
                                            }
                                        };
                                        return (_jsxs("div", { onClick: () => {
                                                if (characterData) {
                                                    setSelectedCharacter(characterData);
                                                    setShowSetModal(false);
                                                    setSelectedSet(null);
                                                }
                                            }, style: {
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
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.borderColor = getRoleColor(character.role);
                                                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                                                e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 20px ${getRoleColor(character.role)}40`;
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.borderColor = '#4b5563';
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }, children: [_jsx("div", { style: {
                                                        width: '56px',
                                                        height: '56px',
                                                        borderRadius: '8px',
                                                        border: '2px solid #6b7280',
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        position: 'relative'
                                                    }, children: characterData?.portrait ? (_jsx("img", { src: characterData.portrait, alt: character.name, style: {
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'contain',
                                                            objectPosition: 'center'
                                                        } })) : (_jsx("div", { style: {
                                                            width: '100%',
                                                            height: '100%',
                                                            background: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#d1d5db',
                                                            fontSize: '20px',
                                                            fontWeight: '600'
                                                        }, children: "?" })) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                color: '#f9fafb',
                                                                marginBottom: '4px',
                                                                lineHeight: '1.2',
                                                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                            }, children: character.name }), _jsxs("div", { style: {
                                                                fontSize: '12px',
                                                                color: '#d1d5db',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                flexWrap: 'wrap'
                                                            }, children: [_jsx("span", { style: {
                                                                        background: getRoleColor(character.role),
                                                                        color: 'white',
                                                                        padding: '2px 5px',
                                                                        borderRadius: '3px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '600'
                                                                    }, children: character.role }), characterData?.faction && characterData.faction !== 'Unknown' && (_jsx("span", { style: {
                                                                        background: '#374151',
                                                                        color: '#9ca3af',
                                                                        padding: '2px 5px',
                                                                        borderRadius: '3px',
                                                                        fontSize: '10px'
                                                                    }, children: characterData.faction }))] })] }), _jsx("div", { style: {
                                                        color: '#9ca3af',
                                                        fontSize: '14px',
                                                        opacity: 0.6,
                                                        flexShrink: 0
                                                    }, children: "\u2192" })] }, index));
                                    }) })] })] }) })), activeTab === 'strike-teams' && (_jsxs("div", { children: [_jsx("div", { style: {
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '20px',
                            borderBottom: '1px solid #374151'
                        }, children: [
                            { id: 'published', label: 'Published', count: getPublishedStrikeTeams().length },
                            { id: 'private', label: 'Private', count: getPrivateStrikeTeams().length },
                            { id: 'builder', label: 'Builder', count: null }
                        ].map((tab) => (_jsxs("button", { onClick: () => setStrikeTeamSubTab(tab.id), style: {
                                padding: '12px 20px',
                                border: 'none',
                                background: strikeTeamSubTab === tab.id ? '#374151' : 'transparent',
                                color: strikeTeamSubTab === tab.id ? '#f9fafb' : '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                borderBottom: strikeTeamSubTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                transition: 'all 0.2s ease'
                            }, onMouseEnter: (e) => {
                                if (strikeTeamSubTab !== tab.id) {
                                    e.currentTarget.style.background = '#1f2937';
                                    e.currentTarget.style.color = '#d1d5db';
                                }
                            }, onMouseLeave: (e) => {
                                if (strikeTeamSubTab !== tab.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#9ca3af';
                                }
                            }, children: [tab.label, tab.count !== null ? ` (${tab.count})` : ''] }, tab.id))) }), strikeTeamSubTab === 'published' && (_jsx("div", { children: getPublishedStrikeTeams().length === 0 ? (_jsxs("div", { style: {
                                padding: '40px',
                                textAlign: 'center',
                                background: '#1f2937',
                                borderRadius: '8px',
                                border: '1px solid #374151'
                            }, children: [_jsx("h2", { style: {
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#f9fafb',
                                        marginBottom: '16px'
                                    }, children: "No published strike teams" }), _jsx("p", { style: {
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        marginBottom: '16px'
                                    }, children: "Publish your strike teams to share them with the community." })] })) : (_jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '20px'
                            }, children: getPublishedStrikeTeams().map((team) => (_jsx(StrikeTeamCard, { team: team, allCharacters: allCharacters, characterCollections: characterCollections, onCharacterClick: setSelectedCharacter }, team.id))) })) })), strikeTeamSubTab === 'private' && (_jsx("div", { children: getPrivateStrikeTeams().length === 0 ? (_jsxs("div", { style: {
                                padding: '40px',
                                textAlign: 'center',
                                background: '#1f2937',
                                borderRadius: '8px',
                                border: '1px solid #374151'
                            }, children: [_jsx("h2", { style: {
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#f9fafb',
                                        marginBottom: '16px'
                                    }, children: "No private strike teams" }), _jsx("p", { style: {
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        marginBottom: '16px'
                                    }, children: "Create private strike teams for your personal use." })] })) : (_jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '20px'
                            }, children: getPrivateStrikeTeams().map((team) => (_jsx(StrikeTeamCard, { team: team, allCharacters: allCharacters, characterCollections: characterCollections, onCharacterClick: setSelectedCharacter }, team.id))) })) })), strikeTeamSubTab === 'builder' && (_jsxs("div", { children: [_jsxs("div", { style: {
                                    padding: '40px',
                                    textAlign: 'center',
                                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid #4b5563',
                                    marginBottom: '30px'
                                }, children: [_jsx("div", { style: {
                                            fontSize: '4rem',
                                            marginBottom: '20px'
                                        }, children: "\u2694\uFE0F" }), _jsx("h2", { style: {
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: '#f9fafb',
                                            marginBottom: '16px'
                                        }, children: "Strike Team Builder" }), _jsx("p", { style: {
                                            color: '#9ca3af',
                                            fontSize: '16px',
                                            marginBottom: '24px',
                                            maxWidth: '600px',
                                            margin: '0 auto 24px'
                                        }, children: "Build your perfect strike teams! Choose from characters in your collection or create dream teams with characters you wish to own." }), _jsx("button", { onClick: () => setShowSquadBuilder(true), style: {
                                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }, children: "Start Building" })] }), _jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '20px',
                                    marginBottom: '30px'
                                }, children: [_jsxs("div", { style: {
                                            background: '#1f2937',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #374151',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '2rem',
                                                    fontWeight: 'bold',
                                                    color: '#10b981',
                                                    marginBottom: '8px'
                                                }, children: getRealTeams().length }), _jsx("div", { style: {
                                                    color: '#9ca3af',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }, children: "\uD83C\uDFAF Real Teams" }), _jsx("div", { style: {
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    marginTop: '4px'
                                                }, children: "Teams with owned characters" })] }), _jsxs("div", { style: {
                                            background: '#1f2937',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #374151',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '2rem',
                                                    fontWeight: 'bold',
                                                    color: '#f59e0b',
                                                    marginBottom: '8px'
                                                }, children: getDreamTeams().length }), _jsx("div", { style: {
                                                    color: '#9ca3af',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }, children: "\uD83D\uDCAD Dream Teams" }), _jsx("div", { style: {
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    marginTop: '4px'
                                                }, children: "Teams with wishlist characters" })] }), _jsxs("div", { style: {
                                            background: '#1f2937',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #374151',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '2rem',
                                                    fontWeight: 'bold',
                                                    color: '#3b82f6',
                                                    marginBottom: '8px'
                                                }, children: getPublishedStrikeTeams().length }), _jsx("div", { style: {
                                                    color: '#9ca3af',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }, children: "\uD83C\uDF10 Published" }), _jsx("div", { style: {
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    marginTop: '4px'
                                                }, children: "Shared with community" })] }), _jsxs("div", { style: {
                                            background: '#1f2937',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #374151',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '2rem',
                                                    fontWeight: 'bold',
                                                    color: '#8b5cf6',
                                                    marginBottom: '8px'
                                                }, children: getPrivateStrikeTeams().length }), _jsx("div", { style: {
                                                    color: '#9ca3af',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }, children: "\uD83D\uDD12 Private" }), _jsx("div", { style: {
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    marginTop: '4px'
                                                }, children: "Personal teams only" })] })] }), _jsxs("div", { style: {
                                    background: '#1f2937',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '1px solid #374151'
                                }, children: [_jsx("h3", { style: {
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            marginBottom: '16px'
                                        }, children: "Builder Features" }), _jsxs("div", { style: {
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                            gap: '16px'
                                        }, children: [_jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }, children: [_jsx("div", { style: {
                                                            fontSize: '20px'
                                                        }, children: "\uD83C\uDFAF" }), _jsxs("div", { children: [_jsx("div", { style: {
                                                                    color: '#f9fafb',
                                                                    fontWeight: '600',
                                                                    fontSize: '14px'
                                                                }, children: "Real Team Validation" }), _jsx("div", { style: {
                                                                    color: '#9ca3af',
                                                                    fontSize: '12px'
                                                                }, children: "Build teams only with characters you own" })] })] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }, children: [_jsx("div", { style: {
                                                            fontSize: '20px'
                                                        }, children: "\uD83D\uDCAD" }), _jsxs("div", { children: [_jsx("div", { style: {
                                                                    color: '#f9fafb',
                                                                    fontWeight: '600',
                                                                    fontSize: '14px'
                                                                }, children: "Dream Team Creation" }), _jsx("div", { style: {
                                                                    color: '#9ca3af',
                                                                    fontSize: '12px'
                                                                }, children: "Create teams with wishlist characters" })] })] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }, children: [_jsx("div", { style: {
                                                            fontSize: '20px'
                                                        }, children: "\u2696\uFE0F" }), _jsxs("div", { children: [_jsx("div", { style: {
                                                                    color: '#f9fafb',
                                                                    fontWeight: '600',
                                                                    fontSize: '14px'
                                                                }, children: "Rules Validation" }), _jsx("div", { style: {
                                                                    color: '#9ca3af',
                                                                    fontSize: '12px'
                                                                }, children: "Automatic Shatterpoint rules checking" })] })] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }, children: [_jsx("div", { style: {
                                                            fontSize: '20px'
                                                        }, children: "\uD83D\uDCCA" }), _jsxs("div", { children: [_jsx("div", { style: {
                                                                    color: '#f9fafb',
                                                                    fontWeight: '600',
                                                                    fontSize: '14px'
                                                                }, children: "Performance Tracking" }), _jsx("div", { style: {
                                                                    color: '#9ca3af',
                                                                    fontSize: '12px'
                                                                }, children: "Track wins, losses, and draws" })] })] })] })] })] }))] })), showSquadBuilder && (_jsx(Modal, { open: showSquadBuilder, onClose: () => setShowSquadBuilder(false), maxWidth: 1400, children: _jsxs("div", { style: {
                        padding: '24px',
                        background: '#1f2937',
                        borderRadius: '12px',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        minHeight: '600px'
                    }, children: [_jsx("h2", { style: {
                                color: '#f9fafb',
                                marginBottom: '20px',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }, children: "Strike Team Builder" }), _jsx(SquadBuilder, { characterCollections: characterCollections, onSave: async (teamData) => {
                                try {
                                    console.log('Saving team:', teamData);
                                    const response = await fetch('/api/shatterpoint/strike-teams', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify(teamData),
                                    });
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Failed to save strike team');
                                    }
                                    const result = await response.json();
                                    console.log('Team saved successfully:', result);
                                    alert('Strike Team saved successfully!');
                                    setShowSquadBuilder(false);
                                    // Reload strike teams to show the new one
                                    await loadCollections();
                                }
                                catch (error) {
                                    console.error('Error saving strike team:', error);
                                    alert(`Error saving strike team: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                            } })] }) })), selectedMission && (_jsx(MissionModal, { mission: selectedMission, onClose: () => setSelectedMission(null) })), selectedCharacter && (_jsx(CharacterModal, { open: !!selectedCharacter, onClose: () => setSelectedCharacter(null), id: selectedCharacter.id, character: {
                    id: selectedCharacter.id,
                    name: selectedCharacter.name,
                    unit_type: selectedCharacter.role || "Primary",
                    squad_points: selectedCharacter.sp || selectedCharacter.pc || 0,
                    portrait: selectedCharacter.portrait
                } })), showCustomCardGenerator && (_jsxs(_Fragment, { children: [console.log('Rendering Custom Card Generator Modal...'), _jsx(Modal, { open: showCustomCardGenerator, onClose: () => {
                            console.log('Custom Card Generator modal closing');
                            setShowCustomCardGenerator(false);
                        }, maxWidth: 1400, children: _jsx(CustomCardGenerator, { onClose: () => {
                                console.log('Custom Card Generator onClose called');
                                setShowCustomCardGenerator(false);
                            }, onSave: (card) => {
                                console.log('Custom card saved:', card);
                                // Optionally reload data or show success message
                            } }) })] }))] }));
}
const StrikeTeamCard = ({ team, showTeamType = false, teamType, allCharacters, characterCollections, onCharacterClick }) => {
    const getCharacterById = (id) => {
        return allCharacters.find(c => c.id === id);
    };
    // Handle character click
    const handleCharacterClick = (character) => {
        onCharacterClick(character);
    };
    // Group characters by squad and sort by role within each squad
    // Squad 1: order 0, 1, 2
    const squad1Characters = team.characters
        .filter(char => char.order === 0 || char.order === 1 || char.order === 2)
        .sort((a, b) => {
        const roleOrder = { 'PRIMARY': 0, 'SECONDARY': 1, 'SUPPORT': 2 };
        return roleOrder[a.role] - roleOrder[b.role];
    });
    // Squad 2: order 3, 4, 5
    const squad2Characters = team.characters
        .filter(char => char.order === 3 || char.order === 4 || char.order === 5)
        .sort((a, b) => {
        const roleOrder = { 'PRIMARY': 0, 'SECONDARY': 1, 'SUPPORT': 2 };
        return roleOrder[a.role] - roleOrder[b.role];
    });
    const handlePublishToggle = async () => {
        try {
            const response = await fetch(`/api/shatterpoint/strike-teams/${team.id}/publish`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isPublished: !team.isPublished }),
            });
            if (!response.ok) {
                throw new Error('Failed to update publication status');
            }
            // Reload the page to refresh the strike teams list
            window.location.reload();
        }
        catch (error) {
            console.error('Error updating publication status:', error);
            alert(`Error updating publication status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    return (_jsxs("div", { style: {
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #4b5563',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
        }, onMouseEnter: (e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        }, children: [_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h3", { style: {
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: '#f9fafb'
                        }, children: team.name }), team.description && (_jsx("p", { style: {
                            color: '#9ca3af',
                            fontSize: '14px',
                            marginBottom: '12px',
                            lineHeight: '1.4'
                        }, children: team.description })), _jsxs("div", { style: {
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between'
                        }, children: [_jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("span", { style: {
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: team.type === 'MY_TEAMS' ? '#16a34a' : '#f59e0b',
                                            color: 'white'
                                        }, children: team.type === 'MY_TEAMS' ? 'My Team' : 'Dream Team' }), team.isPublished && (_jsx("span", { style: {
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: '#3b82f6',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }, children: "\uD83C\uDF10 Published" })), showTeamType && teamType && (_jsx("span", { style: {
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: teamType === 'Real' ? '#10b981' : '#f59e0b',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }, children: teamType === 'Real' ? '🎯 Real Team' : '💭 Dream Team' }))] }), _jsx("button", { onClick: handlePublishToggle, style: {
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: team.isPublished ? '#ef4444' : '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.opacity = '0.8';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.opacity = '1';
                                }, children: team.isPublished ? '🔒 Unpublish' : '🌐 Publish' })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#111827',
                    borderRadius: '8px',
                    fontSize: '14px'
                }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#22c55e', fontWeight: 'bold', fontSize: '16px' }, children: team.wins }), _jsx("div", { style: { color: '#9ca3af' }, children: "Wins" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }, children: team.losses }), _jsx("div", { style: { color: '#9ca3af' }, children: "Losses" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }, children: team.draws }), _jsx("div", { style: { color: '#9ca3af' }, children: "Draws" })] }), _jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#d1d5db', fontWeight: 'bold', fontSize: '16px' }, children: team.characters.length }), _jsx("div", { style: { color: '#9ca3af' }, children: "Units" })] })] }), _jsxs("div", { children: [_jsx("h4", { style: {
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#d1d5db',
                            marginBottom: '8px'
                        }, children: "Squad Composition" }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("div", { style: {
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#d1d5db',
                                    marginBottom: '6px',
                                    textAlign: 'center'
                                }, children: "Squad 1" }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px'
                                }, children: squad1Characters.map((teamChar) => {
                                    const character = getCharacterById(teamChar.characterId);
                                    const collection = characterCollections.find(c => c.characterId === teamChar.characterId);
                                    return (_jsxs("div", { style: {
                                            background: '#111827',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            textAlign: 'center',
                                            position: 'relative',
                                            minHeight: teamChar.role === 'PRIMARY' ? '140px' : '120px'
                                        }, children: [character?.portrait && (_jsx("div", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    if (character) {
                                                        handleCharacterClick(character);
                                                    }
                                                }, style: {
                                                    width: '80px',
                                                    height: '100px',
                                                    margin: '0 auto 10px auto',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: '2px solid #3b82f6',
                                                    background: '#1f2937',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }, onMouseEnter: (e) => {
                                                    e.currentTarget.style.borderColor = '#60a5fa';
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }, children: _jsx("img", { src: character.portrait, alt: character.name, style: {
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    } }) })), _jsx("div", { style: {
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: teamChar.role === 'PRIMARY' ? '#3b82f6' :
                                                        teamChar.role === 'SECONDARY' ? '#8b5cf6' : '#10b981',
                                                    marginBottom: '4px'
                                                }, children: teamChar.role }), _jsx("div", { style: {
                                                    fontSize: '11px',
                                                    color: '#9ca3af',
                                                    lineHeight: '1.2'
                                                }, children: character?.name || 'Unknown' }), collection && (_jsx("div", { style: {
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: collection.isOwned ? '#10b981' :
                                                        collection.isWishlist ? '#f59e0b' : '#ef4444'
                                                } }))] }, teamChar.id));
                                }) })] }), squad2Characters.length > 0 && (_jsxs("div", { children: [_jsx("div", { style: {
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#d1d5db',
                                    marginBottom: '6px',
                                    textAlign: 'center'
                                }, children: "Squad 2" }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px'
                                }, children: squad2Characters.map((teamChar) => {
                                    const character = getCharacterById(teamChar.characterId);
                                    const collection = characterCollections.find(c => c.characterId === teamChar.characterId);
                                    return (_jsxs("div", { style: {
                                            background: '#111827',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            textAlign: 'center',
                                            position: 'relative',
                                            minHeight: teamChar.role === 'PRIMARY' ? '120px' : '80px'
                                        }, children: [character?.portrait && (_jsx("div", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    if (character) {
                                                        handleCharacterClick(character);
                                                    }
                                                }, style: {
                                                    width: '80px',
                                                    height: '100px',
                                                    margin: '0 auto 10px auto',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: '2px solid #3b82f6',
                                                    background: '#1f2937',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }, onMouseEnter: (e) => {
                                                    e.currentTarget.style.borderColor = '#60a5fa';
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }, children: _jsx("img", { src: character.portrait, alt: character.name, style: {
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    } }) })), _jsx("div", { style: {
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: teamChar.role === 'PRIMARY' ? '#3b82f6' :
                                                        teamChar.role === 'SECONDARY' ? '#8b5cf6' : '#10b981',
                                                    marginBottom: '4px'
                                                }, children: teamChar.role }), _jsx("div", { style: {
                                                    fontSize: '11px',
                                                    color: '#9ca3af',
                                                    lineHeight: '1.2'
                                                }, children: character?.name || 'Unknown' }), collection && (_jsx("div", { style: {
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: collection.isOwned ? '#10b981' :
                                                        collection.isWishlist ? '#f59e0b' : '#ef4444'
                                                } }))] }, teamChar.id));
                                }) })] }))] }), _jsxs("div", { style: {
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #374151',
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center'
                }, children: ["Created ", new Date(team.createdAt).toLocaleDateString()] })] }));
};
