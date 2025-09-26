import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { AbilityCard } from "./AbilityCard";
import { api } from "../lib/env";
export default function CharacterDetails({ characterId }) {
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadCharacter = async () => {
            try {
                const response = await fetch(api(`/api/characters/${characterId}`));
                if (response.ok) {
                    const data = await response.json();
                    setCharacter(data.character);
                }
            }
            catch (error) {
                console.error('Error loading character:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadCharacter();
    }, [characterId]);
    if (loading) {
        return (_jsx("div", { style: {
                background: '#374151',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af'
            }, children: "Loading character details..." }));
    }
    if (!character) {
        return (_jsx("div", { style: {
                background: '#374151',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                color: '#ef4444'
            }, children: "Failed to load character details" }));
    }
    return (_jsxs("div", { children: [_jsx("h3", { style: {
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#f9fafb',
                    margin: '0 0 16px 0',
                    textAlign: 'center'
                }, children: character.name }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                }, children: [_jsxs("div", { style: {
                            background: '#374151',
                            borderRadius: '6px',
                            padding: '8px',
                            textAlign: 'center'
                        }, children: [_jsx("div", { style: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }, children: "Stamina" }), _jsx("div", { style: { fontSize: '16px', fontWeight: '600', color: '#f9fafb' }, children: character.stamina })] }), _jsxs("div", { style: {
                            background: '#374151',
                            borderRadius: '6px',
                            padding: '8px',
                            textAlign: 'center'
                        }, children: [_jsx("div", { style: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }, children: "Durability" }), _jsx("div", { style: { fontSize: '16px', fontWeight: '600', color: '#f9fafb' }, children: character.durability })] }), _jsxs("div", { style: {
                            background: '#374151',
                            borderRadius: '6px',
                            padding: '8px',
                            textAlign: 'center'
                        }, children: [_jsx("div", { style: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }, children: "Force" }), _jsx("div", { style: { fontSize: '16px', fontWeight: '600', color: '#f9fafb' }, children: character.force })] })] }), _jsx("h4", { style: {
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#f9fafb',
                    margin: '0 0 12px 0'
                }, children: "Abilities" }), _jsx("div", { children: character.abilities && character.abilities.length > 0 ? (character.abilities.map((ability, i) => (_jsx(AbilityCard, { ability: ability, size: "sm", showForceCost: true, showTrigger: false, className: "mb-3" }, `ability-${i}`)))) : character.skills && character.skills.length > 0 ? (
                /* Legacy abilities fallback */
                character.skills.map((skill, i) => (_jsxs("div", { style: {
                        marginBottom: '12px',
                        border: '1px solid #4b5563',
                        borderRadius: '8px',
                        padding: '12px',
                        background: '#374151'
                    }, children: [_jsx("div", { style: { color: '#f9fafb', fontWeight: '600', marginBottom: '4px' }, children: skill.name }), _jsx("div", { style: { color: '#9ca3af', fontSize: '14px' }, children: skill.text })] }, `legacy-${i}`)))) : (_jsx("div", { style: { color: '#9ca3af', fontSize: '14px', textAlign: 'center' }, children: "No abilities available" })) }), character.tags && character.tags.length > 0 && (_jsx("div", { style: { marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: character.tags.map((t, i) => (_jsx("span", { style: {
                        background: '#4b5563',
                        color: '#f9fafb',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }, children: t }, i))) }))] }));
}
