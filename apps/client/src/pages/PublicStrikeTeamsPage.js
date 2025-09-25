import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import CharacterModal from '../components/CharacterModal';
const api = (path) => `http://localhost:3001${path}`;
export default function PublicStrikeTeamsPage() {
    // State
    const [strikeTeams, setStrikeTeams] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedTeams, setExpandedTeams] = useState(new Set());
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    // Load characters
    const loadCharacters = async () => {
        try {
            const response = await fetch(api('/api/characters'));
            const data = await response.json();
            // The /api/characters endpoint returns { ok: true, items: [...], total: 133 }
            if (data.ok && Array.isArray(data.items)) {
                setCharacters(data.items);
            }
            else if (Array.isArray(data)) {
                setCharacters(data);
            }
            else if (data.ok && Array.isArray(data.characters)) {
                setCharacters(data.characters);
            }
            else {
                console.error('Unexpected characters data structure:', data);
            }
        }
        catch (err) {
            console.error('Error loading characters:', err);
        }
    };
    // Load published strike teams
    const loadPublishedTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch(api('/api/shatterpoint/strike-teams/public'));
            const data = await response.json();
            if (data.ok) {
                setStrikeTeams(data.strikeTeams);
                setError(null);
            }
            else {
                setError(data.error || 'Failed to load strike teams');
            }
        }
        catch (err) {
            setError('Failed to load strike teams');
            console.error('Error loading published strike teams:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                loadCharacters(),
                loadPublishedTeams()
            ]);
        };
        loadData();
    }, []);
    // Helper function to get user display name
    const getUserDisplayName = (user) => {
        if (user.username)
            return user.username;
        if (user.name)
            return user.name;
        return 'Anonymous';
    };
    // Helper function to get user avatar
    const getUserAvatar = (user) => {
        return user.avatarUrl || user.image;
    };
    // Helper function to get user initials
    const getUserInitials = (user) => {
        const name = user.name || user.username || 'Anonymous';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    // Helper function to get character by ID
    const getCharacterById = (id) => {
        if (!characters || !Array.isArray(characters)) {
            return undefined;
        }
        return characters.find(c => c.id === id);
    };
    // Toggle team expansion
    const toggleTeamExpansion = (teamId) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            }
            else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };
    // Handle character click
    const handleCharacterClick = (character) => {
        setSelectedCharacter(character);
    };
    if (loading || !characters || characters.length === 0) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f9fafb'
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '16px' }, children: _jsx("span", { className: "sp sp-melee", style: { fontSize: '2rem', color: '#f97316' }, children: "o" }) }), _jsx("div", { children: "Loading published strike teams..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f9fafb',
                padding: '20px'
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '16px' }, children: "\u274C" }), _jsx("div", { style: { fontSize: '1.2rem', marginBottom: '8px' }, children: "Error" }), _jsx("div", { style: { color: '#ef4444' }, children: error }), _jsx("button", { onClick: loadPublishedTeams, style: {
                            marginTop: '16px',
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }, children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '40px 20px',
            color: '#f9fafb'
        }, children: [_jsxs("div", { style: {
                    maxWidth: '1200px',
                    margin: '0 auto',
                    fontFamily: '"Inter", sans-serif'
                }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '40px' }, children: [_jsx("h1", { style: {
                                    fontSize: '3rem',
                                    fontWeight: '800',
                                    marginBottom: '16px',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }, children: "Published Strike Teams" }), _jsx("p", { style: {
                                    fontSize: '1.2rem',
                                    color: '#9ca3af',
                                    maxWidth: '600px',
                                    margin: '0 auto'
                                }, children: "Discover strike teams shared by the community. Use them as inspiration or challenge them in battle!" })] }), strikeTeams.length === 0 ? (_jsxs("div", { style: {
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#9ca3af'
                        }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '16px' }, children: _jsx("span", { className: "sp sp-melee", style: { fontSize: '3rem', color: '#f97316' }, children: "o" }) }), _jsx("div", { style: { fontSize: '1.2rem', marginBottom: '8px' }, children: "No Published Teams Yet" }), _jsx("div", { children: "Be the first to publish your strike team!" })] })) : (_jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '24px'
                        }, children: strikeTeams.map((team) => {
                            // Sort characters by squad (order) first, then by role within each squad
                            const sortedCharacters = [...team.characters].sort((a, b) => {
                                // First sort by order (squad)
                                if (a.order !== b.order) {
                                    return a.order - b.order;
                                }
                                // Then sort by role within the same squad
                                const roleOrder = { 'PRIMARY': 0, 'SECONDARY': 1, 'SUPPORT': 2 };
                                return roleOrder[a.role] - roleOrder[b.role];
                            });
                            return (_jsxs("div", { style: {
                                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '1px solid #4b5563',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                                }, children: [_jsxs("div", { style: {
                                            marginBottom: '16px'
                                        }, children: [_jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '4px'
                                                }, children: [_jsx("h3", { style: {
                                                            fontSize: '1.2rem',
                                                            fontWeight: 'bold',
                                                            color: '#f9fafb',
                                                            lineHeight: '1.2',
                                                            margin: 0
                                                        }, children: team.name }), _jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            toggleTeamExpansion(team.id);
                                                        }, style: {
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#9ca3af',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }, onMouseEnter: (e) => {
                                                            e.currentTarget.style.background = '#374151';
                                                            e.currentTarget.style.color = '#f9fafb';
                                                        }, onMouseLeave: (e) => {
                                                            e.currentTarget.style.background = 'none';
                                                            e.currentTarget.style.color = '#9ca3af';
                                                        }, children: expandedTeams.has(team.id) ? '▼' : '▶' })] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '4px'
                                                }, children: [getUserAvatar(team.user) ? (_jsx("img", { src: getUserAvatar(team.user), alt: "Author avatar", style: {
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            border: '1px solid #4b5563'
                                                        }, onError: (e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                        } })) : null, _jsx("div", { style: {
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            background: '#3b82f6',
                                                            display: getUserAvatar(team.user) ? 'none' : 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '8px',
                                                            fontWeight: '600',
                                                            color: 'white'
                                                        }, children: getUserInitials(team.user) }), _jsxs("span", { style: {
                                                            fontSize: '12px',
                                                            color: '#9ca3af',
                                                            fontWeight: '500'
                                                        }, children: ["by ", getUserDisplayName(team.user)] })] })] }), expandedTeams.has(team.id) && (_jsxs(_Fragment, { children: [team.description && (_jsx("div", { style: {
                                                    marginBottom: '12px',
                                                    padding: '8px 12px',
                                                    background: '#111827',
                                                    borderRadius: '6px',
                                                    border: '1px solid #374151'
                                                }, children: _jsx("p", { style: {
                                                        color: '#9ca3af',
                                                        fontSize: '13px',
                                                        lineHeight: '1.4',
                                                        margin: 0
                                                    }, children: team.description }) })), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    gap: '12px',
                                                    marginBottom: '16px',
                                                    padding: '10px',
                                                    background: '#111827',
                                                    borderRadius: '6px',
                                                    fontSize: '12px'
                                                }, children: [_jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }, children: team.wins }), _jsx("div", { style: { color: '#9ca3af', fontSize: '10px' }, children: "Wins" })] }), _jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }, children: team.losses }), _jsx("div", { style: { color: '#9ca3af', fontSize: '10px' }, children: "Losses" })] }), _jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }, children: team.draws }), _jsx("div", { style: { color: '#9ca3af', fontSize: '10px' }, children: "Draws" })] }), _jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#d1d5db', fontWeight: 'bold', fontSize: '14px' }, children: team.characters.length }), _jsx("div", { style: { color: '#9ca3af', fontSize: '10px' }, children: "Units" })] })] }), _jsxs("div", { children: [_jsx("h4", { style: {
                                                            fontSize: '13px',
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
                                                                }, children: sortedCharacters.slice(0, 3).map((teamChar) => {
                                                                    const character = getCharacterById(teamChar.characterId);
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
                                                                                }, children: character?.name || teamChar.characterName || 'Unknown Character' })] }, teamChar.id));
                                                                }) })] }), sortedCharacters.length > 3 && (_jsxs("div", { children: [_jsx("div", { style: {
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#d1d5db',
                                                                    marginBottom: '6px',
                                                                    textAlign: 'center'
                                                                }, children: "Squad 2" }), _jsx("div", { style: {
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                                    gap: '8px'
                                                                }, children: sortedCharacters.slice(3, 6).map((teamChar) => {
                                                                    const character = getCharacterById(teamChar.characterId);
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
                                                                                }, children: character?.name || teamChar.characterName || 'Unknown Character' })] }, teamChar.id));
                                                                }) })] })), _jsxs("div", { style: {
                                                            marginTop: '12px',
                                                            paddingTop: '8px',
                                                            borderTop: '1px solid #374151',
                                                            fontSize: '11px',
                                                            color: '#6b7280',
                                                            textAlign: 'center'
                                                        }, children: ["Published ", new Date(team.updatedAt).toLocaleDateString()] })] })] }))] }, team.id));
                        }) }))] }), selectedCharacter && (_jsx(CharacterModal, { open: !!selectedCharacter, onClose: () => setSelectedCharacter(null), id: selectedCharacter.id, character: {
                    id: selectedCharacter.id,
                    name: selectedCharacter.name,
                    unit_type: selectedCharacter.role || "Primary",
                    squad_points: selectedCharacter.sp || selectedCharacter.pc || 0,
                    portrait: selectedCharacter.portrait
                } }))] }));
}
