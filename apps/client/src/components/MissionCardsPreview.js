import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const MissionCardsPreview = ({ mission }) => {
    const [activeObjectives, setActiveObjectives] = useState(new Set());
    const [selectedObjective, setSelectedObjective] = useState(null);
    // Handle objective click
    const handleObjectiveClick = (objectiveKey) => {
        setActiveObjectives(prev => {
            const newActive = new Set(prev);
            if (newActive.has(objectiveKey)) {
                newActive.delete(objectiveKey);
            }
            else {
                newActive.add(objectiveKey);
            }
            return newActive;
        });
        // Show coordinates
        const objective = mission.objectives?.find((obj) => obj.key === objectiveKey);
        if (objective) {
            setSelectedObjective(objective);
        }
    };
    return (_jsxs("div", { style: {
            background: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1000px',
            margin: '0 auto'
        }, children: [_jsx("h2", { style: { fontSize: '28px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#e0e7ff' }, children: mission.name }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '24px',
                    alignItems: 'start'
                }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { background: '#374151', padding: '16px', borderRadius: '8px' }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }, children: "Details" }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "ID:" }), " ", mission.id] }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Source:" }), " ", mission.source] }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Tags:" }), " ", mission.tags?.join(', ')] }), mission.description && _jsxs("p", { children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Description:" }), " ", mission.description] }), mission.notes && _jsxs("p", { children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Notes:" }), " ", mission.notes] })] }), _jsxs("div", { style: { background: '#374151', padding: '16px', borderRadius: '8px' }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }, children: "Map Configuration" }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Size:" }), " ", mission.map?.sizeInch, "\""] }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Origin:" }), " ", mission.map?.origin] }), _jsxs("p", { style: { marginBottom: '5px' }, children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Axis:" }), " ", mission.map?.axis] }), _jsxs("p", { children: [_jsx("strong", { style: { color: '#9ca3af' }, children: "Point Diameter:" }), " ", mission.rendering?.point?.diameterInch, "\""] })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: { background: '#1f2937', padding: '15px', borderRadius: '8px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: '600', color: '#e0e7ff', margin: 0 }, children: "Initial Setup" }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: () => setActiveObjectives(new Set()), style: {
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            background: '#dc2626',
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }, children: "Reset All" }), selectedObjective && (_jsx("button", { onClick: () => setSelectedObjective(null), style: {
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            background: '#6b7280',
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }, children: "Clear Selection" }))] })] }), _jsxs("h4", { style: {
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#e0e7ff',
                                            marginBottom: '12px',
                                            padding: '4px 8px',
                                            background: '#4b5563',
                                            borderRadius: '4px',
                                            display: 'inline-block'
                                        }, children: ["All Objectives (", mission.objectives?.length || 0, ")"] }), _jsx("div", { style: {
                                            width: '360px',
                                            height: '360px',
                                            background: '#1f2937',
                                            border: '2px solid #4b5563',
                                            borderRadius: '8px',
                                            position: 'relative',
                                            marginBottom: '10px'
                                        }, children: _jsxs("svg", { width: "360", height: "360", style: { position: 'absolute', top: 0, left: 0 }, children: [Array.from({ length: 37 }, (_, i) => i - 18).map(x => (_jsx("line", { x1: 180 + x * 10, y1: "0", x2: 180 + x * 10, y2: "360", stroke: x === 0 ? "#4b5563" : "#374151", strokeWidth: x === 0 ? "1" : "0.5" }, `v-${x}`))), Array.from({ length: 37 }, (_, i) => i - 18).map(y => (_jsx("line", { x1: "0", y1: 180 - y * 10, x2: "360", y2: 180 - y * 10, stroke: y === 0 ? "#4b5563" : "#374151", strokeWidth: y === 0 ? "1" : "0.5" }, `h-${y}`))), mission.objectives?.map((objective, index) => {
                                                    // Scale from -18 to +18 range to 0-360 pixel range
                                                    const x = 180 + (objective.x * 10); // 1 inch = 10 pixels
                                                    const y = 180 - (objective.y * 10); // 1 inch = 10 pixels, flip Y axis
                                                    const isActive = activeObjectives.has(objective.key);
                                                    return (_jsxs("g", { children: [_jsx("circle", { cx: x, cy: y, r: "8", fill: isActive ? "#fbbf24" : "#6b7280", stroke: "#1f2937", strokeWidth: "2", style: { cursor: 'pointer' }, onClick: () => handleObjectiveClick(objective.key) }), _jsx("text", { x: x, y: y + 3, textAnchor: "middle", fontSize: "12", fill: "#f3f4f6", fontWeight: "600", style: { cursor: 'pointer', userSelect: 'none' }, onClick: () => handleObjectiveClick(objective.key), children: objective.key })] }, index));
                                                })] }) }), selectedObjective && (_jsxs("div", { style: {
                                            background: '#374151',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            marginBottom: '10px',
                                            border: '1px solid #4b5563'
                                        }, children: [_jsxs("h5", { style: {
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#fbbf24',
                                                    marginBottom: '6px',
                                                    margin: '0 0 6px 0'
                                                }, children: ["Selected Objective: ", selectedObjective.key] }), _jsxs("div", { style: {
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '8px',
                                                    fontSize: '11px'
                                                }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: '#9ca3af' }, children: "X:" }), _jsxs("span", { style: { color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }, children: [selectedObjective.x, "\""] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#9ca3af' }, children: "Y:" }), _jsxs("span", { style: { color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }, children: [selectedObjective.y, "\""] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#9ca3af' }, children: "Radius:" }), _jsxs("span", { style: { color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }, children: [selectedObjective.radius, "\""] })] })] })] })), _jsx("div", { style: {
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                                            gap: '8px',
                                            maxWidth: '360px'
                                        }, children: mission.objectives?.map((objective, index) => {
                                            const isActive = activeObjectives.has(objective.key);
                                            return (_jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '10px',
                                                    color: isActive ? '#fbbf24' : '#9ca3af',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    borderRadius: '3px',
                                                    transition: 'background 0.2s ease',
                                                    background: selectedObjective?.key === objective.key ? '#4b5563' : 'transparent'
                                                }, onClick: () => {
                                                    handleObjectiveClick(objective.key);
                                                    setSelectedObjective(objective);
                                                }, onMouseEnter: (e) => {
                                                    if (selectedObjective?.key !== objective.key) {
                                                        e.currentTarget.style.background = '#374151';
                                                    }
                                                }, onMouseLeave: (e) => {
                                                    if (selectedObjective?.key !== objective.key) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }, children: [_jsx("div", { style: {
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            background: isActive ? '#fbbf24' : '#6b7280',
                                                            border: '1px solid #1f2937'
                                                        } }), _jsx("span", { style: { fontWeight: isActive ? '600' : '400' }, children: objective.key })] }, index));
                                        }) })] }), mission.struggles && mission.struggles.length > 0 && (_jsxs("div", { style: { background: '#1f2937', padding: '15px', borderRadius: '8px' }, children: [_jsxs("h3", { style: { fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }, children: ["Mission Cards (", mission.struggles.length, " struggles)"] }), mission.struggles.map((struggle, struggleIndex) => (_jsx("div", { style: { marginBottom: '20px' }, children: struggle.cards && struggle.cards.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { style: {
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: '#e0e7ff',
                                                        marginBottom: '8px',
                                                        padding: '4px 8px',
                                                        background: '#4b5563',
                                                        borderRadius: '4px',
                                                        display: 'inline-block'
                                                    }, children: ["Struggle ", struggle.index] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }, children: struggle.cards.map((card, cardIndex) => (_jsxs("div", { style: {
                                                            background: '#2d3748',
                                                            padding: '12px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            border: '1px solid #4a5568',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s ease'
                                                        }, onMouseEnter: (e) => {
                                                            e.currentTarget.style.background = '#4a5568';
                                                        }, onMouseLeave: (e) => {
                                                            e.currentTarget.style.background = '#2d3748';
                                                        }, children: [_jsx("div", { style: { color: '#f3f4f6', fontWeight: '600', marginBottom: '10px', fontSize: '12px' }, children: card.name }), _jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'flex-start' }, children: [_jsx("div", { style: { flex: '0 0 auto' }, children: card.options && card.options.length > 0 ? (_jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("div", { style: { color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }, children: "Map Options:" }), _jsx("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: card.options.map((option, optionIndex) => (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx("div", { style: { color: '#fbbf24', fontSize: '9px', marginBottom: '4px', fontWeight: '500' }, children: option.name }), _jsx("div", { style: {
                                                                                                    width: '100px',
                                                                                                    height: '100px',
                                                                                                    background: '#1f2937',
                                                                                                    border: '1px solid #4b5563',
                                                                                                    borderRadius: '4px',
                                                                                                    position: 'relative',
                                                                                                    marginBottom: '4px'
                                                                                                }, children: _jsxs("svg", { width: "100", height: "100", style: { position: 'absolute', top: 0, left: 0 }, children: [[-8, -4, 0, 4, 8].map(x => (_jsx("line", { x1: 50 + x * 2.78, y1: "0", x2: 50 + x * 2.78, y2: "100", stroke: x === 0 ? "#4b5563" : "#374151", strokeWidth: x === 0 ? "0.8" : "0.3" }, `v-${x}`))), [-8, -4, 0, 4, 8].map(y => (_jsx("line", { x1: "0", y1: 50 - y * 2.78, x2: "100", y2: 50 - y * 2.78, stroke: y === 0 ? "#4b5563" : "#374151", strokeWidth: y === 0 ? "0.8" : "0.3" }, `h-${y}`))), option.active.map((objectiveKey) => {
                                                                                                            const objective = mission.objectives?.find((obj) => obj.key === objectiveKey);
                                                                                                            if (!objective)
                                                                                                                return null;
                                                                                                            const x = 50 + (objective.x * 2.78); // Scale 1 inch = 2.78 pixels
                                                                                                            const y = 50 - (objective.y * 2.78); // Scale and flip Y axis
                                                                                                            return (_jsx("circle", { cx: x, cy: y, r: "2.5", fill: "#fbbf24", stroke: "#1f2937", strokeWidth: "1" }, objectiveKey));
                                                                                                        })] }) }), _jsxs("div", { style: { color: '#9ca3af', fontSize: '8px', textAlign: 'center' }, children: ["Active: ", option.active.join(', ')] })] }, optionIndex))) })] })) : card.active && card.active.length > 0 ? (_jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("div", { style: { color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }, children: "Active Objectives:" }), _jsx("div", { style: {
                                                                                        width: '120px',
                                                                                        height: '120px',
                                                                                        background: '#1f2937',
                                                                                        border: '1px solid #4b5563',
                                                                                        borderRadius: '4px',
                                                                                        position: 'relative',
                                                                                        marginBottom: '4px'
                                                                                    }, children: _jsxs("svg", { width: "120", height: "120", style: { position: 'absolute', top: 0, left: 0 }, children: [[-8, -4, 0, 4, 8].map(x => (_jsx("line", { x1: 60 + x * 3.33, y1: "0", x2: 60 + x * 3.33, y2: "120", stroke: x === 0 ? "#4b5563" : "#374151", strokeWidth: x === 0 ? "0.8" : "0.3" }, `v-${x}`))), [-8, -4, 0, 4, 8].map(y => (_jsx("line", { x1: "0", y1: 60 - y * 3.33, x2: "120", y2: 60 - y * 3.33, stroke: y === 0 ? "#4b5563" : "#374151", strokeWidth: y === 0 ? "0.8" : "0.3" }, `h-${y}`))), card.active.map((objectiveKey) => {
                                                                                                const objective = mission.objectives?.find((obj) => obj.key === objectiveKey);
                                                                                                if (!objective)
                                                                                                    return null;
                                                                                                const x = 60 + (objective.x * 3.33); // Scale 1 inch = 3.33 pixels
                                                                                                const y = 60 - (objective.y * 3.33); // Scale and flip Y axis
                                                                                                return (_jsx("circle", { cx: x, cy: y, r: "3", fill: "#fbbf24", stroke: "#1f2937", strokeWidth: "1" }, objectiveKey));
                                                                                            })] }) }), _jsxs("div", { style: { color: '#9ca3af', fontSize: '9px' }, children: ["Active: ", card.active.join(', ')] })] })) : null }), _jsx("div", { style: { flex: '1', minWidth: '200px' }, children: card.specialRules && card.specialRules !== 'N/A' && (_jsxs("div", { children: [_jsx("div", { style: { color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }, children: "Special Rules:" }), _jsx("div", { style: {
                                                                                        color: '#fbbf24',
                                                                                        fontSize: '11px',
                                                                                        lineHeight: '1.4',
                                                                                        padding: '8px',
                                                                                        background: '#374151',
                                                                                        borderRadius: '4px',
                                                                                        border: '1px solid #4b5563'
                                                                                    }, children: card.specialRules })] })) })] })] }, cardIndex))) })] })) }, struggleIndex)))] }))] })] })] }));
};
export default MissionCardsPreview;
