import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const StrikeTeamVsStrikeTeamPage = () => {
    const [strikeTeams, setStrikeTeams] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam1, setSelectedTeam1] = useState(null);
    const [selectedTeam2, setSelectedTeam2] = useState(null);
    const [showPublic, setShowPublic] = useState(false);
    const [showVSAnimation, setShowVSAnimation] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                loadCurrentUser(),
                loadStrikeTeams(),
                loadCharacters()
            ]);
        };
        loadData();
    }, []);
    const loadCurrentUser = async () => {
        try {
            const response = await fetch('/auth/status', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUserId(data.user?.id || null);
            }
        }
        catch (error) {
            console.error('Error loading current user:', error);
        }
    };
    const loadStrikeTeams = async () => {
        try {
            let allTeams = [];
            // Load user's own teams (private + public)
            const userResponse = await fetch('/api/shatterpoint/strike-teams', {
                credentials: 'include'
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                allTeams = [...allTeams, ...(userData.strikeTeams || [])];
            }
            // Load all public teams (from all users)
            const publicResponse = await fetch('/api/shatterpoint/strike-teams/public', {
                credentials: 'include'
            });
            if (publicResponse.ok) {
                const publicData = await publicResponse.json();
                // Only add public teams that are not already in user's teams (avoid duplicates)
                const userTeamIds = new Set(allTeams.map(team => team.id));
                const newPublicTeams = (publicData.strikeTeams || []).filter((team) => !userTeamIds.has(team.id));
                allTeams = [...allTeams, ...newPublicTeams];
            }
            setStrikeTeams(allTeams);
        }
        catch (error) {
            console.error('Error loading strike teams:', error);
        }
    };
    const loadCharacters = async () => {
        try {
            const response = await fetch('/api/characters', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCharacters(data.items || []);
            }
        }
        catch (error) {
            console.error('Error loading characters:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleTeamSelect = (team, teamNumber) => {
        if (teamNumber === 1) {
            setSelectedTeam1(team);
        }
        else {
            setSelectedTeam2(team);
        }
    };
    const handleStartBattle = () => {
        console.log('handleStartBattle called:', {
            selectedTeam1: selectedTeam1 ? { id: selectedTeam1.id, name: selectedTeam1.name } : null,
            selectedTeam2: selectedTeam2 ? { id: selectedTeam2.id, name: selectedTeam2.name } : null
        });
        if (selectedTeam1 && selectedTeam2) {
            console.log('Starting battle with teams:', { team1Id: selectedTeam1.id, team2Id: selectedTeam2.id });
            setShowVSAnimation(true);
            // Store team IDs to avoid closure issues
            const team1Id = selectedTeam1.id;
            const team2Id = selectedTeam2.id;
            // Navigate to battle page with selected teams after animation
            setTimeout(() => {
                const battleUrl = `/play/battle?team1=${team1Id}&team2=${team2Id}`;
                console.log('Navigating to:', battleUrl);
                navigate(battleUrl);
            }, 3000);
        }
        else {
            console.log('Cannot start battle - missing teams:', {
                selectedTeam1: selectedTeam1 ? selectedTeam1.name : 'null',
                selectedTeam2: selectedTeam2 ? selectedTeam2.name : 'null'
            });
            alert('Proszę wybrać oba zespoły przed rozpoczęciem walki.');
        }
    };
    // Filter teams based on showPublic and security
    const filteredTeams = showPublic
        ? strikeTeams.filter(team => team.isPublished) // Only published teams from all users
        : strikeTeams.filter(team => !team.isPublished && team.user && currentUserId && team.user.id === currentUserId // Only current user's private teams
        );
    // Helper function to find character by ID
    const findCharacter = (characterId) => {
        return characters.find(char => char.id === characterId);
    };
    // Helper function to get characters for a team organized by role
    const getTeamCharacters = (team) => {
        const primaryChars = team.characters.filter(char => char.role === 'PRIMARY').map(char => findCharacter(char.characterId)).filter(Boolean);
        const secondaryChars = team.characters.filter(char => char.role === 'SECONDARY').map(char => findCharacter(char.characterId)).filter(Boolean);
        const supportChars = team.characters.filter(char => char.role === 'SUPPORT').map(char => findCharacter(char.characterId)).filter(Boolean);
        return { primaryChars, secondaryChars, supportChars };
    };
    // VS Animation Component
    const VSAnimation = () => {
        if (!showVSAnimation || !selectedTeam1 || !selectedTeam2)
            return null;
        const team1Chars = getTeamCharacters(selectedTeam1);
        const team2Chars = getTeamCharacters(selectedTeam2);
        return (_jsxs("div", { style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                overflow: 'hidden'
            }, children: [_jsxs("div", { style: {
                        position: 'absolute',
                        left: '-300px',
                        animation: 'team1SlideIn 1.5s ease-out forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'center'
                            }, children: [_jsx("div", { style: { display: 'flex', gap: '8px' }, children: team1Chars.primaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/60/80", alt: char?.name, style: {
                                            width: '60px',
                                            height: '80px',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            background: '#4b5563',
                                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                                        } }, index))) }), _jsx("div", { style: { display: 'flex', gap: '6px' }, children: team1Chars.secondaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/50/65", alt: char?.name, style: {
                                            width: '50px',
                                            height: '65px',
                                            objectFit: 'contain',
                                            borderRadius: '6px',
                                            background: '#4b5563',
                                            boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)'
                                        } }, index))) }), _jsx("div", { style: { display: 'flex', gap: '6px' }, children: team1Chars.supportChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/50/65", alt: char?.name, style: {
                                            width: '50px',
                                            height: '65px',
                                            objectFit: 'contain',
                                            borderRadius: '6px',
                                            background: '#4b5563',
                                            boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)'
                                        } }, index))) })] }), _jsx("div", { style: {
                                background: 'rgba(59, 130, 246, 0.9)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                textAlign: 'center'
                            }, children: selectedTeam1.name })] }), _jsxs("div", { style: {
                        position: 'absolute',
                        right: '-300px',
                        animation: 'team2SlideIn 1.5s ease-out forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'center'
                            }, children: [_jsx("div", { style: { display: 'flex', gap: '8px' }, children: team2Chars.primaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/60/80", alt: char?.name, style: {
                                            width: '60px',
                                            height: '80px',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            background: '#4b5563',
                                            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                                        } }, index))) }), _jsx("div", { style: { display: 'flex', gap: '6px' }, children: team2Chars.secondaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/50/65", alt: char?.name, style: {
                                            width: '50px',
                                            height: '65px',
                                            objectFit: 'contain',
                                            borderRadius: '6px',
                                            background: '#4b5563',
                                            boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)'
                                        } }, index))) }), _jsx("div", { style: { display: 'flex', gap: '6px' }, children: team2Chars.supportChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/50/65", alt: char?.name, style: {
                                            width: '50px',
                                            height: '65px',
                                            objectFit: 'contain',
                                            borderRadius: '6px',
                                            background: '#4b5563',
                                            boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)'
                                        } }, index))) })] }), _jsx("div", { style: {
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                textAlign: 'center'
                            }, children: selectedTeam2.name })] }), _jsx("div", { style: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'vsAppear 2s ease-out forwards',
                        opacity: 0,
                        transform: 'translate(-50%, -50%) scale(0)'
                    }, children: _jsx("div", { style: {
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#0f172a',
                            padding: '24px 48px',
                            borderRadius: '20px',
                            fontSize: '48px',
                            fontWeight: '900',
                            textAlign: 'center',
                            boxShadow: '0 12px 48px rgba(251, 191, 36, 0.5)',
                            border: '4px solid #f59e0b',
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                            minWidth: '120px',
                            minHeight: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }, children: "VS" }) }), _jsx("div", { style: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'sparks 1s ease-out 1.5s forwards',
                        opacity: 0
                    }, children: _jsx("div", { style: {
                            width: '100px',
                            height: '100px',
                            background: 'radial-gradient(circle, #fbbf24, transparent)',
                            borderRadius: '50%',
                            filter: 'blur(2px)'
                        } }) }), _jsx("style", { dangerouslySetInnerHTML: {
                        __html: `
            @keyframes team1SlideIn {
              0% { left: -300px; opacity: 0; }
              50% { left: 15%; opacity: 1; }
              100% { left: 15%; opacity: 1; }
            }
            
            @keyframes team2SlideIn {
              0% { right: -300px; opacity: 0; }
              50% { right: 15%; opacity: 1; }
              100% { right: 15%; opacity: 1; }
            }
            
            @keyframes vsAppear {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes sparks {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
            }
          `
                    } })] }));
    };
    if (loading) {
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                color: '#f9fafb'
            }, children: "Loading strike teams..." }));
    }
    return (_jsxs("div", { style: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            color: '#f9fafb'
        }, children: [_jsx(VSAnimation, {}), _jsxs("div", { style: {
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid #4b5563'
                }, children: [_jsx("h1", { style: {
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#f9fafb',
                            margin: '0 0 8px 0',
                            textAlign: 'center'
                        }, children: "\uD83C\uDFAF Strike Team vs Strike Team" }), _jsx("p", { style: {
                            fontSize: '18px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            margin: '0 0 32px 0'
                        }, children: "Select two strike teams to battle" }), _jsxs("div", { style: {
                            display: 'flex',
                            gap: '16px',
                            marginBottom: '24px',
                            justifyContent: 'center'
                        }, children: [_jsxs("div", { style: {
                                    background: '#1f2937',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: selectedTeam1 ? '2px solid #3b82f6' : '2px solid #374151',
                                    minWidth: '320px'
                                }, children: [_jsx("h3", { style: {
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            margin: '0 0 12px 0',
                                            textAlign: 'center'
                                        }, children: selectedTeam1 ? selectedTeam1.name : 'Team 1' }), selectedTeam1 ? (_jsxs("div", { style: {
                                            background: '#374151',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center'
                                        }, children: [(() => {
                                                const teamChars = getTeamCharacters(selectedTeam1);
                                                return (_jsxs("div", { style: { marginBottom: '12px' }, children: [teamChars.primaryChars.length > 0 && (_jsx("div", { style: { display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }, children: teamChars.primaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/40/50", alt: char?.name, style: {
                                                                    width: '40px',
                                                                    height: '50px',
                                                                    objectFit: 'contain',
                                                                    borderRadius: '4px',
                                                                    background: '#1f2937',
                                                                    border: '1px solid #3b82f6'
                                                                } }, index))) })), (teamChars.secondaryChars.length > 0 || teamChars.supportChars.length > 0) && (_jsx("div", { style: { display: 'flex', gap: '3px', justifyContent: 'center' }, children: [...teamChars.secondaryChars, ...teamChars.supportChars].map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/30/40", alt: char?.name, style: {
                                                                    width: '30px',
                                                                    height: '40px',
                                                                    objectFit: 'contain',
                                                                    borderRadius: '3px',
                                                                    background: '#1f2937',
                                                                    border: '1px solid #8b5cf6'
                                                                } }, index))) }))] }));
                                            })(), _jsxs("p", { style: { color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }, children: [selectedTeam1.characters.length, " characters"] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    gap: '6px',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    color: '#6b7280',
                                                    marginBottom: '8px'
                                                }, children: [_jsxs("span", { children: ["W: ", selectedTeam1.wins] }), _jsxs("span", { children: ["L: ", selectedTeam1.losses] }), _jsxs("span", { children: ["D: ", selectedTeam1.draws] })] }), _jsx("button", { onClick: () => setSelectedTeam1(null), style: {
                                                    padding: '4px 8px',
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                }, children: "Change" })] })) : (_jsx("div", { style: {
                                            background: '#374151',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            color: '#9ca3af',
                                            fontSize: '14px'
                                        }, children: "Select a team" }))] }), _jsxs("div", { style: {
                                    background: '#1f2937',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: selectedTeam2 ? '2px solid #ef4444' : '2px solid #374151',
                                    minWidth: '320px'
                                }, children: [_jsx("h3", { style: {
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            margin: '0 0 12px 0',
                                            textAlign: 'center'
                                        }, children: selectedTeam2 ? selectedTeam2.name : 'Team 2' }), selectedTeam2 ? (_jsxs("div", { style: {
                                            background: '#374151',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center'
                                        }, children: [(() => {
                                                const teamChars = getTeamCharacters(selectedTeam2);
                                                return (_jsxs("div", { style: { marginBottom: '12px' }, children: [teamChars.primaryChars.length > 0 && (_jsx("div", { style: { display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }, children: teamChars.primaryChars.map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/40/50", alt: char?.name, style: {
                                                                    width: '40px',
                                                                    height: '50px',
                                                                    objectFit: 'contain',
                                                                    borderRadius: '4px',
                                                                    background: '#1f2937',
                                                                    border: '1px solid #ef4444'
                                                                } }, index))) })), (teamChars.secondaryChars.length > 0 || teamChars.supportChars.length > 0) && (_jsx("div", { style: { display: 'flex', gap: '3px', justifyContent: 'center' }, children: [...teamChars.secondaryChars, ...teamChars.supportChars].map((char, index) => (_jsx("img", { src: char?.portrait || "https://picsum.photos/seed/placeholder/30/40", alt: char?.name, style: {
                                                                    width: '30px',
                                                                    height: '40px',
                                                                    objectFit: 'contain',
                                                                    borderRadius: '3px',
                                                                    background: '#1f2937',
                                                                    border: '1px solid #f59e0b'
                                                                } }, index))) }))] }));
                                            })(), _jsxs("p", { style: { color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }, children: [selectedTeam2.characters.length, " characters"] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    gap: '6px',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    color: '#6b7280',
                                                    marginBottom: '8px'
                                                }, children: [_jsxs("span", { children: ["W: ", selectedTeam2.wins] }), _jsxs("span", { children: ["L: ", selectedTeam2.losses] }), _jsxs("span", { children: ["D: ", selectedTeam2.draws] })] }), _jsx("button", { onClick: () => setSelectedTeam2(null), style: {
                                                    padding: '4px 8px',
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                }, children: "Change" })] })) : (_jsx("div", { style: {
                                            background: '#374151',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            color: '#9ca3af',
                                            fontSize: '14px'
                                        }, children: "Select a team" }))] })] }), selectedTeam1 && selectedTeam2 && (_jsx("div", { style: { textAlign: 'center', marginBottom: '32px' }, children: _jsx("button", { onClick: handleStartBattle, style: {
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }, children: "\uD83C\uDFAF Start Battle" }) })), _jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '12px',
                            marginBottom: '24px'
                        }, children: [_jsx("button", { onClick: () => setShowPublic(true), style: {
                                    padding: '8px 16px',
                                    background: showPublic ? '#3b82f6' : '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }, children: "Public Teams" }), _jsx("button", { onClick: () => setShowPublic(false), style: {
                                    padding: '8px 16px',
                                    background: !showPublic ? '#3b82f6' : '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }, children: "My Teams" })] }), _jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px',
                            marginBottom: '32px'
                        }, children: filteredTeams.map((team) => (_jsxs("div", { onClick: () => {
                                if (!selectedTeam1) {
                                    handleTeamSelect(team, 1);
                                }
                                else if (!selectedTeam2) {
                                    handleTeamSelect(team, 2);
                                }
                            }, style: {
                                background: '#1f2937',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '2px solid #374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (selectedTeam1 && selectedTeam2) ? 0.5 : 1
                            }, onMouseEnter: (e) => {
                                if (!selectedTeam1 || !selectedTeam2) {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.background = '#374151';
                                }
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.borderColor = '#374151';
                                e.currentTarget.style.background = '#1f2937';
                            }, children: [_jsx("h4", { style: {
                                        color: '#f9fafb',
                                        margin: '0 0 8px 0',
                                        fontSize: '16px'
                                    }, children: team.name }), _jsxs("div", { style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        marginBottom: '8px'
                                    }, children: [_jsx("div", { style: {
                                                display: 'flex',
                                                gap: '4px',
                                                justifyContent: 'center'
                                            }, children: team.characters.filter(char => char.role === 'PRIMARY').map((teamChar, index) => {
                                                const character = findCharacter(teamChar.characterId);
                                                return (_jsx("img", { src: character?.portrait || "https://picsum.photos/seed/placeholder/80/100", alt: character?.name || 'Unknown', style: {
                                                        width: '80px',
                                                        height: '100px',
                                                        objectFit: 'contain',
                                                        borderRadius: '4px',
                                                        background: '#374151',
                                                        border: '2px solid #3b82f6' // Blue border for Primary
                                                    }, title: `Primary: ${character?.name || 'Unknown'}` }, `primary-${index}`));
                                            }) }), _jsxs("div", { style: {
                                                display: 'flex',
                                                gap: '3px',
                                                justifyContent: 'center'
                                            }, children: [team.characters.filter(char => char.role === 'SECONDARY').map((teamChar, index) => {
                                                    const character = findCharacter(teamChar.characterId);
                                                    return (_jsx("img", { src: character?.portrait || "https://picsum.photos/seed/placeholder/70/90", alt: character?.name || 'Unknown', style: {
                                                            width: '70px',
                                                            height: '90px',
                                                            objectFit: 'contain',
                                                            borderRadius: '4px',
                                                            background: '#374151',
                                                            border: '1px solid #8b5cf6' // Purple border for Secondary
                                                        }, title: `Secondary: ${character?.name || 'Unknown'}` }, `secondary-${index}`));
                                                }), team.characters.filter(char => char.role === 'SUPPORT').map((teamChar, index) => {
                                                    const character = findCharacter(teamChar.characterId);
                                                    return (_jsx("img", { src: character?.portrait || "https://picsum.photos/seed/placeholder/70/90", alt: character?.name || 'Unknown', style: {
                                                            width: '70px',
                                                            height: '90px',
                                                            objectFit: 'contain',
                                                            borderRadius: '4px',
                                                            background: '#374151',
                                                            border: '1px solid #10b981' // Green border for Support
                                                        }, title: `Support: ${character?.name || 'Unknown'}` }, `support-${index}`));
                                                })] })] }), _jsxs("p", { style: {
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        margin: '0 0 12px 0'
                                    }, children: [team.characters.length, " characters"] }), _jsxs("div", { style: {
                                        display: 'flex',
                                        gap: '12px',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginBottom: '8px'
                                    }, children: [_jsxs("span", { children: ["W: ", team.wins] }), _jsxs("span", { children: ["L: ", team.losses] }), _jsxs("span", { children: ["D: ", team.draws] })] }), _jsx("div", { style: {
                                        fontSize: '12px',
                                        color: team.isPublished ? '#10b981' : '#f59e0b'
                                    }, children: team.isPublished ? '🌐 Public' : '🔒 Private' })] }, team.id))) }), _jsx("div", { style: { textAlign: 'center', marginTop: '24px' }, children: _jsx("button", { onClick: () => navigate('/play'), style: {
                                padding: '8px 16px',
                                background: '#374151',
                                color: '#f9fafb',
                                border: '1px solid #4b5563',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }, children: "\u2190 Back to Play" }) })] })] }));
};
export default StrikeTeamVsStrikeTeamPage;
