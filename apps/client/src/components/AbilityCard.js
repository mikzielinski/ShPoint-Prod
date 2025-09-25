import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbilityIcon } from './AbilityIcon';
// Map symbols [[token]] -> Unicode character from ShatterpointIcons font
// Using ASCII characters as defined in icons.css and shatterpoint-icons.css
const GLYPH_MAP = {
    force: "\u0076", // v - sp-force
    dash: "\u0068", // h - sp-dash
    jump: "\u0074", // t - sp-jump
    crit: "\u0062", // b - sp-critical
    hit: "\u0061", // a - sp-strike
    block: "\u0065", // e - sp-block
    identify: "\u006D", // m - sp-identify
    strike: "\u0061", // a - sp-strike
    hunker: "\u0033", // 3 - sp-hunker
    ranged: "\u006E", // n - sp-ranged
    "attack-expertise": "\u0063", // c - sp-attack-expertise
    "defense-expertise": "\u0066", // f - sp-defense-expertise
    reposition: "\u0073", // s - sp-reposition
    heal: "\u0072", // r - sp-heal
    durability: "\u0077", // w - sp-durability
    critical: "\u0062", // b - sp-critical
    failure: "\u0064", // d - sp-failure
    melee: "\u006F", // o - sp-melee
    shove: "\u0070", // p - sp-shove
    damage: "\u0071", // q - sp-damage
    pinned: "\u0031", // 1 - sp-pinned
    exposed: "\u0034", // 4 - sp-exposed
    strained: "\u0035", // 5 - sp-strained
    disarm: "\u0039", // 9 - sp-disarm
    climb: "\u0075", // u - sp-climb
    tactic: "\u006B", // k - sp-tactic
    innate: "\u006C", // l - sp-innate
    reactive: "\u0069", // i - sp-reactive
    active: "\u006A", // j - sp-active
};
function renderWithGlyphs(text) {
    if (!text)
        return null;
    const re = /\[\[([^[\]]+)\]\]/g;
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
        if (m.index > last)
            out.push(text.slice(last, m.index));
        const token = m[1].trim().toLowerCase();
        const g = GLYPH_MAP[token];
        out.push(g ? (_jsx("span", { title: token, className: "sp", style: {
                fontSize: "1.1em",
                margin: "0 2px",
                color: "#fbbf24"
            }, children: g }, `${m.index}-${token}`)) : (m[0]));
        last = m.index + m[0].length;
    }
    if (last < text.length)
        out.push(text.slice(last));
    return out;
}
export const AbilityCard = ({ ability, size = 'md', showForceCost = true, showTrigger = false, className = '' }) => {
    const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';
    return (_jsxs("div", { className: `ability-card ${sizeClass} ${className}`, style: {
            marginBottom: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '4px',
            padding: '4px',
            margin: '0 0 4px 0'
        }, onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.border = '1px solid transparent';
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }, children: [_jsx(AbilityIcon, { type: ability.type, size: "md", title: `${ability.type} Ability`, className: "text-white" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }, children: [_jsx("h4", { style: { fontWeight: 'bold', color: 'white', fontSize: '16px', margin: 0 }, children: ability.name }), showForceCost && ability.forceCost > 0 && (_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: Array.from({ length: ability.forceCost }, (_, i) => (_jsxs("span", { className: "text-white", style: {
                                        fontFamily: 'ShatterpointIcons, monospace',
                                        fontSize: '18px'
                                    }, children: ["\u0076", " "] }, i))) }))] })] }), _jsx("div", { style: { marginLeft: '32px' }, children: _jsx("p", { style: { color: '#d1d5db', fontSize: '14px', lineHeight: '1.5', margin: 0 }, children: renderWithGlyphs(ability.description) }) }), false && ability.tags && ability.tags.length > 0 && (_jsx("div", { className: "ml-6 mt-1", children: _jsx("div", { className: "flex flex-wrap gap-1", children: ability.tags.map((tag, index) => (_jsx("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: tag }, index))) }) }))] }));
};
export default AbilityCard;
