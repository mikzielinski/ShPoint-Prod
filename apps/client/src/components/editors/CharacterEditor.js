import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
export const CharacterEditor = ({ character, onSave, onCancel, onDelete }) => {
    const { auth } = useAuth();
    const me = auth.status === 'authenticated' ? auth.user : null;
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        portrait: '',
        squad_points: 0,
        force: 0,
        unit_type: 'Primary',
        stamina: 0,
        durability: 0,
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
    useEffect(() => {
        if (character) {
            setFormData(character);
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
    const addAbility = () => {
        if (newAbility.name.trim()) {
            const ability = {
                ...newAbility,
                id: newAbility.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
            };
            setFormData(prev => ({
                ...prev,
                structuredAbilities: [...prev.structuredAbilities, ability]
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
            structuredAbilities: prev.structuredAbilities.filter(a => a.id !== abilityId)
        }));
    };
    const addFaction = () => {
        if (newFaction.trim() && !formData.factions.includes(newFaction.trim())) {
            setFormData(prev => ({
                ...prev,
                factions: [...prev.factions, newFaction.trim()]
            }));
            setNewFaction('');
        }
    };
    const removeFaction = (faction) => {
        setFormData(prev => ({
            ...prev,
            factions: prev.factions.filter(f => f !== faction)
        }));
    };
    const addPeriod = () => {
        if (newPeriod.trim() && !formData.period.includes(newPeriod.trim())) {
            setFormData(prev => ({
                ...prev,
                period: [...prev.period, newPeriod.trim()]
            }));
            setNewPeriod('');
        }
    };
    const removePeriod = (period) => {
        setFormData(prev => ({
            ...prev,
            period: prev.period.filter(p => p !== period)
        }));
    };
    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('Nazwa postaci jest wymagana');
            return;
        }
        onSave(formData);
    };
    const handleDelete = () => {
        if (character && onDelete && window.confirm('Czy na pewno chcesz usunąć tę postać?')) {
            onDelete(character.id);
        }
    };
    // Kontrola dostępu
    if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
        return (_jsx("div", { className: "p-6 text-center", children: _jsx("p", { className: "text-red-500", children: "Nie masz uprawnie\u0144 do edycji postaci" }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6 bg-gray-900 text-white", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: character ? 'Edytuj postać' : 'Dodaj nową postać' }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Podstawowe informacje" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "ID" }), _jsx("input", { type: "text", value: formData.id, onChange: (e) => handleInputChange('id', e.target.value), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", placeholder: "np. ahsoka-tano-fulcrum" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Nazwa" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", placeholder: "np. Ahsoka Tano Fulcrum", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "URL portretu" }), _jsx("input", { type: "url", value: formData.portrait || '', onChange: (e) => handleInputChange('portrait', e.target.value), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", placeholder: "https://..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Typ jednostki" }), _jsxs("select", { value: formData.unit_type, onChange: (e) => handleInputChange('unit_type', e.target.value), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", children: [_jsx("option", { value: "Primary", children: "Primary" }), _jsx("option", { value: "Secondary", children: "Secondary" }), _jsx("option", { value: "Support", children: "Support" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Statystyki" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Punkty dru\u017Cyny" }), _jsx("input", { type: "number", value: formData.squad_points, onChange: (e) => handleInputChange('squad_points', parseInt(e.target.value) || 0), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Force" }), _jsx("input", { type: "number", value: formData.force, onChange: (e) => handleInputChange('force', parseInt(e.target.value) || 0), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Stamina" }), _jsx("input", { type: "number", value: formData.stamina, onChange: (e) => handleInputChange('stamina', parseInt(e.target.value) || 0), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Durability" }), _jsx("input", { type: "number", value: formData.durability, onChange: (e) => handleInputChange('durability', parseInt(e.target.value) || 0), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded", min: "0" })] })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Frakcje" }), _jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx("input", { type: "text", value: newFaction, onChange: (e) => setNewFaction(e.target.value), className: "flex-1 p-2 bg-gray-800 border border-gray-600 rounded", placeholder: "Dodaj frakcj\u0119", onKeyPress: (e) => e.key === 'Enter' && addFaction() }), _jsx("button", { onClick: addFaction, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded", children: "Dodaj" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: formData.factions.map((faction, index) => (_jsxs("span", { className: "px-3 py-1 bg-blue-600 rounded-full text-sm flex items-center gap-2", children: [faction, _jsx("button", { onClick: () => removeFaction(faction), className: "text-blue-200 hover:text-white", children: "\u00D7" })] }, index))) })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Okresy" }), _jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx("input", { type: "text", value: newPeriod, onChange: (e) => setNewPeriod(e.target.value), className: "flex-1 p-2 bg-gray-800 border border-gray-600 rounded", placeholder: "Dodaj okres", onKeyPress: (e) => e.key === 'Enter' && addPeriod() }), _jsx("button", { onClick: addPeriod, className: "px-4 py-2 bg-green-600 hover:bg-green-700 rounded", children: "Dodaj" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: formData.period.map((period, index) => (_jsxs("span", { className: "px-3 py-1 bg-green-600 rounded-full text-sm flex items-center gap-2", children: [period, _jsx("button", { onClick: () => removePeriod(period), className: "text-green-200 hover:text-white", children: "\u00D7" })] }, index))) })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Umiej\u0119tno\u015Bci" }), _jsxs("div", { className: "bg-gray-800 p-4 rounded mb-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Typ" }), _jsxs("select", { value: newAbility.type, onChange: (e) => handleAbilityChange('type', e.target.value), className: "w-full p-2 bg-gray-700 border border-gray-600 rounded", children: [_jsx("option", { value: "Active", children: "Active" }), _jsx("option", { value: "Reactive", children: "Reactive" }), _jsx("option", { value: "Innate", children: "Innate" }), _jsx("option", { value: "Tactic", children: "Tactic" }), _jsx("option", { value: "Identity", children: "Identity" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Nazwa" }), _jsx("input", { type: "text", value: newAbility.name, onChange: (e) => handleAbilityChange('name', e.target.value), className: "w-full p-2 bg-gray-700 border border-gray-600 rounded", placeholder: "Nazwa umiej\u0119tno\u015Bci" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Koszt Force" }), _jsx("input", { type: "number", value: newAbility.forceCost, onChange: (e) => handleAbilityChange('forceCost', parseInt(e.target.value) || 0), className: "w-full p-2 bg-gray-700 border border-gray-600 rounded", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Trigger" }), _jsx("input", { type: "text", value: newAbility.trigger, onChange: (e) => handleAbilityChange('trigger', e.target.value), className: "w-full p-2 bg-gray-700 border border-gray-600 rounded", placeholder: "np. on_activation" })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Opis" }), _jsx("textarea", { value: newAbility.description, onChange: (e) => handleAbilityChange('description', e.target.value), className: "w-full p-2 bg-gray-700 border border-gray-600 rounded", rows: 3, placeholder: "Opis umiej\u0119tno\u015Bci" })] }), _jsx("button", { onClick: addAbility, className: "mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded", children: "Dodaj umiej\u0119tno\u015B\u0107" })] }), _jsx("div", { className: "space-y-2", children: formData.structuredAbilities.map((ability) => (_jsxs("div", { className: "bg-gray-800 p-3 rounded flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-blue-400", children: ["[", ability.type, "]"] }), _jsx("span", { className: "font-semibold", children: ability.name }), ability.forceCost > 0 && (_jsxs("span", { className: "text-yellow-400", children: ["Force: ", ability.forceCost] }))] }), _jsx("p", { className: "text-gray-300 text-sm mt-1", children: ability.description })] }), _jsx("button", { onClick: () => removeAbility(ability.id), className: "text-red-400 hover:text-red-300 px-2", children: "Usu\u0144" })] }, ability.id))) })] }), _jsxs("div", { className: "mt-8 flex gap-4", children: [_jsx("button", { onClick: handleSave, className: "px-6 py-2 bg-green-600 hover:bg-green-700 rounded", children: character ? 'Zapisz zmiany' : 'Dodaj postać' }), _jsx("button", { onClick: onCancel, className: "px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded", children: "Anuluj" }), character && onDelete && (_jsx("button", { onClick: handleDelete, className: "px-6 py-2 bg-red-600 hover:bg-red-700 rounded", children: "Usu\u0144 posta\u0107" }))] })] }));
};
export default CharacterEditor;
