import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const HeroVsHeroPage = () => {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHero1, setSelectedHero1] = useState(null);
    const [selectedHero2, setSelectedHero2] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFaction, setSelectedFaction] = useState('');
    const [showVSAnimation, setShowVSAnimation] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        loadCharacters();
    }, []);
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
    const handleHeroSelect = (character, heroNumber) => {
        if (heroNumber === 1) {
            setSelectedHero1(character);
        }
        else {
            setSelectedHero2(character);
        }
    };
    const handleStartBattle = () => {
        if (selectedHero1 && selectedHero2) {
            // Uruchom animację VS
            setShowVSAnimation(true);
            // Po 3 sekundach przejdź do battle page
            setTimeout(() => {
                navigate(`/play/battle?hero1=${selectedHero1.id}&hero2=${selectedHero2.id}`);
            }, 3000);
        }
    };
    const filteredCharacters = characters.filter(char => {
        const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.faction?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !selectedFaction || char.faction === selectedFaction;
        return matchesSearch && matchesFaction;
    });
    const factions = [...new Set(characters.map(c => c.faction).filter(Boolean))];
    // Komponent animacji VS
    const VSAnimation = () => {
        if (!showVSAnimation || !selectedHero1 || !selectedHero2)
            return null;
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
                        left: '-200px',
                        animation: 'hero1SlideIn 1.5s ease-out forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }, children: [_jsx("img", { src: selectedHero1.portrait || "https://picsum.photos/seed/placeholder/100/130", alt: selectedHero1.name, style: {
                                width: '200px',
                                height: '260px',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: '12px',
                                background: '#4b5563',
                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                            } }), _jsx("div", { style: {
                                background: 'rgba(59, 130, 246, 0.9)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                textAlign: 'center'
                            }, children: selectedHero1.name })] }), _jsxs("div", { style: {
                        position: 'absolute',
                        right: '-200px',
                        animation: 'hero2SlideIn 1.5s ease-out forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }, children: [_jsx("img", { src: selectedHero2.portrait || "https://picsum.photos/seed/placeholder/100/130", alt: selectedHero2.name, style: {
                                width: '200px',
                                height: '260px',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: '12px',
                                background: '#4b5563',
                                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                            } }), _jsx("div", { style: {
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                textAlign: 'center'
                            }, children: selectedHero2.name })] }), _jsx("div", { style: {
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
            @keyframes hero1SlideIn {
              0% { left: -200px; opacity: 0; }
              50% { left: 20%; opacity: 1; }
              100% { left: 20%; opacity: 1; }
            }
            
            @keyframes hero2SlideIn {
              0% { right: -200px; opacity: 0; }
              50% { right: 20%; opacity: 1; }
              100% { right: 20%; opacity: 1; }
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
            }, children: "Loading characters..." }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(VSAnimation, {}), _jsx("div", { style: {
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '20px',
                    color: '#f9fafb'
                }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #4b5563'
                    }, children: [_jsxs("h1", { style: {
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#f9fafb',
                                margin: '0 0 8px 0',
                                textAlign: 'center'
                            }, children: [_jsx("span", { className: "sp sp-melee", style: { fontSize: '32px', color: '#f97316' }, children: "o" }), " Hero vs Hero"] }), _jsx("p", { style: {
                                fontSize: '18px',
                                color: '#9ca3af',
                                textAlign: 'center',
                                margin: '0 0 32px 0'
                            }, children: "Select two characters to battle" }), _jsxs("div", { style: {
                                display: 'flex',
                                gap: '16px',
                                marginBottom: '24px',
                                justifyContent: 'center'
                            }, children: [_jsxs("div", { style: {
                                        background: '#1f2937',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: selectedHero1 ? '2px solid #3b82f6' : '2px solid #374151',
                                        minWidth: '320px'
                                    }, children: [_jsx("h3", { style: {
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#f9fafb',
                                                margin: '0 0 12px 0',
                                                textAlign: 'center'
                                            }, children: selectedHero1 ? selectedHero1.name : 'Hero 1' }), selectedHero1 ? (_jsxs("div", { style: {
                                                background: '#374151',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                textAlign: 'center'
                                            }, children: [_jsx("img", { src: selectedHero1.portrait || "https://picsum.photos/seed/placeholder/100/130", alt: selectedHero1.name, style: {
                                                        width: '132px',
                                                        height: '172px',
                                                        objectFit: 'contain',
                                                        objectPosition: 'center',
                                                        borderRadius: '6px',
                                                        margin: '0 auto 8px auto',
                                                        display: 'block',
                                                        background: '#4b5563'
                                                    } }), _jsxs("p", { style: { color: '#9ca3af', fontSize: '12px', margin: '0 0 6px 0' }, children: [selectedHero1.role, " \u2022 ", selectedHero1.faction] }), _jsxs("div", { style: {
                                                        display: 'flex',
                                                        gap: '6px',
                                                        justifyContent: 'center',
                                                        fontSize: '11px',
                                                        color: '#6b7280',
                                                        marginBottom: '8px'
                                                    }, children: [selectedHero1.sp && _jsxs("span", { children: ["SP: ", selectedHero1.sp] }), selectedHero1.pc && _jsxs("span", { children: ["PC: ", selectedHero1.pc] }), selectedHero1.force && _jsxs("span", { children: ["Force: ", selectedHero1.force] })] }), _jsx("button", { onClick: () => setSelectedHero1(null), style: {
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
                                            }, children: "Select a hero" }))] }), _jsxs("div", { style: {
                                        background: '#1f2937',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: selectedHero2 ? '2px solid #ef4444' : '2px solid #374151',
                                        minWidth: '320px'
                                    }, children: [_jsx("h3", { style: {
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#f9fafb',
                                                margin: '0 0 12px 0',
                                                textAlign: 'center'
                                            }, children: selectedHero2 ? selectedHero2.name : 'Hero 2' }), selectedHero2 ? (_jsxs("div", { style: {
                                                background: '#374151',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                textAlign: 'center'
                                            }, children: [_jsx("img", { src: selectedHero2.portrait || "https://picsum.photos/seed/placeholder/100/130", alt: selectedHero2.name, style: {
                                                        width: '132px',
                                                        height: '172px',
                                                        objectFit: 'contain',
                                                        objectPosition: 'center',
                                                        borderRadius: '6px',
                                                        margin: '0 auto 8px auto',
                                                        display: 'block',
                                                        background: '#4b5563'
                                                    } }), _jsxs("p", { style: { color: '#9ca3af', fontSize: '12px', margin: '0 0 6px 0' }, children: [selectedHero2.role, " \u2022 ", selectedHero2.faction] }), _jsxs("div", { style: {
                                                        display: 'flex',
                                                        gap: '6px',
                                                        justifyContent: 'center',
                                                        fontSize: '11px',
                                                        color: '#6b7280',
                                                        marginBottom: '8px'
                                                    }, children: [selectedHero2.sp && _jsxs("span", { children: ["SP: ", selectedHero2.sp] }), selectedHero2.pc && _jsxs("span", { children: ["PC: ", selectedHero2.pc] }), selectedHero2.force && _jsxs("span", { children: ["Force: ", selectedHero2.force] })] }), _jsx("button", { onClick: () => setSelectedHero2(null), style: {
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
                                            }, children: "Select a hero" }))] })] }), selectedHero1 && selectedHero2 && (_jsx("div", { style: { textAlign: 'center', marginBottom: '32px' }, children: _jsxs("button", { onClick: handleStartBattle, style: {
                                    padding: '16px 32px',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                }, children: [_jsx("span", { className: "sp sp-melee", style: { fontSize: '16px', color: '#ffffff' }, children: "o" }), " Start Battle"] }) })), _jsxs("div", { style: {
                                display: 'flex',
                                gap: '16px',
                                marginBottom: '24px',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }, children: [_jsx("input", { type: "text", placeholder: "Search characters...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                                        padding: '8px 12px',
                                        background: '#374151',
                                        color: '#f9fafb',
                                        border: '1px solid #4b5563',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        minWidth: '280px'
                                    } }), _jsxs("select", { value: selectedFaction, onChange: (e) => setSelectedFaction(e.target.value), style: {
                                        padding: '8px 12px',
                                        background: '#374151',
                                        color: '#f9fafb',
                                        border: '1px solid #4b5563',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }, children: [_jsx("option", { value: "", children: "All Factions" }), factions.map(faction => (_jsx("option", { value: faction, children: faction }, faction)))] })] }), _jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '16px',
                                marginBottom: '32px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }, children: filteredCharacters.map((character) => (_jsxs("div", { onClick: () => {
                                    if (!selectedHero1) {
                                        handleHeroSelect(character, 1);
                                    }
                                    else if (!selectedHero2) {
                                        handleHeroSelect(character, 2);
                                    }
                                }, style: {
                                    background: '#1f2937',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    border: '2px solid #374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: (selectedHero1 && selectedHero2) ? 0.5 : 1
                                }, onMouseEnter: (e) => {
                                    if (!selectedHero1 || !selectedHero2) {
                                        e.currentTarget.style.borderColor = '#3b82f6';
                                        e.currentTarget.style.background = '#374151';
                                    }
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.borderColor = '#374151';
                                    e.currentTarget.style.background = '#1f2937';
                                }, children: [_jsx("img", { src: character.portrait || "https://picsum.photos/seed/placeholder/150/195", alt: character.name, style: {
                                            width: '100%',
                                            height: '160px',
                                            objectFit: 'contain',
                                            objectPosition: 'center',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            background: '#374151'
                                        } }), _jsx("h4", { style: {
                                            color: '#f9fafb',
                                            margin: '0 0 4px 0',
                                            fontSize: '14px',
                                            lineHeight: '1.3'
                                        }, children: character.name }), _jsxs("p", { style: {
                                            color: '#9ca3af',
                                            fontSize: '12px',
                                            margin: '0 0 4px 0'
                                        }, children: [character.role, " \u2022 ", character.faction] }), _jsxs("div", { style: {
                                            fontSize: '11px',
                                            color: '#6b7280'
                                        }, children: [character.sp && `SP: ${character.sp}`, character.pc && `PC: ${character.pc}`, character.force && `Force: ${character.force}`] })] }, character.id))) }), _jsx("div", { style: { textAlign: 'center', marginTop: '24px' }, children: _jsx("button", { onClick: () => navigate('/play'), style: {
                                    padding: '8px 16px',
                                    background: '#374151',
                                    color: '#f9fafb',
                                    border: '1px solid #4b5563',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }, children: "\u2190 Back to Play" }) })] }) })] }));
};
export default HeroVsHeroPage;
