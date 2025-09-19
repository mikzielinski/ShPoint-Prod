import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
export const MissionModal = ({ mission, onClose }) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [zoom, setZoom] = useState(1);
    const activeObjectives = useMemo(() => {
        if (!selectedCard)
            return [];
        if (selectedCard.active) {
            return selectedCard.active;
        }
        // Use the selected option for the current card, or option 0 if none selected
        const optionIndex = selectedOptions[selectedCard.name] || 0;
        if (selectedCard.options && selectedCard.options[optionIndex]) {
            return selectedCard.options[optionIndex].active;
        }
        return [];
    }, [selectedCard, selectedOptions]);
    const getObjectiveColor = (objectiveKey) => {
        if (activeObjectives.includes(objectiveKey)) {
            return mission.rendering.point.colorActive;
        }
        return mission.rendering.point.colorInactive;
    };
    const handleCardClick = (card) => {
        setSelectedCard(card);
        // Initialize option 0 for this card if not set
        if (card.options && !(card.name in selectedOptions)) {
            setSelectedOptions(prev => ({ ...prev, [card.name]: 0 }));
        }
    };
    const handleOptionClick = (card, optionIndex) => {
        setSelectedCard(card);
        setSelectedOptions(prev => ({ ...prev, [card.name]: optionIndex }));
    };
    // Calculate map dimensions and scaling
    const baseMapSize = 400; // Fixed size for the modal
    const mapSize = baseMapSize * zoom;
    const scale = mapSize / mission.map.sizeInch;
    const centerX = mapSize / 2;
    const centerY = mapSize / 2;
    // Map range: -18 to 18 (36 inches total)
    const mapRange = mission.map.sizeInch;
    const scaleToPixels = mapSize / mapRange;
    return (_jsx("div", { style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }, children: _jsxs("div", { style: {
                backgroundColor: '#1a1a2e',
                border: '2px solid #444',
                borderRadius: '12px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '20px',
                position: 'relative'
            }, children: [_jsx("button", { onClick: onClose, style: {
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }, children: "\u00D7" }), _jsxs("div", { style: { marginBottom: '20px', textAlign: 'center' }, children: [_jsx("h2", { style: { color: '#ffd700', margin: '0 0 10px 0' }, children: mission.name }), mission.description && (_jsx("p", { style: { color: '#ccc', margin: '0 0 10px 0' }, children: mission.description }))] }), _jsxs("div", { style: { display: 'flex', gap: '20px', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { flex: '1', minWidth: '400px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }, children: [_jsx("h3", { style: { color: '#fff', margin: 0 }, children: "Game Map" }), _jsxs("div", { style: { display: 'flex', gap: '10px', alignItems: 'center' }, children: [_jsx("button", { onClick: () => setZoom(Math.max(0.5, zoom - 0.25)), style: {
                                                        background: '#444',
                                                        color: '#fff',
                                                        border: '1px solid #666',
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }, children: "-" }), _jsxs("span", { style: { color: '#fff', fontSize: '12px', minWidth: '40px', textAlign: 'center' }, children: [Math.round(zoom * 100), "%"] }), _jsx("button", { onClick: () => setZoom(Math.min(2, zoom + 0.25)), style: {
                                                        background: '#444',
                                                        color: '#fff',
                                                        border: '1px solid #666',
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }, children: "+" })] })] }), _jsx("div", { style: {
                                        maxWidth: '400px',
                                        maxHeight: '400px',
                                        overflow: 'auto',
                                        border: '2px solid #444',
                                        borderRadius: '8px',
                                        margin: '0 auto'
                                    }, children: _jsxs("div", { style: {
                                            position: 'relative',
                                            width: mapSize,
                                            height: mapSize,
                                            backgroundColor: '#2a2a3e',
                                            minWidth: '400px',
                                            minHeight: '400px'
                                        }, children: [_jsxs("svg", { width: mapSize, height: mapSize, style: { position: 'absolute', top: 0, left: 0 }, children: [Array.from({ length: Math.floor(mapRange / 2) + 1 }, (_, i) => {
                                                        const x = centerX + ((i - mapRange / 4) * 2 * scaleToPixels);
                                                        return (_jsx("line", { x1: x, y1: 0, x2: x, y2: mapSize, stroke: "#666", strokeWidth: "1" }, `v-${i}`));
                                                    }), Array.from({ length: Math.floor(mapRange / 2) + 1 }, (_, i) => {
                                                        const y = centerY - ((i - mapRange / 4) * 2 * scaleToPixels);
                                                        return (_jsx("line", { x1: 0, y1: y, x2: mapSize, y2: y, stroke: "#666", strokeWidth: "1" }, `h-${i}`));
                                                    })] }), _jsxs("svg", { width: mapSize, height: mapSize, style: { position: 'absolute', top: 0, left: 0 }, children: [Array.from({ length: Math.floor(mapRange / 2) + 1 }, (_, i) => {
                                                        const x = centerX + ((i - mapRange / 4) * 2 * scaleToPixels);
                                                        const value = (i - mapRange / 4) * 2;
                                                        return (_jsx("text", { x: x, y: mapSize - 5, textAnchor: "middle", fill: "#888", fontSize: "10", children: value }, `x-label-${i}`));
                                                    }), Array.from({ length: Math.floor(mapRange / 2) + 1 }, (_, i) => {
                                                        const y = centerY - ((i - mapRange / 4) * 2 * scaleToPixels);
                                                        const value = (i - mapRange / 4) * 2;
                                                        return (_jsx("text", { x: 5, y: y + 3, textAnchor: "start", fill: "#888", fontSize: "10", children: value }, `y-label-${i}`));
                                                    })] }), _jsx("svg", { width: mapSize, height: mapSize, style: { position: 'absolute', top: 0, left: 0, zIndex: 10 }, children: mission.objectives.map((objective) => {
                                                    // Convert from coordinate range to pixel coordinates
                                                    const x = centerX + (objective.x * scaleToPixels);
                                                    const y = centerY - (objective.y * scaleToPixels); // Flip Y axis
                                                    const radius = objective.radius * scaleToPixels;
                                                    const color = getObjectiveColor(objective.key);
                                                    return (_jsx("circle", { cx: x, cy: y, r: radius, fill: color, stroke: "#fff", strokeWidth: "2", style: {
                                                            cursor: 'pointer',
                                                            filter: color === '#ffd700' ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' : 'none'
                                                        } }, objective.key));
                                                }) })] }) }), _jsx("div", { style: {
                                        marginTop: '15px',
                                        padding: '12px',
                                        backgroundColor: '#333',
                                        borderRadius: '6px',
                                        border: '1px solid #555',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        minHeight: '60px'
                                    }, children: selectedCard && selectedCard.specialRules && selectedCard.specialRules !== "N/A" ? (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                                    fontSize: '14px',
                                                    color: '#ffd700',
                                                    fontWeight: 'bold',
                                                    marginBottom: '5px'
                                                }, children: "Active Special Rule:" }), _jsx("div", { style: {
                                                    fontSize: '13px',
                                                    color: '#eee',
                                                    lineHeight: '1.4'
                                                }, children: selectedCard.specialRules })] })) : (_jsx("div", { style: {
                                            fontSize: '13px',
                                            color: '#888',
                                            fontStyle: 'italic'
                                        }, children: "Click on a card to see special rules" })) })] }), _jsxs("div", { style: { flex: '1', minWidth: '300px' }, children: [_jsx("h3", { style: { color: '#fff', marginBottom: '15px' }, children: "Struggles" }), mission.struggles.map((struggle) => (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsxs("h4", { style: {
                                                color: '#ffd700',
                                                marginBottom: '10px',
                                                fontSize: '16px'
                                            }, children: ["Struggle ", struggle.index] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: struggle.cards.map((card, cardIndex) => (_jsxs("div", { onClick: () => handleCardClick(card), style: {
                                                    backgroundColor: selectedCard === card ? '#444' : '#333',
                                                    border: selectedCard === card ? '2px solid #ffd700' : '1px solid #555',
                                                    borderRadius: '6px',
                                                    padding: '10px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }, children: [_jsx("div", { style: {
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            marginBottom: '5px'
                                                        }, children: card.name }), card.options && (_jsx("div", { style: { marginTop: '8px' }, children: card.options.map((option, optionIndex) => {
                                                            // Show the saved option for this card, or 0 if none saved
                                                            const currentOption = selectedOptions[card.name] || 0;
                                                            return (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    handleOptionClick(card, optionIndex);
                                                                }, style: {
                                                                    backgroundColor: currentOption === optionIndex ? '#ffd700' : '#555',
                                                                    color: currentOption === optionIndex ? '#000' : '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '4px 8px',
                                                                    margin: '2px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }, children: option.name }, optionIndex));
                                                        }) }))] }, cardIndex))) })] }, struggle.index)))] })] })] }) }));
};
