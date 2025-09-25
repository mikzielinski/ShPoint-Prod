import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GLYPHS, Icon, iconToCode, iconFromCode } from '../../lib/icons';
import { AttackTreeBuilder } from './AttackTreeBuilder';
// Prosty komponent do wyświetlania glifów jako symboli
const GlyphDisplay = ({ value, placeholder, style }) => {
    const effects = (value || '').split(',').map(s => s.trim()).filter(s => s);
    return (_jsx("div", { style: {
            ...style,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minHeight: '32px',
            padding: '4px 8px',
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            color: '#f9fafb',
            fontSize: '12px'
        }, children: effects.length > 0 ? (effects.map((effect, index) => {
            const iconName = iconFromCode(effect);
            return iconName ? (_jsx(Icon, { name: iconName, size: iconName.includes('_to_') ? 18 : 16 }, index)) : (_jsx("span", { style: { color: '#ef4444' }, children: effect }, index));
        })) : (_jsx("span", { style: { color: '#6b7280' }, children: placeholder })) }));
};
export const StanceEditor = ({ stance, onSave, onCancel }) => {
    // Nowy AttackTreeBuilder używa tego samego formatu co StanceCard
    // Nie potrzebujemy konwersji - przekazujemy tree bezpośrednio
    // Memoize stance to prevent infinite loops - use JSON.stringify for deep comparison
    const memoizedStance = useMemo(() => stance, [JSON.stringify(stance)]);
    const [formData, setFormData] = useState({
        sides: [
            {
                id: "A",
                name: "Side A",
                attack: {
                    melee: { dice: 0, range: 0, defense: 0, expertise: [] },
                    ranged: { dice: 0, range: 0, defense: 0, expertise: [] }
                },
                defense: { expertise: [] },
                tree: {
                    layout: { rows: 3, cols: 6 },
                    nodes: {
                        N1: { row: 1, col: 1, effects: [] },
                        N2: { row: 1, col: 2, effects: [] },
                        N3: { row: 1, col: 3, effects: [] }
                    },
                    edges: []
                }
            },
            {
                id: "B",
                name: "Side B",
                attack: {
                    melee: { dice: 0, range: 0, defense: 0, expertise: [] },
                    ranged: { dice: 0, range: 0, defense: 0, expertise: [] }
                },
                defense: { expertise: [] },
                tree: {
                    layout: { rows: 3, cols: 6 },
                    nodes: {
                        N1: { row: 1, col: 1, effects: [] },
                        N2: { row: 1, col: 2, effects: [] },
                        N3: { row: 1, col: 3, effects: [] }
                    },
                    edges: []
                }
            }
        ]
    });
    // Log formData changes
    useEffect(() => {
        console.log('🔍 StanceEditor: formData changed', formData);
        console.log('🔍 StanceEditor: formData.sides[0].tree:', formData.sides?.[0]?.tree);
        if (formData.sides?.[0]?.tree?.nodes) {
            console.log('🔍 StanceEditor: nodes in tree:', Object.keys(formData.sides[0].tree.nodes));
            Object.entries(formData.sides[0].tree.nodes).forEach(([id, node]) => {
                console.log(`🔍 Node ${id}:`, node);
            });
        }
    }, [formData]);
    const [showGlyphPanel, setShowGlyphPanel] = useState(false);
    const [activeInputRef, setActiveInputRef] = useState(null);
    const activeOnChangeRef = useRef(null);
    const [activeCurrentValue, setActiveCurrentValue] = useState('');
    const glyphPanelTimeoutRef = useRef(null);
    // Load stance data when component mounts or stance prop changes
    useEffect(() => {
        if (memoizedStance) {
            console.log('🔍 StanceEditor: Loading stance data', memoizedStance);
            console.log('🔍 StanceEditor: stance.sides[0].tree:', memoizedStance.sides?.[0]?.tree);
            setFormData(memoizedStance);
        }
        else {
            console.log('🔍 StanceEditor: No stance data provided');
        }
    }, [memoizedStance]);
    // Track formData changes
    useEffect(() => {
        console.log('🔍 StanceEditor: formData changed:', formData);
        console.log('🔍 StanceEditor: formData.sides[0].tree:', formData.sides?.[0]?.tree);
    }, [formData]);
    const handleSave = () => {
        onSave(formData);
    };
    const handleGlyphClick = (glyphName) => {
        console.log('🔍 handleGlyphClick called with:', glyphName);
        console.log('🔍 activeOnChangeRef.current type:', typeof activeOnChangeRef.current);
        console.log('🔍 activeOnChangeRef.current value:', activeOnChangeRef.current);
        console.log('🔍 activeCurrentValue:', activeCurrentValue);
        // Clear any pending timeout
        if (glyphPanelTimeoutRef.current) {
            clearTimeout(glyphPanelTimeoutRef.current);
            glyphPanelTimeoutRef.current = null;
        }
        if (activeOnChangeRef.current) {
            console.log('🔍 Current input value:', activeCurrentValue);
            console.log('🔍 activeOnChangeRef.current exists:', !!activeOnChangeRef.current);
            // Konwertuj nazwę glifu na kod (np. "strike" -> "a", "crit_to_strike" -> "b→a")
            const glyphCode = iconToCode(glyphName);
            console.log('🔍 Converted glyph code:', glyphCode);
            console.log('🔍 glyphName:', glyphName);
            if (!glyphCode) {
                console.log('❌ No glyph code found for:', glyphName);
                // Fallback: użyj nazwy glifu jako kodu
                const fallbackCode = glyphName;
                console.log('🔍 Using fallback code:', fallbackCode);
                const currentValue = activeCurrentValue || '';
                const newValue = currentValue ? `${currentValue}, ${fallbackCode}` : fallbackCode;
                console.log('🔍 New value with fallback:', newValue);
                activeOnChangeRef.current(newValue);
                setShowGlyphPanel(false);
                setActiveInputRef(null);
                activeOnChangeRef.current = null;
                setActiveCurrentValue('');
                return;
            }
            // Automatycznie rozdzielaj przecinkami
            const currentValue = activeCurrentValue || '';
            const newValue = currentValue ? `${currentValue}, ${glyphCode}` : glyphCode;
            console.log('🔍 New value:', newValue);
            // Wywołaj callback onChange
            activeOnChangeRef.current(newValue);
        }
        else {
            console.log('❌ No active onChange callback');
        }
        setShowGlyphPanel(false);
        setActiveInputRef(null);
        activeOnChangeRef.current = null;
        setActiveCurrentValue('');
    };
    // Funkcja do formatowania nazw glifów dla wyświetlania
    const formatGlyphName = (name) => {
        const nameMap = {
            crit_to_strike: "Crit → Strike",
            strike_to_fail: "Strike → Fail",
            strike_to_crit: "Strike → Crit",
            fail_to_strike: "Fail → Strike",
            fail_to_crit: "Fail → Crit",
        };
        return nameMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    const updateSide = (sideId, updates) => {
        setFormData(prev => ({
            ...prev,
            sides: prev.sides?.map(side => side.id === sideId ? { ...side, ...updates } : side)
        }));
    };
    const updateAttack = (sideId, attackType, updates) => {
        setFormData(prev => ({
            ...prev,
            sides: prev.sides?.map(side => side.id === sideId
                ? {
                    ...side,
                    attack: {
                        ...side.attack,
                        [attackType]: { ...side.attack?.[attackType], ...updates }
                    }
                }
                : side)
        }));
    };
    const updateDefense = (sideId, updates) => {
        setFormData(prev => ({
            ...prev,
            sides: prev.sides?.map(side => side.id === sideId
                ? {
                    ...side,
                    defense: { ...side.defense, ...updates }
                }
                : side)
        }));
    };
    const addExpertise = (sideId, attackType, expertise) => {
        if (attackType === "defense") {
            updateDefense(sideId, {
                expertise: [...(formData.sides?.find(s => s.id === sideId)?.defense?.expertise || []), expertise]
            });
        }
        else {
            updateAttack(sideId, attackType, {
                expertise: [...(formData.sides?.find(s => s.id === sideId)?.attack?.[attackType]?.expertise || []), expertise]
            });
        }
    };
    const removeExpertise = (sideId, attackType, index) => {
        if (attackType === "defense") {
            const newExpertise = formData.sides?.find(s => s.id === sideId)?.defense?.expertise?.filter((_, i) => i !== index) || [];
            updateDefense(sideId, { expertise: newExpertise });
        }
        else {
            const newExpertise = formData.sides?.find(s => s.id === sideId)?.attack?.[attackType]?.expertise?.filter((_, i) => i !== index) || [];
            updateAttack(sideId, attackType, { expertise: newExpertise });
        }
    };
    // Create stable callback functions that don't depend on formData
    const createMeleeExpertiseCallback = useCallback((sideId, expIndex) => {
        return (value) => {
            setFormData(prev => {
                const side = prev.sides?.find(s => s.id === sideId);
                if (side?.attack?.melee?.expertise) {
                    const newExpertise = [...side.attack.melee.expertise];
                    newExpertise[expIndex] = {
                        ...newExpertise[expIndex],
                        effects: (value || '').split(',').map(s => s.trim()).filter(s => s)
                    };
                    return {
                        ...prev,
                        sides: prev.sides?.map(s => s.id === sideId
                            ? { ...s, attack: { ...s.attack, melee: { ...s.attack?.melee, expertise: newExpertise } } }
                            : s)
                    };
                }
                return prev;
            });
        };
    }, []);
    const createRangedExpertiseCallback = useCallback((sideId, expIndex) => {
        return (value) => {
            setFormData(prev => {
                const side = prev.sides?.find(s => s.id === sideId);
                if (side?.attack?.ranged?.expertise) {
                    const newExpertise = [...side.attack.ranged.expertise];
                    newExpertise[expIndex] = {
                        ...newExpertise[expIndex],
                        effects: (value || '').split(',').map(s => s.trim()).filter(s => s)
                    };
                    return {
                        ...prev,
                        sides: prev.sides?.map(s => s.id === sideId
                            ? { ...s, attack: { ...s.attack, ranged: { ...s.attack?.ranged, expertise: newExpertise } } }
                            : s)
                    };
                }
                return prev;
            });
        };
    }, []);
    const createDefenseExpertiseCallback = useCallback((sideId, expIndex) => {
        return (value) => {
            setFormData(prev => {
                const side = prev.sides?.find(s => s.id === sideId);
                if (side?.defense?.expertise) {
                    const newExpertise = [...side.defense.expertise];
                    newExpertise[expIndex] = {
                        ...newExpertise[expIndex],
                        effects: (value || '').split(',').map(s => s.trim()).filter(s => s)
                    };
                    return {
                        ...prev,
                        sides: prev.sides?.map(s => s.id === sideId
                            ? { ...s, defense: { ...s.defense, expertise: newExpertise } }
                            : s)
                    };
                }
                return prev;
            });
        };
    }, []);
    return (_jsxs("div", { style: {
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
        }, children: [_jsxs("div", { style: {
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '1200px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    border: '1px solid #374151'
                }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            borderBottom: '1px solid #374151',
                            paddingBottom: '16px'
                        }, children: [_jsx("h2", { style: {
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#f9fafb',
                                    margin: 0
                                }, children: "Stance Editor" }), _jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsx("button", { onClick: onCancel, style: {
                                            padding: '8px 16px',
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }, children: "Cancel" }), _jsx("button", { onClick: handleSave, style: {
                                            padding: '8px 16px',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }, children: "Save Stance" })] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: formData.sides?.map((side, sideIndex) => {
                            console.log('🔍 StanceEditor: Rendering side', side.id, 'with tree:', side.tree);
                            return (_jsxs("div", { style: {
                                    backgroundColor: '#111827',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #374151'
                                }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            marginBottom: '20px'
                                        }, children: [_jsxs("h3", { style: {
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    color: '#f9fafb',
                                                    margin: 0
                                                }, children: ["Side ", side.id] }), _jsx("input", { type: "text", value: side.name, onChange: (e) => updateSide(side.id, { name: e.target.value }), placeholder: "Side name", style: {
                                                    padding: '8px 12px',
                                                    backgroundColor: '#374151',
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '6px',
                                                    color: '#f9fafb',
                                                    fontSize: '14px',
                                                    flex: 1,
                                                    maxWidth: '300px'
                                                } })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h4", { style: {
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#f9fafb',
                                                    marginBottom: '16px',
                                                    paddingBottom: '8px',
                                                    borderBottom: '2px solid #3b82f6'
                                                }, children: "\u2694\uFE0F Attack and Defense" }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px',
                                                    marginBottom: '12px'
                                                }, children: [_jsx("h5", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Melee Attack" }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginBottom: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Dice" }), _jsx("input", { type: "number", value: side.attack?.melee?.dice || 0, onChange: (e) => updateAttack(side.id, 'melee', { dice: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Range" }), _jsx("input", { type: "number", value: side.attack?.melee?.range || 0, onChange: (e) => updateAttack(side.id, 'melee', { range: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Defense" }), _jsx("input", { type: "number", value: side.attack?.melee?.defense || 0, onChange: (e) => updateAttack(side.id, 'melee', { defense: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] })] })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px'
                                                }, children: [_jsx("h5", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Ranged Attack" }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginBottom: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Dice" }), _jsx("input", { type: "number", value: side.attack?.ranged?.dice || 0, onChange: (e) => updateAttack(side.id, 'ranged', { dice: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Range" }), _jsx("input", { type: "number", value: side.attack?.ranged?.range || 0, onChange: (e) => updateAttack(side.id, 'ranged', { range: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Defense" }), _jsx("input", { type: "number", value: side.attack?.ranged?.defense || 0, onChange: (e) => updateAttack(side.id, 'ranged', { defense: parseInt(e.target.value) || 0 }), style: {
                                                                            width: '60px',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#374151',
                                                                            border: '1px solid #4b5563',
                                                                            borderRadius: '4px',
                                                                            color: '#f9fafb',
                                                                            fontSize: '12px'
                                                                        } })] })] })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px',
                                                    marginTop: '12px'
                                                }, children: [_jsx("h5", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Defense" }), _jsx("p", { style: {
                                                            fontSize: '14px',
                                                            color: '#9ca3af',
                                                            margin: 0,
                                                            fontStyle: 'italic'
                                                        }, children: "Defense stats are configured in the Expertises section below." })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h4", { style: {
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#f9fafb',
                                                    marginBottom: '16px',
                                                    paddingBottom: '8px',
                                                    borderBottom: '2px solid #f59e0b'
                                                }, children: "\uD83C\uDFAF Expertises" }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px',
                                                    marginBottom: '12px'
                                                }, children: [_jsx("h6", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Melee Expertise" }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [_jsx("span", { style: { fontSize: '12px', color: '#6b7280' }, children: "Add expertise values and effects for melee attacks" }), _jsx("button", { onClick: () => addExpertise(side.id, 'melee', { value: '', effects: [] }), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Add" })] }), side.attack?.melee?.expertise?.map((exp, expIndex) => (_jsxs("div", { style: {
                                                            display: 'flex',
                                                            gap: '8px',
                                                            alignItems: 'center',
                                                            marginBottom: '8px'
                                                        }, children: [_jsx("input", { type: "text", value: exp.value, onChange: (e) => {
                                                                    const newExpertise = [...(side.attack?.melee?.expertise || [])];
                                                                    newExpertise[expIndex] = { ...exp, value: e.target.value };
                                                                    updateAttack(side.id, 'melee', { expertise: newExpertise });
                                                                }, placeholder: "Value (e.g., 1-2)", style: {
                                                                    width: '80px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#374151',
                                                                    border: '1px solid #4b5563',
                                                                    borderRadius: '4px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                } }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }, children: [_jsx(GlyphDisplay, { value: (exp.effects || []).join(', '), placeholder: "Effects (e.g., b, a)", style: {
                                                                            flex: 1
                                                                        } }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Otwórz panel glifów dla tego konkretnego pola
                                                                            console.log('🔍 Add Glyph button clicked for melee expertise', expIndex);
                                                                            const callback = createMeleeExpertiseCallback(side.id, expIndex);
                                                                            console.log('🔍 Created callback:', typeof callback, callback);
                                                                            setShowGlyphPanel(true);
                                                                            setActiveInputRef(null);
                                                                            activeOnChangeRef.current = callback;
                                                                            const currentEffects = (exp.effects || []).join(', ');
                                                                            console.log('🔍 Setting activeCurrentValue to:', currentEffects);
                                                                            setActiveCurrentValue(currentEffects);
                                                                        }, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#059669',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            cursor: 'pointer'
                                                                        }, children: "Add Glyph" }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Usuń ostatni glif z tego pola
                                                                            const currentEffects = (exp.effects || []);
                                                                            if (currentEffects.length > 0) {
                                                                                const newEffects = currentEffects.slice(0, -1);
                                                                                const callback = createMeleeExpertiseCallback(side.id, expIndex);
                                                                                callback(newEffects.join(', '));
                                                                            }
                                                                        }, disabled: !exp.effects || exp.effects.length === 0, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: exp.effects && exp.effects.length > 0 ? '#dc2626' : '#9ca3af',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: exp.effects && exp.effects.length > 0 ? 'pointer' : 'not-allowed',
                                                                            fontSize: '12px',
                                                                            marginLeft: '4px'
                                                                        }, children: "Remove Last" })] }), _jsx("button", { onClick: () => removeExpertise(side.id, 'melee', expIndex), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Remove" })] }, expIndex)))] }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px',
                                                    marginBottom: '12px'
                                                }, children: [_jsx("h6", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Ranged Expertise" }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [_jsx("span", { style: { fontSize: '12px', color: '#6b7280' }, children: "Add expertise values and effects for ranged attacks" }), _jsx("button", { onClick: () => addExpertise(side.id, 'ranged', { value: '', effects: [] }), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Add" })] }), side.attack?.ranged?.expertise?.map((exp, expIndex) => (_jsxs("div", { style: {
                                                            display: 'flex',
                                                            gap: '8px',
                                                            alignItems: 'center',
                                                            marginBottom: '8px'
                                                        }, children: [_jsx("input", { type: "text", value: exp.value, onChange: (e) => {
                                                                    const newExpertise = [...(side.attack?.ranged?.expertise || [])];
                                                                    newExpertise[expIndex] = { ...exp, value: e.target.value };
                                                                    updateAttack(side.id, 'ranged', { expertise: newExpertise });
                                                                }, placeholder: "Value (e.g., 1-2)", style: {
                                                                    width: '80px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#374151',
                                                                    border: '1px solid #4b5563',
                                                                    borderRadius: '4px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                } }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }, children: [_jsx(GlyphDisplay, { value: (exp.effects || []).join(', '), placeholder: "Effects (e.g., b, a)", style: {
                                                                            flex: 1
                                                                        } }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Otwórz panel glifów dla tego konkretnego pola
                                                                            console.log('🔍 Add Glyph button clicked for ranged expertise', expIndex);
                                                                            const callback = createRangedExpertiseCallback(side.id, expIndex);
                                                                            console.log('🔍 Created callback:', typeof callback, callback);
                                                                            setShowGlyphPanel(true);
                                                                            setActiveInputRef(null);
                                                                            activeOnChangeRef.current = callback;
                                                                            const currentEffects = (exp.effects || []).join(', ');
                                                                            console.log('🔍 Setting activeCurrentValue to:', currentEffects);
                                                                            setActiveCurrentValue(currentEffects);
                                                                        }, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#059669',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            cursor: 'pointer'
                                                                        }, children: "Add Glyph" }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Usuń ostatni glif z tego pola
                                                                            const currentEffects = (exp.effects || []);
                                                                            if (currentEffects.length > 0) {
                                                                                const newEffects = currentEffects.slice(0, -1);
                                                                                const callback = createRangedExpertiseCallback(side.id, expIndex);
                                                                                callback(newEffects.join(', '));
                                                                            }
                                                                        }, disabled: !exp.effects || exp.effects.length === 0, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: exp.effects && exp.effects.length > 0 ? '#dc2626' : '#9ca3af',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: exp.effects && exp.effects.length > 0 ? 'pointer' : 'not-allowed',
                                                                            fontSize: '12px',
                                                                            marginLeft: '4px'
                                                                        }, children: "Remove Last" })] }), _jsx("button", { onClick: () => removeExpertise(side.id, 'ranged', expIndex), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Remove" })] }, expIndex)))] }), _jsxs("div", { style: {
                                                    backgroundColor: '#1f2937',
                                                    borderRadius: '6px',
                                                    padding: '16px'
                                                }, children: [_jsx("h6", { style: {
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#9ca3af',
                                                            marginBottom: '8px'
                                                        }, children: "Defense Expertise" }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [_jsx("span", { style: { fontSize: '12px', color: '#6b7280' }, children: "Add expertise values and effects for defense" }), _jsx("button", { onClick: () => addExpertise(side.id, 'defense', { value: '', effects: [] }), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Add" })] }), side.defense?.expertise?.map((exp, expIndex) => (_jsxs("div", { style: {
                                                            display: 'flex',
                                                            gap: '8px',
                                                            alignItems: 'center',
                                                            marginBottom: '8px'
                                                        }, children: [_jsx("input", { type: "text", value: exp.value, onChange: (e) => {
                                                                    const newExpertise = [...(side.defense?.expertise || [])];
                                                                    newExpertise[expIndex] = { ...exp, value: e.target.value };
                                                                    updateDefense(side.id, { expertise: newExpertise });
                                                                }, placeholder: "Value (e.g., 1-2)", style: {
                                                                    width: '80px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#374151',
                                                                    border: '1px solid #4b5563',
                                                                    borderRadius: '4px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                } }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }, children: [_jsx(GlyphDisplay, { value: (exp.effects || []).join(', '), placeholder: "Effects (e.g., e, f)", style: {
                                                                            flex: 1
                                                                        } }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Otwórz panel glifów dla tego konkretnego pola
                                                                            console.log('🔍 Add Glyph button clicked for defense expertise', expIndex);
                                                                            const callback = createDefenseExpertiseCallback(side.id, expIndex);
                                                                            console.log('🔍 Created callback:', typeof callback, callback);
                                                                            setShowGlyphPanel(true);
                                                                            setActiveInputRef(null);
                                                                            activeOnChangeRef.current = callback;
                                                                            const currentEffects = (exp.effects || []).join(', ');
                                                                            console.log('🔍 Setting activeCurrentValue to:', currentEffects);
                                                                            setActiveCurrentValue(currentEffects);
                                                                        }, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#059669',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            cursor: 'pointer'
                                                                        }, children: "Add Glyph" }), _jsx("button", { type: "button", onClick: () => {
                                                                            // Usuń ostatni glif z tego pola
                                                                            const currentEffects = (exp.effects || []);
                                                                            if (currentEffects.length > 0) {
                                                                                const newEffects = currentEffects.slice(0, -1);
                                                                                const callback = createDefenseExpertiseCallback(side.id, expIndex);
                                                                                callback(newEffects.join(', '));
                                                                            }
                                                                        }, disabled: !exp.effects || exp.effects.length === 0, style: {
                                                                            padding: '4px 8px',
                                                                            backgroundColor: exp.effects && exp.effects.length > 0 ? '#dc2626' : '#9ca3af',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: exp.effects && exp.effects.length > 0 ? 'pointer' : 'not-allowed',
                                                                            fontSize: '12px',
                                                                            marginLeft: '4px'
                                                                        }, children: "Remove Last" })] }), _jsx("button", { onClick: () => removeExpertise(side.id, 'defense', expIndex), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: "Remove" })] }, expIndex)))] })] }), _jsxs("div", { children: [_jsx("h4", { style: {
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#f9fafb',
                                                    marginBottom: '16px',
                                                    paddingBottom: '8px',
                                                    borderBottom: '2px solid #8b5cf6'
                                                }, children: "\uD83C\uDF33 Attack Tree" }), _jsx(AttackTreeBuilder, { tree: side.tree || { layout: { rows: 3, cols: 6 }, nodes: {}, edges: [] }, onChange: (newTree) => {
                                                    console.log('🔧 StanceEditor onChange called:', { sideId: side.id, newTree });
                                                    console.log('🔧 side.tree before update:', side.tree);
                                                    console.log('🔧 Current formData:', formData);
                                                    setFormData(prev => {
                                                        const newFormData = {
                                                            ...prev,
                                                            sides: prev.sides?.map(s => s.id === side.id
                                                                ? { ...s, tree: newTree }
                                                                : s)
                                                        };
                                                        console.log('🔧 New formData:', newFormData);
                                                        return newFormData;
                                                    });
                                                } })] })] }, side.id));
                        }) })] }), showGlyphPanel && (_jsxs("div", { style: {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#1f2937',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    padding: '20px',
                    zIndex: 1001,
                    maxWidth: '600px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#f9fafb',
                                    margin: 0
                                }, children: "\uD83C\uDFAF Select Glyph" }), _jsx("button", { onClick: () => {
                                    // Clear any pending timeout
                                    if (glyphPanelTimeoutRef.current) {
                                        clearTimeout(glyphPanelTimeoutRef.current);
                                        glyphPanelTimeoutRef.current = null;
                                    }
                                    setShowGlyphPanel(false);
                                    setActiveInputRef(null);
                                    activeOnChangeRef.current = null;
                                    setActiveCurrentValue('');
                                }, style: {
                                    padding: '4px 8px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }, children: "\u2715" })] }), _jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                            gap: '8px'
                        }, children: Object.entries(GLYPHS).map(([name, glyph]) => (_jsxs("button", { onClick: () => handleGlyphClick(name), style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '8px',
                                backgroundColor: '#374151',
                                border: '1px solid #4b5563',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '60px'
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.backgroundColor = '#4b5563';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.backgroundColor = '#374151';
                                e.currentTarget.style.borderColor = '#4b5563';
                            }, children: [_jsx(Icon, { name: name, size: name.includes('_to_') ? 28 : 24, style: {
                                        color: '#f9fafb',
                                        marginBottom: '4px'
                                    } }), _jsx("span", { style: {
                                        fontSize: '10px',
                                        color: '#9ca3af',
                                        textAlign: 'center',
                                        lineHeight: 1.2
                                    }, children: formatGlyphName(name) }), _jsx("span", { style: {
                                        fontSize: '8px',
                                        color: '#6b7280',
                                        textAlign: 'center'
                                    }, children: glyph })] }, name))) })] }))] }));
};
export default StanceEditor;
