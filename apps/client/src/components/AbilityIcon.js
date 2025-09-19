import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const ABILITY_ICON_CLASSES = {
    Active: 'sp-active',
    Reactive: 'sp-reactive',
    Innate: 'sp-innate',
    Tactic: 'sp-tactic',
    Identity: 'sp-identity'
};
const SIZE_CLASSES = {
    sm: 'sp-icon-sm',
    md: 'sp-icon-md',
    lg: 'sp-icon-lg',
    xl: 'sp-icon-xl'
};
export const AbilityIcon = ({ type, size = 'md', className = '', title }) => {
    const iconClass = ABILITY_ICON_CLASSES[type];
    const sizeClass = SIZE_CLASSES[size];
    // Fallback symbols if font doesn't work - use simpler Unicode symbols
    const fallbackSymbols = {
        Active: '●', // Simple circle
        Reactive: '○', // Empty circle
        Innate: '■', // Square
        Tactic: '▲', // Triangle
        Identity: '◆' // Diamond
    };
    // Use correct Unicode codes from ShatterpointIcons mapping
    const shatterpointSymbols = {
        Active: '\u006A', // j - sp-active
        Reactive: '\u0069', // i - sp-reactive
        Innate: '\u006C', // l - sp-innate
        Tactic: '\u006B', // k - sp-tactic
        Identity: '\u006D' // m - sp-identity
    };
    const [fontLoaded, setFontLoaded] = React.useState(false);
    React.useEffect(() => {
        // Check if ShatterpointIcons font is loaded
        if (document.fonts && document.fonts.check) {
            const checkFont = async () => {
                try {
                    await document.fonts.load('12px ShatterpointIcons');
                    setFontLoaded(document.fonts.check('12px ShatterpointIcons'));
                }
                catch (error) {
                    setFontLoaded(false);
                }
            };
            checkFont();
        }
        else {
            // Fallback for browsers without font API
            setFontLoaded(false);
        }
    }, []);
    return (_jsx("span", { className: `sp-icon ${iconClass} ${sizeClass} ${className}`, title: title || `${type} Ability`, role: "img", "aria-label": `${type} ability icon`, style: { color: 'white', fontSize: '24px' }, children: _jsx("span", { style: { fontFamily: 'ShatterpointIcons', color: 'white' }, children: shatterpointSymbols[type] }) }));
};
export default AbilityIcon;
