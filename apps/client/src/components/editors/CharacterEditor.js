import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { API_BASE } from '../../lib/env';
import StanceEditor from './StanceEditor';
export const CharacterEditor = ({ character, onSave, onCancel, onDelete }) => {
    const { auth } = useAuth();
    const me = auth.status === 'authenticated' ? auth.user : null;
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        characterNames: '',
        boxSetCode: '',
        portrait: '',
        squad_points: 0,
        point_cost: 0,
        force: 0,
        unit_type: 'Primary',
        stamina: 0,
        durability: 0,
        number_of_characters: 1,
        factions: [],
        period: [],
        abilities: [],
        structuredAbilities: []
    });
    const [newAbility, setNewAbility] = useState({
        id: '',
        type: 'Active',
        symbol: 'j',
        name: '',
        description: '',
        forceCost: 0,
        trigger: 'on_activation',
        isAction: false,
        tags: []
    });
    const [newFaction, setNewFaction] = useState('');
    const [newPeriod, setNewPeriod] = useState('');
    const [showGameSymbols, setShowGameSymbols] = useState(false);
    const [editingAbility, setEditingAbility] = useState(null);
    const [showStanceEditor, setShowStanceEditor] = useState(false);
    const [stanceData, setStanceData] = useState(null);
    const descriptionTextareaRef = useRef(null);
    const availableFactions = [
        'Galactic Republic',
        'Separatist',
        'Galactic Empire',
        'Rebel Alliance',
        'Mandalorian',
        'Jedi',
        'Sith',
        'Force User',
        'Clone Trooper',
        'Droid',
        'Scoundrel',
        'Bounty Hunter',
        'Inquisitorius',
        'Nightsister',
        'Nightbrother'
    ];
    const availablePeriods = [
        'The fall of the Jedi',
        'The reign of the Empire',
        'The Age of Rebellion',
        'The New Republic'
    ];
    const availableTriggers = [
        { value: 'on_activation', label: 'On activation' },
        { value: 'on_attack', label: 'On attack' },
        { value: 'on_defend', label: 'On defend' },
        { value: 'on_damage', label: 'On damage' },
        { value: 'on_death', label: 'On death' },
        { value: 'on_force_spend', label: 'On force spend' },
        { value: 'on_move', label: 'On move' },
        { value: 'on_ability_use', label: 'On ability use' },
        { value: 'passive', label: 'Passive' },
        { value: 'constant', label: 'Constant' }
    ];
    // Mapowanie symboli zgodnie z StanceCard.tsx
    const ICON = {
        "1": "\u0031", // pinned
        "3": "\u0033", // hunker
        "4": "\u0034", // exposed
        "5": "\u0035", // strained
        "8": "\u0038", // unit
        "9": "\u0039", // disarm
        a: "\u0061", // strike
        b: "\u0062", // critical
        c: "\u0063", // attack expertise
        d: "\u0064", // failure
        e: "\u0065", // block
        f: "\u0066", // defense expertise
        h: "\u0068", // dash
        i: "\u0069", // reactive
        j: "\u006A", // active
        k: "\u006B", // tactic
        l: "\u006C", // innate
        m: "\u006D", // identify
        n: "\u006E", // ranged
        o: "\u006F", // melee
        p: "\u0070", // shove
        q: "\u0071", // damage
        r: "\u0072", // heal
        s: "\u0073", // reposition
        t: "\u0074", // jump
        u: "\u0075", // climb
        v: "\u0076", // force
        w: "\u0077", // durability
    };
    const gameSymbols = [
        { symbol: 't', name: 'Jump', description: 'Jump action', unicode: ICON.t },
        { symbol: 'm', name: 'Identify', description: 'Identify action', unicode: ICON.m },
        { symbol: 'a', name: 'Strike', description: 'Strike action', unicode: ICON.a },
        { symbol: 'e', name: 'Block', description: 'Block result', unicode: ICON.e },
        { symbol: '3', name: 'Hunker', description: 'Hunker action', unicode: ICON["3"] },
        { symbol: 'n', name: 'Ranged', description: 'Ranged attack', unicode: ICON.n },
        { symbol: 'v', name: 'Force', description: 'Force point', unicode: ICON.v },
        { symbol: 'c', name: 'Attack Expertise', description: 'Attack expertise die', unicode: ICON.c },
        { symbol: 'f', name: 'Defense Expertise', description: 'Defense expertise die', unicode: ICON.f },
        { symbol: 's', name: 'Reposition', description: 'Reposition action', unicode: ICON.s },
        { symbol: 'r', name: 'Heal', description: 'Heal action', unicode: ICON.r },
        { symbol: 'w', name: 'Durability', description: 'Durability stat', unicode: ICON.w },
        { symbol: 'b', name: 'Critical', description: 'Critical hit', unicode: ICON.b },
        { symbol: 'd', name: 'Failure', description: 'Failure result', unicode: ICON.d },
        { symbol: 'h', name: 'Dash', description: 'Dash action', unicode: ICON.h },
        { symbol: 'o', name: 'Melee', description: 'Melee attack', unicode: ICON.o },
        { symbol: 'p', name: 'Shove', description: 'Shove action', unicode: ICON.p },
        { symbol: 'q', name: 'Damage', description: 'Damage result', unicode: ICON.q },
        { symbol: '1', name: 'Pinned', description: 'Pinned condition', unicode: ICON["1"] },
        { symbol: '4', name: 'Exposed', description: 'Exposed condition', unicode: ICON["4"] },
        { symbol: '5', name: 'Strained', description: 'Strained condition', unicode: ICON["5"] },
        { symbol: '9', name: 'Disarm', description: 'Disarm condition', unicode: ICON["9"] },
        { symbol: 'u', name: 'Climb', description: 'Climb action', unicode: ICON.u },
        { symbol: 'k', name: 'Tactic', description: 'Tactic action', unicode: ICON.k },
        { symbol: 'l', name: 'Innate', description: 'Innate ability', unicode: ICON.l },
        { symbol: 'i', name: 'Reactive', description: 'Reactive ability', unicode: ICON.i },
        { symbol: 'j', name: 'Active', description: 'Active ability', unicode: ICON.j }
    ];
    useEffect(() => {
        if (character) {
            console.log('🔍 Loading character data:', character.id, character.name);
            setFormData({
                ...character,
                // Ensure new fields have default values if missing
                characterNames: character.characterNames || character.name || '',
                boxSetCode: character.boxSetCode || '',
                point_cost: character.point_cost || (character.unit_type !== 'Primary' ? character.squad_points : 0),
                force: character.force || 0,
                stamina: character.stamina || 0,
                durability: character.durability || 0,
                number_of_characters: character.number_of_characters || 1,
                // Ensure arrays are always arrays
                factions: character.factions || [],
                period: character.period || [],
                abilities: character.abilities || [],
                structuredAbilities: character.structuredAbilities || character.abilities || []
            });
            // Load stance data with character ID directly
            if (character.id) {
                console.log('🔍 Loading stance data for character ID:', character.id);
                loadStanceDataForCharacter(character.id);
            }
        }
    }, [character]);
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleAbilityChange = (field, value) => {
        setNewAbility(prev => ({
            ...prev,
            [field]: value
        }));
    };
    // Function to render symbols in ability descriptions
    const renderAbilityDescription = (description) => {
        if (!description)
            return '';
        // Map symbol tags to Unicode characters (same as AbilityCard)
        const symbolMap = {
            'force': "\u0076", // v - sp-force
            'dash': "\u0068", // h - sp-dash
            'jump': "\u0074", // t - sp-jump
            'crit': "\u0062", // b - sp-critical
            'hit': "\u0061", // a - sp-strike
            'block': "\u0065", // e - sp-block
            'identify': "\u006D", // m - sp-identify
            'strike': "\u0061", // a - sp-strike
            'hunker': "\u0033", // 3 - sp-hunker
            'ranged': "\u006E", // n - sp-ranged
            'attack-expertise': "\u0063", // c - sp-attack-expertise
            'defense-expertise': "\u0066", // f - sp-defense-expertise
            'reposition': "\u0073", // s - sp-reposition
            'heal': "\u0072", // r - sp-heal
            'durability': "\u0077", // w - sp-durability
            'critical': "\u0062", // b - sp-critical
            'failure': "\u0064", // d - sp-failure
            'melee': "\u006F", // o - sp-melee
            'shove': "\u0070", // p - sp-shove
            'damage': "\u0071", // q - sp-damage
            'pinned': "\u0031", // 1 - sp-pinned
            'exposed': "\u0034", // 4 - sp-exposed
            'strained': "\u0035", // 5 - sp-strained
            'disarm': "\u0039", // 9 - sp-disarm
            'climb': "\u0075", // u - sp-climb
            'tactic': "\u006B", // k - sp-tactic
            'innate': "\u006C", // l - sp-innate
            'reactive': "\u0069", // i - sp-reactive
            'active': "\u006A", // j - sp-active
        };
        // Replace [[symbol]] tags with actual symbols
        return description.replace(/\[\[([^\]]+)\]\]/g, (match, symbolName) => {
            const unicode = symbolMap[symbolName.toLowerCase()];
            if (unicode) {
                return `<span style="font-family: 'ShatterpointIcons', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #fbbf24; font-size: 16px;">${unicode}</span>`;
            }
            return match; // Return original if symbol not found
        });
    };
    const insertGameSymbol = (symbol, name, unicode) => {
        const symbolText = `[[${name.toLowerCase().replace(/\s+/g, '-')}]]`;
        // Use ref to get the textarea element and its cursor position
        const textarea = descriptionTextareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentDescription = newAbility.description;
            const newDescription = currentDescription.substring(0, start) + symbolText + currentDescription.substring(end);
            setNewAbility(prev => ({
                ...prev,
                description: newDescription
            }));
            // Restore cursor position after the inserted text
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + symbolText.length, start + symbolText.length);
            }, 0);
        }
        else {
            // Fallback: append to end if textarea not found
            setNewAbility(prev => ({
                ...prev,
                description: prev.description + symbolText
            }));
        }
    };
    const addAbility = () => {
        if (newAbility.name.trim()) {
            const ability = {
                ...newAbility,
                id: newAbility.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
            };
            setFormData(prev => ({
                ...prev,
                structuredAbilities: [...(prev.structuredAbilities || []), ability]
            }));
            setNewAbility({
                id: '',
                type: 'Active',
                symbol: 'j',
                name: '',
                description: '',
                forceCost: 0,
                trigger: 'on_activation',
                isAction: false,
                tags: []
            });
        }
    };
    const removeAbility = (abilityId) => {
        setFormData(prev => ({
            ...prev,
            structuredAbilities: (prev.structuredAbilities || []).filter(a => a.id !== abilityId)
        }));
    };
    const editAbility = (ability) => {
        setEditingAbility(ability);
        setNewAbility({
            ...ability
        });
    };
    const cancelEditAbility = () => {
        setEditingAbility(null);
        setNewAbility({
            id: '',
            type: 'Active',
            symbol: 'j',
            name: '',
            description: '',
            forceCost: 0,
            trigger: 'on_activation',
            isAction: false,
            tags: []
        });
    };
    const updateAbility = () => {
        if (!editingAbility)
            return;
        setFormData(prev => ({
            ...prev,
            structuredAbilities: (prev.structuredAbilities || []).map(a => a.id === editingAbility.id ? newAbility : a)
        }));
        cancelEditAbility();
    };
    const addFaction = () => {
        if (newFaction.trim() && !(formData.factions || []).includes(newFaction.trim())) {
            setFormData(prev => ({
                ...prev,
                factions: [...(prev.factions || []), newFaction.trim()]
            }));
            setNewFaction('');
        }
    };
    const removeFaction = (faction) => {
        setFormData(prev => ({
            ...prev,
            factions: (prev.factions || []).filter(f => f !== faction)
        }));
    };
    const addPeriod = () => {
        if (newPeriod.trim() && !(formData.period || []).includes(newPeriod.trim())) {
            setFormData(prev => ({
                ...prev,
                period: [...(prev.period || []), newPeriod.trim()]
            }));
            setNewPeriod('');
        }
    };
    const removePeriod = (period) => {
        setFormData(prev => ({
            ...prev,
            period: (prev.period || []).filter(p => p !== period)
        }));
    };
    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('Character name is required');
            return;
        }
        onSave(formData);
    };
    const handleStanceSave = async (stance) => {
        try {
            console.log('🔍 Saving stance for character:', formData.id);
            // Call API to save stance
            const response = await fetch(`/api/characters/${formData.id}/stance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(stance)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save stance');
            }
            const result = await response.json();
            console.log('Stance saved successfully:', result);
            // Update local state
            setStanceData(stance);
            setShowStanceEditor(false);
            // Show success message
            alert('Stance saved successfully!');
        }
        catch (error) {
            console.error('Error saving stance:', error);
            alert(`Failed to save stance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const handleStanceCancel = () => {
        setShowStanceEditor(false);
    };
    const loadStanceData = async () => {
        if (!formData.id) {
            console.log('🔍 No character ID for stance loading');
            return;
        }
        console.log('🔍 Loading stance data for character:', formData.id);
        try {
            const response = await fetch(`/characters/${formData.id}/stance.json`);
            console.log('🔍 Stance response status:', response.status);
            if (response.ok) {
                const stance = await response.json();
                console.log('🔍 Stance data loaded:', stance);
                setStanceData(stance);
            }
            else {
                console.log('🔍 No stance file found for character:', formData.id);
            }
        }
        catch (error) {
            console.log('🔍 Error loading stance data:', error);
        }
    };
    const loadStanceDataForCharacter = async (characterId) => {
        console.log('🔍 Loading stance data for character ID:', characterId);
        try {
            const response = await fetch(`${API_BASE}/characters/${characterId}/stance.json`);
            console.log('🔍 Stance response status:', response.status);
            if (response.ok) {
                const stance = await response.json();
                console.log('🔍 Stance data loaded:', stance);
                console.log('🔍 Stance sides:', stance.sides);
                console.log('🔍 First side tree:', stance.sides?.[0]?.tree);
                setStanceData(stance);
            }
            else {
                console.log('🔍 No stance file found for character:', characterId);
            }
        }
        catch (error) {
            console.log('🔍 Error loading stance data:', error);
        }
    };
    const handleDelete = () => {
        if (character && onDelete && window.confirm('Are you sure you want to delete this character?')) {
            onDelete(character.id);
        }
    };
    // Kontrola dostępu
    if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
        return (_jsx("div", { style: { padding: '24px', textAlign: 'center' }, children: _jsx("p", { style: { color: '#ef4444' }, children: "You don't have permission to edit characters" }) }));
    }
    // Zabezpieczenie przed undefined formData
    if (!formData) {
        return (_jsx("div", { style: { padding: '24px', textAlign: 'center' }, children: _jsx("p", { style: { color: '#ef4444' }, children: "Loading..." }) }));
    }
    return (_jsxs("div", { style: {
            maxWidth: '896px',
            margin: '0 auto',
            padding: '24px',
            background: '#111827',
            color: '#f9fafb'
        }, children: [_jsx("h2", { style: {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    color: '#f9fafb'
                }, children: character ? 'Edit Character' : 'Add New Character' }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#f9fafb'
                                }, children: "Basic Information" }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Character Name(s)" }), _jsx("input", { type: "text", value: formData.characterNames || '', onChange: (e) => handleInputChange('characterNames', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, placeholder: "e.g. Ahsoka Tano" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Card Name" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => {
                                            const newName = e.target.value;
                                            handleInputChange('name', newName);
                                            // Auto-generate ID from card name
                                            const generatedId = newName.toLowerCase()
                                                .replace(/[^a-z0-9\s]/g, '')
                                                .replace(/\s+/g, '-')
                                                .replace(/^-+|-+$/g, '');
                                            handleInputChange('id', generatedId);
                                        }, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, placeholder: "e.g. Ahsoka Tano Fulcrum", required: true })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Box Set Code" }), _jsx("input", { type: "text", value: formData.boxSetCode || '', onChange: (e) => handleInputChange('boxSetCode', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, placeholder: "e.g. COR-001, SEP-002" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Portrait" }), formData.portrait && (_jsx("div", { style: { marginBottom: '12px' }, children: _jsx("img", { src: formData.portrait, alt: "Character portrait", style: {
                                                maxWidth: '120px',
                                                maxHeight: '120px',
                                                borderRadius: '6px',
                                                border: '1px solid #374151',
                                                objectFit: 'cover'
                                            } }) })), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("input", { type: "file", accept: "image/*", onChange: (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            handleInputChange('portrait', event.target?.result);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }, style: {
                                                    flex: '1',
                                                    padding: '8px 12px',
                                                    background: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '6px',
                                                    color: '#f9fafb'
                                                } }), _jsx("input", { type: "url", value: formData.portrait || '', onChange: (e) => handleInputChange('portrait', e.target.value), style: {
                                                    flex: '1',
                                                    padding: '8px 12px',
                                                    background: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '6px',
                                                    color: '#f9fafb'
                                                }, placeholder: "Or paste URL..." })] }), formData.portrait && (_jsx("button", { type: "button", onClick: () => handleInputChange('portrait', ''), style: {
                                            marginTop: '8px',
                                            padding: '6px 12px',
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#b91c1c';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#dc2626';
                                        }, children: "Remove Image" }))] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Unit Type" }), _jsxs("select", { value: formData.unit_type, onChange: (e) => handleInputChange('unit_type', e.target.value), className: "select", style: { width: '100%' }, children: [_jsx("option", { value: "Primary", children: "Primary" }), _jsx("option", { value: "Secondary", children: "Secondary" }), _jsx("option", { value: "Support", children: "Support" })] })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#f9fafb',
                                    marginBottom: '8px',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid #374151'
                                }, children: "Statistics" }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: formData.unit_type === 'Primary' ? 'Squad Points (SP)' : 'Point Cost (PC)' }), _jsx("input", { type: "number", value: formData.unit_type === 'Primary' ? formData.squad_points : formData.point_cost, onChange: (e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            if (formData.unit_type === 'Primary') {
                                                handleInputChange('squad_points', value);
                                            }
                                            else {
                                                handleInputChange('point_cost', value);
                                            }
                                        }, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, min: "0", placeholder: formData.unit_type === 'Primary' ? 'SP value' : 'PC value' })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Number of Characters in Unit" }), _jsx("input", { type: "number", value: formData.number_of_characters || 1, onChange: (e) => handleInputChange('number_of_characters', parseInt(e.target.value) || 1), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, min: "1", placeholder: "Number of characters" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Force" }), _jsx("input", { type: "number", value: formData.force, onChange: (e) => handleInputChange('force', parseInt(e.target.value) || 0), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, min: "0", placeholder: "Force points" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Stamina" }), _jsx("input", { type: "number", value: formData.stamina, onChange: (e) => handleInputChange('stamina', parseInt(e.target.value) || 0), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, min: "0", placeholder: "Stamina points" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Durability" }), _jsx("input", { type: "number", value: formData.durability, onChange: (e) => handleInputChange('durability', parseInt(e.target.value) || 0), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: '#f9fafb'
                                        }, min: "0", placeholder: "Durability points" })] })] })] }), _jsxs("div", { style: { marginTop: '24px' }, children: [_jsx("h3", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: '#f9fafb'
                        }, children: "Factions" }), _jsxs("div", { style: { display: 'flex', gap: '8px', marginBottom: '16px' }, children: [_jsxs("select", { value: newFaction, onChange: (e) => setNewFaction(e.target.value), className: "select", style: { flex: '1' }, children: [_jsx("option", { value: "", children: "Select a faction" }), availableFactions
                                        .filter(faction => !(formData.factions || []).includes(faction))
                                        .map(faction => (_jsx("option", { value: faction, children: faction }, faction)))] }), _jsx("button", { onClick: addFaction, disabled: !newFaction, style: {
                                    padding: '8px 16px',
                                    background: newFaction ? '#3b82f6' : '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: newFaction ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    if (newFaction) {
                                        e.currentTarget.style.background = '#2563eb';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (newFaction) {
                                        e.currentTarget.style.background = '#3b82f6';
                                    }
                                }, children: "Add" })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: (formData.factions || []).map((faction, index) => (_jsxs("span", { style: {
                                padding: '4px 12px',
                                background: '#3b82f6',
                                borderRadius: '9999px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'white'
                            }, children: [faction, _jsx("button", { onClick: () => removeFaction(faction), style: {
                                        color: '#93c5fd',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0',
                                        fontSize: '16px',
                                        lineHeight: '1'
                                    }, onMouseEnter: (e) => {
                                        e.currentTarget.style.color = 'white';
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.color = '#93c5fd';
                                    }, children: "\u00D7" })] }, index))) })] }), _jsxs("div", { style: { marginTop: '24px' }, children: [_jsx("h3", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: '#f9fafb'
                        }, children: "Periods" }), _jsxs("div", { style: { display: 'flex', gap: '8px', marginBottom: '16px' }, children: [_jsxs("select", { value: newPeriod, onChange: (e) => setNewPeriod(e.target.value), className: "select", style: { flex: '1' }, children: [_jsx("option", { value: "", children: "Select a period" }), availablePeriods
                                        .filter(period => !(formData.period || []).includes(period))
                                        .map(period => (_jsx("option", { value: period, children: period }, period)))] }), _jsx("button", { onClick: addPeriod, disabled: !newPeriod, style: {
                                    padding: '8px 16px',
                                    background: newPeriod ? '#16a34a' : '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: newPeriod ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s ease'
                                }, onMouseEnter: (e) => {
                                    if (newPeriod) {
                                        e.currentTarget.style.background = '#15803d';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (newPeriod) {
                                        e.currentTarget.style.background = '#16a34a';
                                    }
                                }, children: "Add" })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: (formData.period || []).map((period, index) => (_jsxs("span", { style: {
                                padding: '4px 12px',
                                background: '#16a34a',
                                borderRadius: '9999px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'white'
                            }, children: [period, _jsx("button", { onClick: () => removePeriod(period), style: {
                                        color: '#86efac',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0',
                                        fontSize: '16px',
                                        lineHeight: '1'
                                    }, onMouseEnter: (e) => {
                                        e.currentTarget.style.color = 'white';
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.color = '#86efac';
                                    }, children: "\u00D7" })] }, index))) })] }), _jsxs("div", { style: { marginTop: '24px' }, children: [_jsx("h3", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: '#f9fafb'
                        }, children: "Abilities" }), _jsxs("div", { style: {
                            background: '#1f2937',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }, children: [_jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px'
                                }, children: [_jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    marginBottom: '8px',
                                                    color: '#d1d5db'
                                                }, children: "Type" }), _jsxs("select", { value: newAbility.type, onChange: (e) => handleAbilityChange('type', e.target.value), className: "select", style: { width: '100%' }, children: [_jsx("option", { value: "Active", children: "Active" }), _jsx("option", { value: "Reactive", children: "Reactive" }), _jsx("option", { value: "Innate", children: "Innate" }), _jsx("option", { value: "Tactic", children: "Tactic" }), _jsx("option", { value: "Identity", children: "Identity" })] })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    marginBottom: '8px',
                                                    color: '#d1d5db'
                                                }, children: "Name" }), _jsx("input", { type: "text", value: newAbility.name, onChange: (e) => handleAbilityChange('name', e.target.value), style: {
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    background: '#374151',
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '6px',
                                                    color: '#f9fafb'
                                                }, placeholder: "Ability name" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    marginBottom: '8px',
                                                    color: '#d1d5db'
                                                }, children: "Force Cost" }), _jsx("input", { type: "number", value: newAbility.forceCost, onChange: (e) => handleAbilityChange('forceCost', parseInt(e.target.value) || 0), style: {
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    background: '#374151',
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '6px',
                                                    color: '#f9fafb'
                                                }, min: "0" })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    marginBottom: '8px',
                                                    color: '#d1d5db'
                                                }, children: "Trigger" }), _jsx("select", { value: newAbility.trigger, onChange: (e) => handleAbilityChange('trigger', e.target.value), className: "select", style: { width: '100%' }, children: availableTriggers.map(trigger => (_jsx("option", { value: trigger.value, children: trigger.label }, trigger.value))) })] })] }), _jsxs("div", { style: { marginTop: '16px' }, children: [_jsxs("button", { type: "button", onClick: () => setShowGameSymbols(!showGameSymbols), style: {
                                            padding: '8px 16px',
                                            background: '#7c3aed',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: showGameSymbols ? '12px' : '0',
                                            transition: 'background 0.2s ease'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#6d28d9';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#7c3aed';
                                        }, children: [showGameSymbols ? '▼ Hide' : '▶ Show', " Game Symbols"] }), showGameSymbols && (_jsxs("div", { style: {
                                            background: '#374151',
                                            border: '1px solid #4b5563',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            marginBottom: '12px'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '12px',
                                                    color: '#9ca3af',
                                                    marginBottom: '8px'
                                                }, children: "Click a symbol to insert it into the description:" }), _jsx("div", { style: {
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                                    gap: '8px'
                                                }, children: gameSymbols.map((gameSymbol, index) => (_jsxs("button", { type: "button", onClick: () => insertGameSymbol(gameSymbol.symbol, gameSymbol.name, gameSymbol.unicode), style: {
                                                        padding: '8px',
                                                        background: '#4b5563',
                                                        border: '1px solid #6b7280',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'background 0.2s ease'
                                                    }, onMouseEnter: (e) => {
                                                        e.currentTarget.style.background = '#6b7280';
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.background = '#4b5563';
                                                    }, title: gameSymbol.description, children: [_jsx("span", { style: {
                                                                fontFamily: 'ShatterpointIcons, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                                                                fontSize: '20px',
                                                                color: '#fbbf24'
                                                            }, children: gameSymbol.unicode }), _jsx("span", { style: {
                                                                fontSize: '10px',
                                                                color: '#d1d5db',
                                                                textAlign: 'center'
                                                            }, children: gameSymbol.name })] }, index))) })] }))] }), _jsxs("div", { style: { marginTop: '16px' }, children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            color: '#d1d5db'
                                        }, children: "Description" }), _jsx("textarea", { ref: descriptionTextareaRef, value: newAbility.description, onChange: (e) => handleAbilityChange('description', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#374151',
                                            border: '1px solid #4b5563',
                                            borderRadius: '6px',
                                            color: '#f9fafb',
                                            minHeight: '80px'
                                        }, rows: 3, placeholder: "Ability description (use Game Symbols above to insert [[symbol]] tags)" })] }), _jsxs("div", { style: { display: 'flex', gap: '8px', marginTop: '16px' }, children: [_jsx("button", { onClick: editingAbility ? updateAbility : addAbility, style: {
                                            padding: '8px 16px',
                                            background: '#7c3aed',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'background 0.2s ease'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#6d28d9';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#7c3aed';
                                        }, children: editingAbility ? 'Update Ability' : 'Add Ability' }), editingAbility && (_jsx("button", { onClick: cancelEditAbility, style: {
                                            padding: '8px 16px',
                                            background: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'background 0.2s ease'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#4b5563';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#6b7280';
                                        }, children: "Cancel" }))] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: (formData.structuredAbilities || []).map((ability) => (_jsxs("div", { style: {
                                background: '#1f2937',
                                padding: '12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }, children: [_jsxs("div", { style: { flex: '1' }, children: [_jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '4px'
                                            }, children: [_jsxs("span", { style: { color: '#60a5fa' }, children: ["[", ability.type, "]"] }), _jsx("span", { style: { fontWeight: '600', color: '#f9fafb' }, children: ability.name }), ability.forceCost > 0 && (_jsxs("span", { style: { color: '#fbbf24' }, children: ["Force: ", ability.forceCost] }))] }), _jsx("p", { style: {
                                                color: '#d1d5db',
                                                fontSize: '14px',
                                                margin: 0
                                            }, dangerouslySetInnerHTML: { __html: renderAbilityDescription(ability.description) } })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: () => editAbility(ability), style: {
                                                color: '#60a5fa',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                transition: 'color 0.2s ease'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.color = '#93c5fd';
                                                e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.color = '#60a5fa';
                                                e.currentTarget.style.background = 'none';
                                            }, children: "Edit" }), _jsx("button", { onClick: () => removeAbility(ability.id), style: {
                                                color: '#f87171',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                transition: 'color 0.2s ease'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.color = '#fca5a5';
                                                e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.color = '#f87171';
                                                e.currentTarget.style.background = 'none';
                                            }, children: "Remove" })] })] }, ability.id))) })] }), _jsxs("div", { style: {
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#1f2937',
                    borderRadius: '8px',
                    border: '1px solid #374151'
                }, children: [_jsx("h4", { style: {
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#d1d5db',
                            marginBottom: '12px'
                        }, children: "Stance Data" }), _jsx("p", { style: {
                            fontSize: '14px',
                            color: '#9ca3af',
                            marginBottom: '12px'
                        }, children: "Edit stance data including attack stats, defense, and tree layout." }), _jsx("button", { onClick: () => {
                            console.log('🔍 Edit Stance button clicked');
                            console.log('🔍 Current stanceData:', stanceData);
                            console.log('🔍 Loading stance data...');
                            loadStanceData();
                            setShowStanceEditor(true);
                        }, style: {
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }, children: stanceData ? 'Edit Stance' : 'Create Stance' }), stanceData && (_jsxs("div", { style: {
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: '#111827',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#9ca3af'
                        }, children: ["Stance data loaded: ", stanceData.sides?.length || 0, " sides"] }))] }), _jsxs("div", { style: {
                    marginTop: '32px',
                    display: 'flex',
                    gap: '16px'
                }, children: [_jsx("button", { onClick: handleSave, style: {
                            padding: '12px 24px',
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.background = '#15803d';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.background = '#16a34a';
                        }, children: character ? 'Save Changes' : 'Add Character' }), _jsx("button", { onClick: onCancel, style: {
                            padding: '12px 24px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.background = '#4b5563';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.background = '#6b7280';
                        }, children: "Cancel" }), character && onDelete && (_jsx("button", { onClick: handleDelete, style: {
                            padding: '12px 24px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.background = '#b91c1c';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.background = '#dc2626';
                        }, children: "Delete Character" }))] }), showStanceEditor && (_jsx(StanceEditor, { stance: stanceData, onSave: handleStanceSave, onCancel: handleStanceCancel })), showStanceEditor && (_jsxs("div", { style: {
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    zIndex: 9999
                }, children: [_jsxs("div", { children: ["showStanceEditor: ", showStanceEditor ? 'true' : 'false'] }), _jsxs("div", { children: ["stanceData: ", stanceData ? 'loaded' : 'null'] }), _jsxs("div", { children: ["stanceData.sides: ", stanceData?.sides?.length || 0] }), _jsxs("div", { children: ["stanceData.sides[0].tree: ", stanceData?.sides?.[0]?.tree ? 'exists' : 'missing'] })] }))] }));
};
export default CharacterEditor;
