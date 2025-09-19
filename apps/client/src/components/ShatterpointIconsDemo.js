import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbilityIcon } from './AbilityIcon';
export const ShatterpointIconsDemo = () => {
    const abilityTypes = ['Active', 'Reactive', 'Innate', 'Tactic', 'Identity'];
    const gameIcons = [
        { name: 'Damage', class: 'sp-damage', description: 'q - Damage' },
        { name: 'Heal', class: 'sp-heal', description: 'r - Heal' },
        { name: 'Shove', class: 'sp-shove', description: 'p - Shove' },
        { name: 'Force', class: 'sp-force', description: 'v - Force' },
        { name: 'Critical', class: 'sp-critical', description: 'b - Critical' },
        { name: 'Block', class: 'sp-block', description: 'e - Block' },
        { name: 'Strike', class: 'sp-strike', description: 'a - Strike' },
        { name: 'Failure', class: 'sp-failure', description: 'd - Failure' },
        { name: 'Attack Expertise', class: 'sp-attack-expertise', description: 'c - Attack expertise' },
        { name: 'Defense Expertise', class: 'sp-defense-expertise', description: 'f - Defense expertise' },
        { name: 'Dash', class: 'sp-dash', description: 'h - Dash' },
        { name: 'Jump', class: 'sp-jump', description: 't - Jump' },
        { name: 'Climb', class: 'sp-climb', description: 'u - Climb' },
        { name: 'Reposition', class: 'sp-reposition', description: 's - Reposition' },
        { name: 'Melee', class: 'sp-melee', description: 'o - Melee' },
        { name: 'Ranged', class: 'sp-ranged', description: 'n - Ranged' },
        { name: 'Unit', class: 'sp-unit', description: '8 - Unit' },
        { name: 'Durability', class: 'sp-durability', description: 'w - Durability' },
        { name: 'Pinned', class: 'sp-pinned', description: '1 - Pinned' },
        { name: 'Hunker', class: 'sp-hunker', description: '3 - Hunker' },
        { name: 'Exposed', class: 'sp-exposed', description: '4 - Exposed' },
        { name: 'Strained', class: 'sp-strained', description: '5 - Strained' },
        { name: 'Disarm', class: 'sp-disarm', description: '9 - Disarm' }
    ];
    return (_jsxs("div", { className: "p-6 bg-gray-900 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Star Wars: Shatterpoint Icons" }), _jsxs("section", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Ability Types" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: abilityTypes.map((type) => (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-gray-800 rounded-lg", children: [_jsx(AbilityIcon, { type: type, size: "lg" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: type }), _jsxs("div", { className: "text-sm text-gray-400", children: [type === 'Active' && 'j - Active', type === 'Reactive' && 'i - Reactive', type === 'Innate' && 'l - Innate', type === 'Tactic' && 'k - Tactic', type === 'Identity' && 'm - Identity'] })] })] }, type))) })] }), _jsxs("section", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Game Effects" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", children: gameIcons.map((icon) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-gray-800 rounded", children: [_jsx("span", { className: `sp-icon ${icon.class} sp-icon-md` }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium", children: icon.name }), _jsx("div", { className: "text-xs text-gray-400", children: icon.description })] })] }, icon.class))) })] }), _jsxs("section", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Icon Sizes" }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "sp-icon sp-active sp-icon-sm" }), _jsx("span", { className: "text-sm", children: "Small (sm)" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "sp-icon sp-active sp-icon-md" }), _jsx("span", { className: "text-sm", children: "Medium (md)" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "sp-icon sp-active sp-icon-lg" }), _jsx("span", { className: "text-sm", children: "Large (lg)" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "sp-icon sp-active sp-icon-xl" }), _jsx("span", { className: "text-sm", children: "Extra Large (xl)" })] })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Usage Examples" }), _jsx("div", { className: "bg-gray-800 p-4 rounded-lg", children: _jsx("pre", { className: "text-sm text-gray-300", children: `// React Component
<AbilityIcon type="Active" size="md" />

// CSS Classes
<span className="sp-icon sp-active sp-icon-lg"></span>
<span className="sp-icon sp-damage sp-icon-md"></span>
<span className="sp-icon sp-force sp-icon-sm"></span>` }) })] })] }));
};
export default ShatterpointIconsDemo;
