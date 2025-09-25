import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { missionsData } from '../../data/missions';
const MissionCardsEditor = ({ mission, onSave, onCancel, onPreview }) => {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        source: 'official',
        setCode: '',
        tags: ['mission', 'setup'],
        thumbnail: '',
        map: { sizeInch: 36, unit: 'inch', origin: 'center', axis: 'x-right_y-up' },
        rendering: { point: { diameterInch: 1, colorActive: 'gold', colorInactive: 'gray' } },
        objectives: [],
        struggles: [],
        notes: ''
    });
    const [newObjectiveKey, setNewObjectiveKey] = useState('');
    const [newObjectiveX, setNewObjectiveX] = useState('');
    const [newObjectiveY, setNewObjectiveY] = useState('');
    const [newObjectiveRadius, setNewObjectiveRadius] = useState('0.5');
    const [newStruggleIndex, setNewStruggleIndex] = useState('');
    const [newCardName, setNewCardName] = useState('');
    const [newCardType, setNewCardType] = useState('active'); // 'active' or 'options'
    const [newCardActive, setNewCardActive] = useState('');
    const [newCardSpecialRules, setNewCardSpecialRules] = useState('N/A');
    const [activeSection, setActiveSection] = useState('initial-setup');
    const [editingCard, setEditingCard] = useState(null);
    // Initialize form data when mission prop changes
    useEffect(() => {
        if (mission) {
            setFormData({
                id: mission.id || '',
                name: mission.name || '',
                description: mission.description || '',
                source: mission.source || 'official',
                setCode: mission.setCode || '',
                tags: mission.tags || ['mission', 'setup'],
                thumbnail: mission.thumbnail || '',
                map: mission.map || { sizeInch: 36, unit: 'inch', origin: 'center', axis: 'x-right_y-up' },
                rendering: mission.rendering || { point: { diameterInch: 1, colorActive: 'gold', colorInactive: 'gray' } },
                objectives: mission.objectives || [],
                struggles: mission.struggles || [],
                notes: mission.notes || ''
            });
        }
    }, [mission]);
    // Helper function to get full mission data
    const getFullMissionData = (missionId) => {
        return missionsData.find(mission => mission.id === missionId);
    };
    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    // Handle objective changes
    const handleObjectiveChange = (index, field, value) => {
        const newObjectives = [...formData.objectives];
        newObjectives[index] = { ...newObjectives[index], [field]: value };
        setFormData(prev => ({ ...prev, objectives: newObjectives }));
    };
    // Add new objective
    const handleAddObjective = () => {
        if (newObjectiveKey.trim() && newObjectiveX && newObjectiveY) {
            const newObjective = {
                key: newObjectiveKey.trim().toUpperCase(),
                x: parseFloat(newObjectiveX),
                y: parseFloat(newObjectiveY),
                radius: parseFloat(newObjectiveRadius)
            };
            setFormData(prev => ({
                ...prev,
                objectives: [...prev.objectives, newObjective]
            }));
            setNewObjectiveKey('');
            setNewObjectiveX('');
            setNewObjectiveY('');
            setNewObjectiveRadius('0.5');
        }
    };
    // Remove objective
    const handleRemoveObjective = (index) => {
        const newObjectives = formData.objectives.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, objectives: newObjectives }));
    };
    // Add new struggle
    const handleAddStruggle = () => {
        if (newStruggleIndex) {
            const newStruggle = {
                index: parseInt(newStruggleIndex),
                cards: []
            };
            setFormData(prev => ({
                ...prev,
                struggles: [...prev.struggles, newStruggle]
            }));
            setNewStruggleIndex('');
        }
    };
    // Add new card to struggle
    const handleAddCard = (struggleIndex) => {
        if (newCardName.trim()) {
            let newCard;
            if (newCardType === 'active') {
                newCard = {
                    name: newCardName.trim(),
                    active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [],
                    specialRules: newCardSpecialRules.trim()
                };
            }
            else {
                // For options type, create a simple structure
                newCard = {
                    name: newCardName.trim(),
                    options: [
                        { name: "Option 1", active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [] }
                    ],
                    specialRules: newCardSpecialRules.trim()
                };
            }
            const newStruggles = [...formData.struggles];
            newStruggles[struggleIndex].cards.push(newCard);
            setFormData(prev => ({ ...prev, struggles: newStruggles }));
            setNewCardName('');
            setNewCardActive('');
            setNewCardSpecialRules('N/A');
        }
    };
    // Remove card
    const handleRemoveCard = (struggleIndex, cardIndex) => {
        const newStruggles = [...formData.struggles];
        newStruggles[struggleIndex].cards.splice(cardIndex, 1);
        setFormData(prev => ({ ...prev, struggles: newStruggles }));
    };
    // Remove struggle
    const handleRemoveStruggle = (struggleIndex) => {
        const newStruggles = formData.struggles.filter((_, i) => i !== struggleIndex);
        setFormData(prev => ({ ...prev, struggles: newStruggles }));
    };
    // Edit card
    const handleEditCard = (struggleIndex, cardIndex) => {
        const card = formData.struggles[struggleIndex].cards[cardIndex];
        setEditingCard({ struggleIndex, cardIndex });
        // Populate form with card data
        setNewCardName(card.name);
        setNewCardSpecialRules(card.specialRules);
        if (card.active) {
            setNewCardType('active');
            setNewCardActive(card.active.join(', '));
        }
        else if (card.options) {
            setNewCardType('options');
            // For options, we'll edit the first option for simplicity
            setNewCardActive(card.options[0]?.active?.join(', ') || '');
        }
    };
    // Save edited card
    const handleSaveEditedCard = () => {
        if (!editingCard)
            return;
        const { struggleIndex, cardIndex } = editingCard;
        const newStruggles = [...formData.struggles];
        let updatedCard;
        if (newCardType === 'active') {
            updatedCard = {
                name: newCardName.trim(),
                active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [],
                specialRules: newCardSpecialRules.trim()
            };
        }
        else {
            // For options type, create a simple structure
            updatedCard = {
                name: newCardName.trim(),
                options: [
                    { name: "Option 1", active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [] }
                ],
                specialRules: newCardSpecialRules.trim()
            };
        }
        newStruggles[struggleIndex].cards[cardIndex] = updatedCard;
        setFormData(prev => ({ ...prev, struggles: newStruggles }));
        // Reset form and editing state
        setEditingCard(null);
        setNewCardName('');
        setNewCardActive('');
        setNewCardSpecialRules('N/A');
        setNewCardType('active');
    };
    // Cancel editing
    const handleCancelEdit = () => {
        setEditingCard(null);
        setNewCardName('');
        setNewCardActive('');
        setNewCardSpecialRules('N/A');
        setNewCardType('active');
    };
    return (_jsxs("div", { style: {
            background: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            maxHeight: '90vh',
            overflowY: 'auto'
        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }, children: [_jsx("h2", { style: { fontSize: '24px', fontWeight: '700', color: '#e0e7ff', margin: 0 }, children: "Mission Cards Editor" }), _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("button", { onClick: () => setActiveSection('initial-setup'), style: {
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeSection === 'initial-setup' ? '#3b82f6' : '#374151',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }, children: "Initial Setup" }), _jsx("button", { onClick: () => setActiveSection('mission-cards'), style: {
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeSection === 'mission-cards' ? '#3b82f6' : '#374151',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }, children: "Mission Cards" })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }, children: [_jsxs("div", { style: { display: 'flex', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Mission ID *" }), _jsx("input", { type: "text", value: formData.id, onChange: (e) => handleInputChange('id', e.target.value), style: {
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }, placeholder: "e.g., dont-tell-me-odds" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Set Code" }), _jsx("input", { type: "text", value: formData.setCode, onChange: (e) => handleInputChange('setCode', e.target.value), style: {
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }, placeholder: "e.g., SWP001" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 2 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Mission Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), style: {
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }, placeholder: "e.g., Don't Tell me odds" })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #374151',
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    fontSize: '14px',
                                    minHeight: '60px',
                                    resize: 'vertical'
                                }, placeholder: "A high-stakes mission where players must control strategic positions..." })] }), _jsxs("div", { style: { display: 'flex', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Tags" }), _jsx("input", { type: "text", value: formData.tags.join(', '), onChange: (e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim())), style: {
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }, placeholder: "mission, setup" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Thumbnail URL" }), _jsx("input", { type: "text", value: formData.thumbnail, onChange: (e) => handleInputChange('thumbnail', e.target.value), style: {
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }, placeholder: "/missions/dont-tell-me-odds/thumbnail.png" })] })] })] }), activeSection === 'initial-setup' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }, children: "Initial Setup" }), _jsxs("div", { style: {
                            background: '#374151',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #4b5563'
                        }, children: [_jsx("h4", { style: { fontSize: '14px', fontWeight: '600', color: '#e0e7ff', marginBottom: '12px' }, children: "Map Configuration" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px', display: 'block' }, children: "Map Size (inches)" }), _jsx("div", { style: {
                                                    padding: '6px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #4b5563',
                                                    background: '#374151',
                                                    color: '#9ca3af',
                                                    fontSize: '12px',
                                                    width: '100%',
                                                    textAlign: 'center'
                                                }, children: "36\"" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px', display: 'block' }, children: "Origin" }), _jsx("div", { className: "role-select-wrap", children: _jsxs("select", { className: "role-select", value: formData.map.origin, onChange: (e) => handleInputChange('map', { ...formData.map, origin: e.target.value }), children: [_jsx("option", { value: "center", children: "Center" }), _jsx("option", { value: "corner", children: "Corner" })] }) })] })] })] }), _jsxs("div", { style: {
                            background: '#374151',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #4b5563'
                        }, children: [_jsxs("h4", { style: { fontSize: '14px', fontWeight: '600', color: '#e0e7ff', marginBottom: '12px' }, children: ["Objectives (", formData.objectives.length, ")"] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Key" }), _jsx("input", { type: "text", value: newObjectiveKey, onChange: (e) => setNewObjectiveKey(e.target.value), style: {
                                                    padding: '4px 6px',
                                                    borderRadius: '3px',
                                                    border: '1px solid #4b5563',
                                                    background: '#1f2937',
                                                    color: '#f3f4f6',
                                                    fontSize: '10px',
                                                    width: '100%'
                                                }, placeholder: "A" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "X" }), _jsx("input", { type: "number", value: newObjectiveX, onChange: (e) => setNewObjectiveX(e.target.value), style: {
                                                    padding: '4px 6px',
                                                    borderRadius: '3px',
                                                    border: '1px solid #4b5563',
                                                    background: '#1f2937',
                                                    color: '#f3f4f6',
                                                    fontSize: '10px',
                                                    width: '100%'
                                                }, placeholder: "-10" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Y" }), _jsx("input", { type: "number", value: newObjectiveY, onChange: (e) => setNewObjectiveY(e.target.value), style: {
                                                    padding: '4px 6px',
                                                    borderRadius: '3px',
                                                    border: '1px solid #4b5563',
                                                    background: '#1f2937',
                                                    color: '#f3f4f6',
                                                    fontSize: '10px',
                                                    width: '100%'
                                                }, placeholder: "8" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Radius" }), _jsx("div", { style: {
                                                    padding: '4px 6px',
                                                    borderRadius: '3px',
                                                    border: '1px solid #4b5563',
                                                    background: '#374151',
                                                    color: '#9ca3af',
                                                    fontSize: '10px',
                                                    width: '100%',
                                                    textAlign: 'center'
                                                }, children: "0.5\"" })] }), _jsx("button", { type: "button", onClick: handleAddObjective, style: {
                                            padding: '4px 8px',
                                            borderRadius: '3px',
                                            border: 'none',
                                            background: '#10b981',
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            height: 'fit-content'
                                        }, children: "Add" })] }), formData.objectives.length > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px' }, children: formData.objectives.map((objective, index) => (_jsxs("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                                        gap: '8px',
                                        alignItems: 'center',
                                        padding: '8px',
                                        background: '#2d3748',
                                        borderRadius: '4px',
                                        fontSize: '11px'
                                    }, children: [_jsx("input", { type: "text", value: objective.key, onChange: (e) => handleObjectiveChange(index, 'key', e.target.value.toUpperCase()), style: {
                                                padding: '4px 6px',
                                                borderRadius: '3px',
                                                border: '1px solid #4b5563',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '10px'
                                            } }), _jsx("input", { type: "number", value: objective.x, onChange: (e) => handleObjectiveChange(index, 'x', parseFloat(e.target.value)), style: {
                                                padding: '4px 6px',
                                                borderRadius: '3px',
                                                border: '1px solid #4b5563',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '10px'
                                            } }), _jsx("input", { type: "number", value: objective.y, onChange: (e) => handleObjectiveChange(index, 'y', parseFloat(e.target.value)), style: {
                                                padding: '4px 6px',
                                                borderRadius: '3px',
                                                border: '1px solid #4b5563',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '10px'
                                            } }), _jsx("input", { type: "number", step: "0.1", value: objective.radius, onChange: (e) => handleObjectiveChange(index, 'radius', parseFloat(e.target.value)), style: {
                                                padding: '4px 6px',
                                                borderRadius: '3px',
                                                border: '1px solid #4b5563',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '10px'
                                            } }), _jsx("button", { type: "button", onClick: () => handleRemoveObjective(index), style: {
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                border: 'none',
                                                background: '#dc2626',
                                                color: 'white',
                                                fontSize: '9px',
                                                cursor: 'pointer'
                                            }, children: "Remove" })] }, index))) })), formData.objectives.length > 0 && (_jsxs("div", { style: { marginTop: '16px' }, children: [_jsx("h5", { style: { fontSize: '12px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }, children: "Map Preview" }), _jsx("div", { style: {
                                            width: '300px',
                                            height: '200px',
                                            background: '#1f2937',
                                            border: '2px solid #4b5563',
                                            borderRadius: '8px',
                                            position: 'relative'
                                        }, children: _jsxs("svg", { width: "300", height: "200", style: { position: 'absolute', top: 0, left: 0 }, children: [[-16, -12, -8, -4, 0, 4, 8, 12, 16].map(x => (_jsx("line", { x1: 150 + x * 4.5, y1: "0", x2: 150 + x * 4.5, y2: "200", stroke: "#374151", strokeWidth: "0.5" }, `v-${x}`))), [-12, -8, -4, 0, 4, 8, 12].map(y => (_jsx("line", { x1: "0", y1: 100 - y * 4.5, x2: "300", y2: 100 - y * 4.5, stroke: "#374151", strokeWidth: "0.5" }, `h-${y}`))), formData.objectives.map((objective, index) => {
                                                    const x = 150 + (objective.x / 18) * 150;
                                                    const y = 100 - (objective.y / 18) * 100;
                                                    return (_jsxs("g", { children: [_jsx("circle", { cx: x, cy: y, r: "6", fill: "#6b7280", stroke: "#1f2937", strokeWidth: "2" }), _jsx("text", { x: x, y: y + 2, textAnchor: "middle", fontSize: "10", fill: "#f3f4f6", fontWeight: "600", children: objective.key })] }, index));
                                                })] }) })] }))] })] })), activeSection === 'mission-cards' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }, children: "Mission Cards" }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'end', marginBottom: '16px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Struggle Index" }), _jsx("input", { type: "number", value: newStruggleIndex, onChange: (e) => setNewStruggleIndex(e.target.value), style: {
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid #374151',
                                            background: '#1f2937',
                                            color: '#f3f4f6',
                                            fontSize: '12px'
                                        }, placeholder: "1" })] }), _jsx("button", { type: "button", onClick: handleAddStruggle, style: {
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }, children: "Add Struggle" })] }), formData.struggles.map((struggle, struggleIndex) => (_jsxs("div", { style: {
                            background: '#374151',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #4b5563'
                        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }, children: [_jsxs("h4", { style: { fontSize: '14px', fontWeight: '600', color: '#e0e7ff' }, children: ["Struggle ", struggle.index, " (", struggle.cards.length, " cards)"] }), _jsx("button", { type: "button", onClick: () => handleRemoveStruggle(struggleIndex), style: {
                                            padding: '4px 8px',
                                            borderRadius: '3px',
                                            border: 'none',
                                            background: '#dc2626',
                                            color: 'white',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }, children: "Remove Struggle" })] }), _jsxs("div", { style: {
                                    background: editingCard ? '#2d3748' : 'transparent',
                                    padding: editingCard ? '12px' : '0',
                                    borderRadius: editingCard ? '6px' : '0',
                                    border: editingCard ? '1px solid #4b5563' : 'none',
                                    marginBottom: '12px'
                                }, children: [editingCard && (_jsx("div", { style: {
                                            color: '#fbbf24',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            marginBottom: '8px'
                                        }, children: "Editing Card" })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto auto', gap: '8px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Card Name" }), _jsx("input", { type: "text", value: newCardName, onChange: (e) => setNewCardName(e.target.value), style: {
                                                            padding: '4px 6px',
                                                            borderRadius: '3px',
                                                            border: '1px solid #4b5563',
                                                            background: '#1f2937',
                                                            color: '#f3f4f6',
                                                            fontSize: '10px',
                                                            width: '100%'
                                                        }, placeholder: "Desperackie Kroki" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Card Type" }), _jsx("div", { className: "role-select-wrap", children: _jsxs("select", { className: "role-select", value: newCardType, onChange: (e) => setNewCardType(e.target.value), style: { fontSize: '10px', height: '28px' }, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "options", children: "Options" })] }) })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: newCardType === 'active' ? 'Active Objectives' : 'Option 1 Objectives' }), _jsx("input", { type: "text", value: newCardActive, onChange: (e) => setNewCardActive(e.target.value), style: {
                                                            padding: '4px 6px',
                                                            borderRadius: '3px',
                                                            border: '1px solid #4b5563',
                                                            background: '#1f2937',
                                                            color: '#f3f4f6',
                                                            fontSize: '10px',
                                                            width: '100%'
                                                        }, placeholder: "A,B,F,H,C" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }, children: "Special Rules" }), _jsx("input", { type: "text", value: newCardSpecialRules, onChange: (e) => setNewCardSpecialRules(e.target.value), style: {
                                                            padding: '4px 6px',
                                                            borderRadius: '3px',
                                                            border: '1px solid #4b5563',
                                                            background: '#1f2937',
                                                            color: '#f3f4f6',
                                                            fontSize: '10px',
                                                            width: '100%'
                                                        }, placeholder: "N/A" })] }), _jsx("button", { type: "button", onClick: () => editingCard ? handleSaveEditedCard() : handleAddCard(struggleIndex), style: {
                                                    padding: '4px 8px',
                                                    borderRadius: '3px',
                                                    border: 'none',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }, children: editingCard ? 'Save' : 'Add Card' }), editingCard && (_jsx("button", { type: "button", onClick: handleCancelEdit, style: {
                                                    padding: '4px 8px',
                                                    borderRadius: '3px',
                                                    border: 'none',
                                                    background: '#6b7280',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }, children: "Cancel" }))] })] }), struggle.cards.map((card, cardIndex) => (_jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: '#2d3748',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    marginBottom: '6px'
                                }, children: [_jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: [_jsx("span", { style: { color: '#f3f4f6', fontWeight: '500' }, children: card.name }), card.active && card.active.length > 0 && (_jsxs("span", { style: { color: '#9ca3af', fontSize: '10px' }, children: ["Active: ", card.active.join(', ')] })), card.options && card.options.length > 0 && (_jsxs("span", { style: { color: '#9ca3af', fontSize: '10px' }, children: ["Options: ", card.options.length] })), card.specialRules && card.specialRules !== 'N/A' && (_jsxs("span", { style: { color: '#fbbf24', fontSize: '10px' }, children: ["Rules: ", card.specialRules] }))] }), _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("button", { type: "button", onClick: () => handleEditCard(struggleIndex, cardIndex), style: {
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    border: 'none',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    fontSize: '9px',
                                                    cursor: 'pointer'
                                                }, children: "Edit" }), _jsx("button", { type: "button", onClick: () => handleRemoveCard(struggleIndex, cardIndex), style: {
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    border: 'none',
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    fontSize: '9px',
                                                    cursor: 'pointer'
                                                }, children: "Remove" })] })] }, cardIndex)))] }, struggleIndex)))] })), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }, children: [_jsx("button", { type: "button", onClick: onCancel, style: {
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: '1px solid #374151',
                            background: '#374151',
                            color: '#f3f4f6',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }, children: "Cancel" }), onPreview && (_jsx("button", { type: "button", onClick: () => onPreview(formData), style: {
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }, children: "Preview" })), _jsx("button", { type: "button", onClick: () => onSave(formData), style: {
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }, children: "Save Mission Card" })] })] }));
};
export default MissionCardsEditor;
