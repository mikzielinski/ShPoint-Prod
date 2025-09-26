import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/env";
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
import SquadBuilder from "./components/SquadBuilder";
import FiltersPanel from "./components/FiltersPanel";
import CharacterModal from "./components/CharacterModal";
import AvatarManager from "./components/AvatarManager";
import Modal from "./components/Modal";
import UserInvitationModal from "./components/UserInvitationModal";
import "./components/NavBar.css";
function useAuthMe() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const refetch = async () => {
        try {
            const res = await fetch("/api/me", { credentials: "include" });
            setData(res.ok ? (await res.json()) : { user: undefined });
        }
        catch {
            setData({ user: undefined });
        }
    };
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!alive)
                    return;
                setData(res.ok ? (await res.json()) : { user: undefined });
            }
            catch {
                setData({ user: undefined });
            }
            finally {
                alive && setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);
    return { data, loading, refetch };
}
function RoleChip({ role }) {
    const cls = role === "ADMIN" ? "nb-role r-admin"
        : role === "EDITOR" ? "nb-role r-editor"
            : "nb-role r-user";
    return _jsx("span", { className: cls, children: role ?? "USER" });
}
function NavBar({ onAvatarClick, onInviteClick }) {
    const { data, loading, refetch } = useAuthMe();
    const me = data?.user;
    const initials = useMemo(() => {
        // For initials, prefer name over username to get proper initials like "MZ" from "Mikolaj Zieliński"
        const n = me?.name || me?.username || me?.email || "User";
        const p = n.split(" ");
        return (p.length > 1 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
    }, [me?.name, me?.username, me?.email]);
    const gotoLogin = () => (window.location.href = "/auth/google");
    const doLogout = async () => { await fetch("/auth/logout", { method: "POST", credentials: "include" }); location.href = "/"; };
    return (_jsx("nav", { className: "nb-root", children: _jsxs("div", { className: "nb-inner", children: [_jsxs(NavLink, { to: "/", className: "nb-brand", children: [_jsx("div", { className: "nb-brand-dot" }), _jsx("span", { className: "nb-brand-name", children: "ShPoint" })] }), _jsxs("div", { className: "nb-nav", children: [_jsx(NavLink, { to: "/", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "News" }), _jsx(NavLink, { to: "/play", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Play" }), _jsx(NavLink, { to: "/characters", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Characters" }), _jsx(NavLink, { to: "/library", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Library" }), _jsx(NavLink, { to: "/strike-teams", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Strike Teams" }), me && (_jsxs(_Fragment, { children: [me.status !== 'SUSPENDED' && (_jsx(_Fragment, { children: _jsx(NavLink, { to: "/my-collection", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "My Collection" }) })), (me.role === "ADMIN" || me.role === "EDITOR") && me.status !== 'SUSPENDED' && (_jsx(NavLink, { to: "/content-management", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Manage Content" })), me.role === "ADMIN" && me.status !== 'SUSPENDED' && (_jsx(NavLink, { to: "/admin", className: ({ isActive }) => `nb-link ${isActive ? "is-active" : ""}`, children: "Admin" }))] }))] }), _jsxs("div", { className: "nb-actions", children: [!loading && !me && (_jsx("button", { className: "nb-btn", onClick: gotoLogin, children: "Sign in" })), loading ? (_jsx("span", { className: "nb-guest", children: "..." })) : me ? (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        transition: "background-color 0.2s"
                                    }, onClick: onAvatarClick, onMouseOver: (e) => e.target.style.backgroundColor = "#374151", onMouseOut: (e) => e.target.style.backgroundColor = "transparent", children: [(me.avatarUrl || me.image) ? (_jsx("img", { className: "nb-btn-icon", src: me.avatarUrl || me.image || undefined, alt: "avatar", style: {
                                                borderRadius: "50%",
                                                width: "32px",
                                                height: "32px",
                                                objectFit: "cover"
                                            }, onError: (e) => {
                                                const target = e.target;
                                                console.log("Avatar load error:", target.src);
                                                // Hide the broken image and show initials
                                                target.style.display = "none";
                                                target.nextElementSibling.style.display = "flex";
                                            }, onLoad: async (e) => {
                                                const target = e.target;
                                                console.log("Avatar loaded successfully:", target.src);
                                                // If this is Google image and user doesn't have custom avatarUrl, save it as backup
                                                if (me.image && target.src === me.image && !me.avatarUrl) {
                                                    try {
                                                        await fetch("/api/user/save-google-avatar", {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            credentials: "include",
                                                            body: JSON.stringify({ imageUrl: me.image })
                                                        });
                                                        console.log("Google avatar saved as backup");
                                                        // Refresh user data to get updated avatarUrl
                                                        refetch();
                                                    }
                                                    catch (error) {
                                                        console.error("Failed to save Google avatar:", error);
                                                    }
                                                }
                                            } })) : null, _jsx("div", { className: "nb-btn-icon", style: {
                                                borderRadius: "50%",
                                                width: "32px",
                                                height: "32px",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: "#374151",
                                                display: (me.avatarUrl || me.image) ? "none" : "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }, children: initials }), _jsx("span", { className: "nb-user", children: me.username ?? me.name ?? me.email ?? "User" }), _jsx(RoleChip, { role: me.role })] }), me.status !== 'SUSPENDED' && (_jsx("button", { className: "nb-btn", onClick: onInviteClick, style: {
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        marginRight: '8px'
                                    }, children: "\uD83D\uDCE7 Invite" })), _jsx("button", { className: "nb-btn", onClick: doLogout, children: "Sign out" })] })) : (_jsx("span", { className: "nb-guest", children: "Guest" }))] })] }) }));
}
function CharactersPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [characterCollections, setCharacterCollections] = useState([]);
    const { data: authData } = useAuthMe();
    const me = authData?.user;
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/characters", { credentials: "include" });
                const json = (await res.json());
                if (alive)
                    setData(json.items ?? []);
            }
            catch {
                if (alive)
                    setData([]);
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);
    // Load character collections
    useEffect(() => {
        if (!me)
            return;
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/shatterpoint/characters", { credentials: "include" });
                const json = await res.json();
                if (alive && json.ok) {
                    setCharacterCollections(json.collections || []);
                }
            }
            catch (err) {
                console.error('Error loading character collections:', err);
            }
        })();
        return () => { alive = false; };
    }, [me]);
    // Check if character is in collection
    const isCharacterInCollection = (characterId) => {
        return characterCollections.some(c => c.characterId === characterId && c.isOwned);
    };
    // Filter characters based on current filters
    const filteredData = useMemo(() => {
        return data.filter((char) => {
            // Text search
            if (filters.text) {
                const searchText = filters.text.toLowerCase();
                const matchesText = char.name.toLowerCase().includes(searchText) ||
                    (char.faction && char.faction.toLowerCase().includes(searchText)) ||
                    char.tags?.some(tag => tag.toLowerCase().includes(searchText));
                if (!matchesText)
                    return false;
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
            // SWP28 - Not Accepting Surrenders Squad Pack
            'Grand Admiral Thrawn': 'grand-admiral-thrawn',
            'Agent Kallus': 'agent-kallus-inside-man',
            'Agent Kallus, Inside Man': 'agent-kallus-inside-man',
            'ISB Agents': 'isb-agents',
        };
        return nameMap[characterName] || characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    };
    // Auto-add sets to collection when character is added
    const checkAndAutoAddSets = async (addedCharacterId) => {
        if (!me)
            return;
        try {
            // Get current character collections
            const charResponse = await fetch("/api/shatterpoint/characters", {
                credentials: "include"
            });
            if (!charResponse.ok)
                return;
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
                if (!set.characters || set.characters.length === 0)
                    return false;
                return set.characters.some(character => {
                    const characterId = getCharacterId(character.name);
                    return characterId === addedCharacterId;
                });
            });
            console.log(`🔍 Checking sets for character ${addedCharacterId}:`, relevantSets.map(s => s.name));
            console.log(`📊 Current character collections:`, characterCollections.map((c) => ({ characterId: c.characterId, isOwned: c.isOwned, isPainted: c.isPainted })));
            // Check only relevant sets for auto-add
            for (const set of relevantSets) {
                console.log(`🔍 Checking set "${set.name}" for completeness...`);
                // Check if user has all characters from this set
                const hasAllCharacters = set.characters.every(character => {
                    const characterId = getCharacterId(character.name);
                    const hasCharacter = characterCollections.some((collection) => collection.characterId === characterId &&
                        (collection.isOwned || collection.isPainted));
                    console.log(`  - Character "${character.name}" (ID: ${characterId}): ${hasCharacter ? '✅' : '❌'}`);
                    return hasCharacter;
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
        }
        catch (error) {
            console.error("Error checking auto-add sets:", error);
        }
    };
    // Make the function available globally for testing
    window.checkAndAutoAddSets = checkAndAutoAddSets;
    // Add a function to manually add SWP24 set
    window.addSWP24Set = async () => {
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
            }
            else {
                alert('❌ Failed to add SWP24 set: ' + (result.error || 'Unknown error'));
            }
            return result;
        }
        catch (error) {
            console.error('Error adding SWP24 set:', error);
            alert('❌ Error adding SWP24 set: ' + error.message);
        }
    };
    // Handle adding character to collection
    const handleAddToCollection = async (characterId) => {
        if (!me)
            return;
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
            // Refresh character collections
            const res = await fetch("/api/shatterpoint/characters", { credentials: "include" });
            const json = await res.json();
            if (json.ok) {
                setCharacterCollections(json.collections || []);
            }
            // Check if any sets should be auto-added for this specific character
            await checkAndAutoAddSets(characterId);
        }
        catch (error) {
            console.error("Error adding character to collection:", error);
            alert("Failed to add character to collection");
        }
    };
    // Handle adding character to wishlist
    const handleAddToWishlist = async (characterId) => {
        if (!me)
            return;
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
        }
        catch (error) {
            console.error("Error adding character to wishlist:", error);
            alert("Failed to add character to wishlist");
        }
    };
    // Handle adding character to favorites
    const handleAddToFavorites = async (characterId) => {
        if (!me)
            return;
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
        }
        catch (error) {
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
            }
            else if (typeof c.era === 'string') {
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
    return (_jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "0 16px" }, children: [_jsx("h1", { style: { margin: "18px 0" }, children: "Characters" }), loading ? _jsx("p", { children: "Loading\u2026" }) : null, !loading && data.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                            display: 'flex',
                            gap: '16px',
                            marginBottom: '20px',
                            flexWrap: 'wrap'
                        }, children: _jsx(FiltersPanel, { facets: facets, filters: filters, onChange: setFilters, darkMode: true }) }), _jsxs("div", { style: { marginBottom: "16px", fontSize: "14px", color: "#6b7280" }, children: ["Showing ", filteredData.length, " of ", data.length, " characters"] })] })), !loading && data.length === 0 ? (_jsx("p", { children: "No data (empty list)." })) : null, !loading && filteredData.length === 0 && data.length > 0 ? (_jsx("p", { children: "No characters match your filters." })) : null, _jsx("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "16px",
                    marginTop: "20px"
                }, children: filteredData.map(c => (_jsxs("div", { style: {
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
                    }, onClick: () => setSelectedCharacter(c), children: [_jsxs("div", { style: {
                                width: "100%",
                                height: "320px",
                                overflow: "hidden",
                                position: "relative",
                                background: "#1f2937",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }, children: [_jsx("img", { src: c.portrait?.startsWith('/') ? c.portrait : (c.portrait ?? "https://picsum.photos/seed/placeholder/400/520"), alt: c.name, style: {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "center"
                                    }, onError: (e) => {
                                        e.target.src = "https://picsum.photos/seed/placeholder/400/520";
                                    } }), !me && (_jsx("div", { style: {
                                        position: "absolute",
                                        top: "8px",
                                        right: "8px",
                                        background: "rgba(0, 0, 0, 0.8)",
                                        color: "#9ca3af",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        fontWeight: "500"
                                    }, children: "Sign in to add" }))] }), _jsxs("div", { style: { padding: "12px" }, children: [_jsx("div", { style: {
                                        fontWeight: "600",
                                        color: "#f9fafb",
                                        marginBottom: "4px",
                                        fontSize: "14px",
                                        lineHeight: "1.3"
                                    }, children: c.name }), _jsxs("div", { style: {
                                        fontSize: "12px",
                                        color: "#9ca3af",
                                        marginBottom: "6px"
                                    }, children: [c.role, " \u2022 ", c.faction || "Unknown"] }), _jsx("div", { style: {
                                        fontSize: "11px",
                                        color: "#6b7280",
                                        marginBottom: "8px",
                                        fontStyle: "italic"
                                    }, children: c.era || "Unknown Era" }), _jsxs("div", { style: {
                                        display: "flex",
                                        gap: "6px",
                                        fontSize: "11px",
                                        marginBottom: "6px"
                                    }, children: [c.sp && (_jsxs("span", { style: {
                                                background: "#374151",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                color: "#d1d5db",
                                                fontWeight: "500"
                                            }, children: ["SP: ", c.sp] })), c.pc && (_jsxs("span", { style: {
                                                background: "#374151",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                color: "#d1d5db",
                                                fontWeight: "500"
                                            }, children: ["PC: ", c.pc] })), c.force && c.force > 0 && (_jsxs("span", { style: {
                                                background: "#7c2d12",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                color: "#fbbf24",
                                                fontWeight: "500"
                                            }, children: ["Force: ", c.force] }))] }), (c.stamina || c.durability) && (_jsxs("div", { style: {
                                        fontSize: "10px",
                                        color: "#6b7280",
                                        marginBottom: "8px"
                                    }, children: [c.stamina && `Stamina: ${c.stamina}`, c.stamina && c.durability && " • ", c.durability && `Durability: ${c.durability}`] })), c.tags && c.tags.length > 0 && (_jsxs("div", { style: {
                                        marginTop: "8px",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "3px"
                                    }, children: [c.tags.slice(0, 2).map((tag, i) => (_jsx("span", { style: {
                                                background: "#1e40af",
                                                color: "#dbeafe",
                                                padding: "1px 4px",
                                                borderRadius: "3px",
                                                fontSize: "10px",
                                                fontWeight: "500"
                                            }, children: tag }, i))), c.tags.length > 2 && (_jsxs("span", { style: {
                                                background: "#4b5563",
                                                color: "#d1d5db",
                                                padding: "1px 4px",
                                                borderRadius: "3px",
                                                fontSize: "10px"
                                            }, children: ["+", c.tags.length - 2] }))] })), me && (_jsxs("div", { style: {
                                        marginTop: "12px",
                                        display: "flex",
                                        gap: "6px",
                                        flexWrap: "wrap"
                                    }, children: [_jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                handleAddToCollection(c.id);
                                            }, style: {
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
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = "#15803d";
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = "#16a34a";
                                            }, children: isCharacterInCollection(c.id) ? "✓ Owned" : "+ Collection" }), _jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                handleAddToWishlist(c.id);
                                            }, style: {
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
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = "#c2410c";
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = "#ea580c";
                                            }, children: "\u2B50 Wishlist" }), _jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                handleAddToFavorites(c.id);
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
                                            }, children: "\u2665 Favorite" })] }))] })] }, c.id))) }), selectedCharacter && (_jsx(CharacterModal, { open: !!selectedCharacter, onClose: () => setSelectedCharacter(null), id: selectedCharacter.id, character: {
                    id: selectedCharacter.id,
                    name: selectedCharacter.name,
                    unit_type: selectedCharacter.role,
                    squad_points: selectedCharacter.sp || selectedCharacter.pc || 0,
                    portrait: selectedCharacter.portrait || undefined
                } }))] }));
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
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, { onAvatarClick: () => setShowAvatarModal(true), onInviteClick: () => setShowInvitationModal(true) }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/builder", element: _jsx("div", { style: { maxWidth: 1200, margin: "0 auto", padding: 16 }, children: _jsx(SquadBuilder, {}) }) }), _jsx(Route, { path: "/library", element: _jsx(ShatterpointLibraryPage, {}) }), _jsx(Route, { path: "/characters", element: _jsx(CharactersPage, {}) }), _jsx(Route, { path: "/sets", element: _jsx(SetsPage, {}) }), _jsx(Route, { path: "/missions", element: _jsx(MissionsPage, {}) }), _jsx(Route, { path: "/play", element: _jsx(PlayPage, {}) }), _jsx(Route, { path: "/play/hero-vs-hero", element: _jsx(HeroVsHeroPage, {}) }), _jsx(Route, { path: "/play/strike-team-vs-strike-team", element: _jsx(StrikeTeamVsStrikeTeamPage, {}) }), _jsx(Route, { path: "/play/battle", element: _jsx(BattlePage, {}) }), _jsx(Route, { path: "/play/table-assistant", element: _jsx(TableAssistantPage, {}) }), _jsx(Route, { path: "/my-collection", element: _jsx(MyCollectionPage, {}) }), _jsx(Route, { path: "/strike-teams", element: _jsx(PublicStrikeTeamsPage, {}) }), _jsx(Route, { path: "/collections", element: _jsx(CollectionsPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminPage, {}) }), _jsx(Route, { path: "/content-management", element: _jsx(ContentManagementPage, {}) }), _jsx(Route, { path: "/unauthorized", element: _jsx(UnauthorizedPage, {}) }), _jsx(Route, { path: "/banned", element: _jsx(BannedPage, {}) })] }), showAvatarModal && (_jsx(Modal, { open: showAvatarModal, onClose: () => setShowAvatarModal(false), children: _jsx(AvatarManager, { onAvatarUpdate: () => setShowAvatarModal(false), onClose: () => setShowAvatarModal(false) }) })), _jsx(UserInvitationModal, { isOpen: showInvitationModal, onClose: () => setShowInvitationModal(false) })] }));
}
