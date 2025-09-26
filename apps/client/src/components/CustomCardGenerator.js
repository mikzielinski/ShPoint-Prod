import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CharacterEditor } from './editors/CharacterEditor';
import { api } from '../lib/env';
export default function CustomCardGenerator({ onClose, onSave }) {
    console.log('CustomCardGenerator component rendering...');
    const { auth } = useAuth();
    const me = auth.status === 'authenticated' ? auth.user : null;
    const [showEditor, setShowEditor] = useState(false);
    const [customCards, setCustomCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    // Load user's custom cards
    useEffect(() => {
        if (me) {
            loadCustomCards();
        }
    }, [me]);
    const loadCustomCards = async () => {
        if (!me)
            return;
        setLoading(true);
        try {
            const response = await fetch(api('/api/custom-cards'), {
                credentials: 'include'
            });
            if (response.ok) {
                const cards = await response.json();
                setCustomCards(cards);
            }
        }
        catch (error) {
            console.error('Error loading custom cards:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateNew = () => {
        setEditingCard(null);
        setShowEditor(true);
    };
    const handleEditCard = (card) => {
        setEditingCard(card);
        setShowEditor(true);
    };
    const handleSaveCard = async (characterData) => {
        if (!me)
            return;
        try {
            const customCard = {
                id: characterData.id || `custom-${Date.now()}`,
                name: characterData.name,
                description: characterData.characterNames || '',
                faction: characterData.factions?.[0] || 'Custom',
                unitType: characterData.unit_type,
                squadPoints: characterData.squad_points || characterData.point_cost || 0,
                stamina: characterData.stamina || 0,
                durability: characterData.durability || 0,
                force: characterData.force || 0,
                hanker: 0, // Default value
                abilities: characterData.structuredAbilities || [],
                stances: [], // Will be handled separately
                portrait: characterData.portrait || '',
                status: 'DRAFT',
                isPublic: false,
                authorId: me.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const response = await fetch(api('/api/custom-cards'), {
                method: editingCard ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(customCard)
            });
            if (response.ok) {
                const savedCard = await response.json();
                setCustomCards(prev => {
                    if (editingCard) {
                        return prev.map(card => card.id === editingCard.id ? savedCard : card);
                    }
                    else {
                        return [...prev, savedCard];
                    }
                });
                setShowEditor(false);
                setEditingCard(null);
                if (onSave) {
                    onSave(savedCard);
                }
            }
            else {
                const errorData = await response.json();
                alert(`Failed to save custom card: ${errorData.error || 'Unknown error'}`);
            }
        }
        catch (error) {
            console.error('Error saving custom card:', error);
            alert(`Failed to save custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const handleDeleteCard = async (cardId) => {
        if (!window.confirm('Are you sure you want to delete this custom card?')) {
            return;
        }
        try {
            const response = await fetch(`/api/custom-cards/${cardId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setCustomCards(prev => prev.filter(card => card.id !== cardId));
            }
            else {
                const errorData = await response.json();
                alert(`Failed to delete custom card: ${errorData.error || 'Unknown error'}`);
            }
        }
        catch (error) {
            console.error('Error deleting custom card:', error);
            alert(`Failed to delete custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const handlePublishCard = async (card) => {
        try {
            const response = await fetch(`/api/custom-cards/${card.id}/publish`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                const updatedCard = await response.json();
                setCustomCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
            }
            else {
                const errorData = await response.json();
                alert(`Failed to publish custom card: ${errorData.error || 'Unknown error'}`);
            }
        }
        catch (error) {
            console.error('Error publishing custom card:', error);
            alert(`Failed to publish custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    if (!me) {
        return (_jsx("div", { style: { padding: '24px', textAlign: 'center' }, children: _jsx("p", { style: { color: '#ef4444' }, children: "Please log in to create custom cards" }) }));
    }
    if (showEditor) {
        return (_jsx("div", { style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 10000,
                overflow: 'auto'
            }, children: _jsxs("div", { style: {
                    position: 'relative',
                    background: '#111827',
                    minHeight: '100vh'
                }, children: [_jsxs("div", { style: {
                            position: 'sticky',
                            top: 0,
                            background: '#111827',
                            borderBottom: '1px solid #374151',
                            padding: '16px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 10001
                        }, children: [_jsx("h2", { style: {
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#f9fafb',
                                    margin: 0
                                }, children: editingCard ? 'Edit Custom Card' : 'Create Custom Card' }), _jsxs("button", { onClick: () => {
                                    setShowEditor(false);
                                    setEditingCard(null);
                                }, style: {
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }, children: [_jsx("span", { style: { fontSize: '16px' }, children: "\u00D7" }), "Close"] })] }), _jsx(CharacterEditor, { character: editingCard ? {
                            id: editingCard.id,
                            name: editingCard.name,
                            characterNames: editingCard.description,
                            boxSetCode: '',
                            portrait: editingCard.portrait,
                            squad_points: editingCard.squadPoints,
                            point_cost: editingCard.unitType !== 'Primary' ? editingCard.squadPoints : 0,
                            force: editingCard.force || 0,
                            unit_type: editingCard.unitType,
                            stamina: editingCard.stamina,
                            durability: editingCard.durability,
                            number_of_characters: 1,
                            factions: [editingCard.faction],
                            period: [],
                            abilities: editingCard.abilities || [],
                            structuredAbilities: editingCard.abilities || []
                        } : null, onSave: handleSaveCard, onCancel: () => {
                            setShowEditor(false);
                            setEditingCard(null);
                        } })] }) }));
    }
    return (_jsxs("div", { style: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px',
            background: '#111827',
            color: '#f9fafb',
            minHeight: '100vh'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px'
                }, children: [_jsxs("div", { children: [_jsx("h1", { style: {
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    color: '#f9fafb',
                                    margin: '0 0 8px 0'
                                }, children: "Custom Made Cards" }), _jsx("p", { style: {
                                    fontSize: '16px',
                                    color: '#9ca3af',
                                    margin: 0
                                }, children: "Create and manage your own custom character cards" })] }), _jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsxs("button", { onClick: handleCreateNew, style: {
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }, children: [_jsx("span", { style: { fontSize: '18px' }, children: "+" }), "Create New Card"] }), _jsx("button", { onClick: onClose, style: {
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 114, 128, 0.3)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }, children: "Close" })] })] }), loading ? (_jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px',
                    color: '#9ca3af'
                }, children: "Loading your custom cards..." })) : customCards.length === 0 ? (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '48px',
                    background: '#1f2937',
                    borderRadius: '12px',
                    border: '2px dashed #374151'
                }, children: [_jsx("div", { style: {
                            fontSize: '48px',
                            marginBottom: '16px',
                            color: '#6b7280'
                        }, children: "\uD83C\uDFA8" }), _jsx("h3", { style: {
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '8px'
                        }, children: "No Custom Cards Yet" }), _jsx("p", { style: {
                            fontSize: '16px',
                            color: '#9ca3af',
                            marginBottom: '24px'
                        }, children: "Create your first custom character card to get started" }), _jsx("button", { onClick: handleCreateNew, style: {
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }, children: "Create Your First Card" })] })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }, children: customCards.map((card) => (_jsxs("div", { style: {
                        background: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }, children: [_jsxs("div", { style: {
                                background: 'linear-gradient(135deg, #374151, #1f2937)',
                                padding: '16px',
                                borderBottom: '1px solid #374151'
                            }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px'
                                    }, children: [_jsx("h3", { style: {
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: '#f9fafb',
                                                margin: 0,
                                                flex: 1
                                            }, children: card.name }), _jsx("div", { style: {
                                                padding: '4px 8px',
                                                background: card.status === 'PUBLISHED' ? '#10b981' :
                                                    card.status === 'SHARED' ? '#3b82f6' : '#6b7280',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: 'white',
                                                textTransform: 'uppercase'
                                            }, children: card.status })] }), _jsx("p", { style: {
                                        fontSize: '14px',
                                        color: '#9ca3af',
                                        margin: 0
                                    }, children: card.description || 'No description' })] }), _jsxs("div", { style: { padding: '16px' }, children: [card.portrait && (_jsx("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginBottom: '16px'
                                    }, children: _jsx("img", { src: card.portrait, alt: card.name, style: {
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            border: '2px solid #374151'
                                        } }) })), _jsxs("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        marginBottom: '16px'
                                    }, children: [_jsxs("div", { style: {
                                                background: '#374151',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }, children: [_jsx("div", { style: {
                                                        fontSize: '12px',
                                                        color: '#9ca3af',
                                                        marginBottom: '2px'
                                                    }, children: card.unitType === 'Primary' ? 'SP' : 'PC' }), _jsx("div", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#f9fafb'
                                                    }, children: card.squadPoints })] }), _jsxs("div", { style: {
                                                background: '#374151',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }, children: [_jsx("div", { style: {
                                                        fontSize: '12px',
                                                        color: '#9ca3af',
                                                        marginBottom: '2px'
                                                    }, children: "Force" }), _jsx("div", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#fbbf24'
                                                    }, children: card.force || 0 })] }), _jsxs("div", { style: {
                                                background: '#374151',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }, children: [_jsx("div", { style: {
                                                        fontSize: '12px',
                                                        color: '#9ca3af',
                                                        marginBottom: '2px'
                                                    }, children: "Stamina" }), _jsx("div", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#f9fafb'
                                                    }, children: card.stamina })] }), _jsxs("div", { style: {
                                                background: '#374151',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }, children: [_jsx("div", { style: {
                                                        fontSize: '12px',
                                                        color: '#9ca3af',
                                                        marginBottom: '2px'
                                                    }, children: "Durability" }), _jsx("div", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#f9fafb'
                                                    }, children: card.durability })] })] }), _jsxs("div", { style: {
                                        display: 'flex',
                                        gap: '8px',
                                        marginBottom: '16px'
                                    }, children: [_jsx("span", { style: {
                                                padding: '4px 8px',
                                                background: '#3b82f6',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: 'white'
                                            }, children: card.faction }), _jsx("span", { style: {
                                                padding: '4px 8px',
                                                background: card.unitType === 'Primary' ? '#dc2626' :
                                                    card.unitType === 'Secondary' ? '#f59e0b' : '#10b981',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: 'white'
                                            }, children: card.unitType })] }), _jsxs("div", { style: {
                                        display: 'flex',
                                        gap: '8px',
                                        flexWrap: 'wrap'
                                    }, children: [_jsx("button", { onClick: () => handleEditCard(card), style: {
                                                flex: 1,
                                                padding: '8px 12px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                transition: 'background 0.2s ease'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = '#2563eb';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = '#3b82f6';
                                            }, children: "Edit" }), card.status === 'DRAFT' && (_jsx("button", { onClick: () => handlePublishCard(card), style: {
                                                flex: 1,
                                                padding: '8px 12px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                transition: 'background 0.2s ease'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = '#059669';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = '#10b981';
                                            }, children: "Publish" })), _jsx("button", { onClick: () => handleDeleteCard(card.id), style: {
                                                padding: '8px 12px',
                                                background: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                transition: 'background 0.2s ease'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.background = '#b91c1c';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.background = '#dc2626';
                                            }, children: "Delete" })] })] })] }, card.id))) }))] }));
}
