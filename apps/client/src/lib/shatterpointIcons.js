import { jsx as _jsx } from "react/jsx-runtime";
export const SHATTERPOINT_FONT_FAMILY = 'ShatterpointIcons';
export const shatterIcons = {
    // --- Core combat / dice ---
    attack: '\ue900',
    defense: '\ue901',
    melee: '\ue902',
    ranged: '\ue903',
    crit: '\ue904',
    success: '\ue905',
    failure: '\ue906',
    expertise: '\ue907',
    block: '\ue908',
    strike: '\ue909',
    armor: '\ue90a',
    pierce: '\ue90b',
    // --- Tree / actions ---
    shove: '\ue90c',
    reposition: '\ue90d',
    dash: '\ue90e',
    jump: '\ue90f',
    hunker: '\ue910',
    heal: '\ue911',
    damage: '\ue912',
    strain: '\ue913',
    disarm: '\ue914',
    pin: '\ue915',
    stagger: '\ue916',
    expose: '\ue917',
    focus: '\ue918',
    // --- System / stats ---
    force: '\ue919',
    stamina: '\ue91a',
    durability: '\ue91b',
    // --- Factions / tags ---
    clone: '\ue91c', // Clones / GAR related
    mandalorian: '\ue91d',
    republic: '\ue91e',
    separatist: '\ue91f',
    empire: '\ue920',
    rebel: '\ue921',
    bounty: '\ue922', // Bounty Hunter
    scum: '\ue923', // Scum & Villainy / Underworld
    neutral: '\ue924',
    // --- UI helpers ---
    arrowLeft: '\ue925',
    arrowRight: '\ue926',
    arrowUp: '\ue927',
    arrowDown: '\ue928',
};
// Lightweight React component for rendering icons safely
export function SPIcon({ name, title, className = '', ariaHidden = true, }) {
    const glyph = shatterIcons[name];
    return (_jsx("span", { className: `inline-block leading-none select-none ${className}`, style: { fontFamily: SHATTERPOINT_FONT_FAMILY }, role: ariaHidden ? undefined : 'img', "aria-hidden": ariaHidden, title: title, children: glyph }));
}
