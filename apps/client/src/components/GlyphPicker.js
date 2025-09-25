import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const GlyphPicker = ({ onSelect, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    // Glyph categories and their symbols
    const glyphCategories = {
        all: 'All Glyphs',
        dice: 'Dice Results',
        actions: 'Actions',
        symbols: 'Game Symbols',
        abilities: 'Ability Types'
    };
    const glyphs = {
        dice: [
            { symbol: 'a', name: 'Strike', code: 'a' },
            { symbol: 'b', name: 'Critical Hit', code: 'b' },
            { symbol: 'c', name: 'Attack Expertise', code: 'c' },
            { symbol: 'd', name: 'Failure', code: 'd' },
            { symbol: 'e', name: 'Block', code: 'e' },
            { symbol: 'f', name: 'Defense Expertise', code: 'f' }
        ],
        actions: [
            { symbol: 'h', name: 'Dash', code: 'h' },
            { symbol: 'p', name: 'Shove', code: 'p' },
            { symbol: 's', name: 'Reposition', code: 's' },
            { symbol: 't', name: 'Jump', code: 't' },
            { symbol: 'u', name: 'Climb', code: 'u' },
            { symbol: 'r', name: 'Heal', code: 'r' },
            { symbol: 'q', name: 'Damage', code: 'q' }
        ],
        symbols: [
            { symbol: '1', name: 'Pinned', code: '1' },
            { symbol: '3', name: 'Hunker', code: '3' },
            { symbol: '4', name: 'Exposed', code: '4' },
            { symbol: '5', name: 'Strained', code: '5' },
            { symbol: '8', name: 'Unit', code: '8' },
            { symbol: '9', name: 'Disarm', code: '9' },
            { symbol: 'n', name: 'Ranged', code: 'n' },
            { symbol: 'o', name: 'Melee', code: 'o' },
            { symbol: 'v', name: 'Force', code: 'v' },
            { symbol: 'w', name: 'Durability', code: 'w' }
        ],
        abilities: [
            { symbol: 'j', name: 'Active Ability', code: 'j' },
            { symbol: 'i', name: 'Reactive Ability', code: 'i' },
            { symbol: 'l', name: 'Innate Ability', code: 'l' },
            { symbol: 'k', name: 'Tactic Ability', code: 'k' },
            { symbol: 'm', name: 'Identity Ability', code: 'm' }
        ]
    };
    const getAllGlyphs = () => {
        return Object.values(glyphs).flat();
    };
    const getCurrentGlyphs = () => {
        if (selectedCategory === 'all') {
            return getAllGlyphs();
        }
        return glyphs[selectedCategory] || [];
    };
    const handleGlyphClick = (glyph) => {
        onSelect(glyph.code);
        onClose();
    };
    return (_jsx("div", { style: {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }, children: _jsxs("div", { style: {
                background: '#1f2937',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
                border: '1px solid #374151',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }, children: [_jsx("h2", { style: {
                                color: '#f9fafb',
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: '0'
                            }, children: "Shatterpoint Glyph Picker" }), _jsx("button", { onClick: onClose, style: {
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.background = '#374151';
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.background = 'transparent';
                            }, children: "\u00D7" })] }), _jsx("div", { style: {
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px',
                        flexWrap: 'wrap'
                    }, children: Object.entries(glyphCategories).map(([key, label]) => (_jsx("button", { onClick: () => setSelectedCategory(key), style: {
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #4b5563',
                            background: selectedCategory === key ? '#3b82f6' : '#374151',
                            color: '#f9fafb',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }, children: label }, key))) }), _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '12px',
                        maxHeight: '400px',
                        overflow: 'auto'
                    }, children: getCurrentGlyphs().map((glyph, index) => (_jsxs("button", { onClick: () => handleGlyphClick(glyph), style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: '1px solid #4b5563',
                            background: '#374151',
                            color: '#f9fafb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '80px'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.background = '#4b5563';
                            e.currentTarget.style.borderColor = '#3b82f6';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.background = '#374151';
                            e.currentTarget.style.borderColor = '#4b5563';
                        }, children: [_jsx("div", { style: {
                                    fontSize: '24px',
                                    fontFamily: 'ShatterpointIcons, monospace',
                                    marginBottom: '4px'
                                }, children: glyph.symbol }), _jsx("div", { style: {
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    lineHeight: '1.2',
                                    color: '#9ca3af'
                                }, children: glyph.name })] }, index))) }), _jsx("div", { style: {
                        marginTop: '20px',
                        paddingTop: '16px',
                        borderTop: '1px solid #374151',
                        fontSize: '12px',
                        color: '#6b7280',
                        textAlign: 'center'
                    }, children: "Click a glyph to insert it into your content" })] }) }));
};
export default GlyphPicker;
