import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbilityIcon } from './AbilityIcon';
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
                                    }, children: ["\u0076", " "] }, i))) }))] })] }), _jsx("div", { style: { marginLeft: '32px' }, children: _jsx("p", { style: { color: '#d1d5db', fontSize: '14px', lineHeight: '1.5', margin: 0 }, children: ability.description }) }), false && ability.tags && ability.tags.length > 0 && (_jsx("div", { className: "ml-6 mt-1", children: _jsx("div", { className: "flex flex-wrap gap-1", children: ability.tags.map((tag, index) => (_jsx("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: tag }, index))) }) }))] }));
};
export default AbilityCard;
