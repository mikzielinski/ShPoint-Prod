import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const TableAssistantPage = () => {
    const [showModeSelection, setShowModeSelection] = useState(true);
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedTable, setSelectedTable] = useState('');
    const [rollResult, setRollResult] = useState(null);
    const [rollHistory, setRollHistory] = useState([]);
    // Define available tables
    const tables = [
        { id: 'd4', name: 'D4', max: 4 },
        { id: 'd6', name: 'D6', max: 6 },
        { id: 'd8', name: 'D8', max: 8 },
        { id: 'd10', name: 'D10', max: 10 },
        { id: 'd12', name: 'D12', max: 12 },
        { id: 'd20', name: 'D20', max: 20 },
        { id: 'd100', name: 'D100', max: 100 }
    ];
    const rollDice = (max) => {
        const result = Math.floor(Math.random() * max) + 1;
        setRollResult(result);
        const tableName = tables.find(t => t.max === max)?.name || `D${max}`;
        setRollHistory(prev => [
            { table: tableName, result, timestamp: new Date() },
            ...prev.slice(0, 9) // Keep only last 10 rolls
        ]);
    };
    const clearHistory = () => {
        setRollHistory([]);
    };
    return (_jsxs("div", { style: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            color: '#f9fafb'
        }, children: [_jsxs("div", { style: {
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    border: '1px solid #4b5563'
                }, children: [_jsx("h1", { style: {
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#f9fafb',
                            margin: '0 0 8px 0',
                            textAlign: 'center'
                        }, children: "\uD83C\uDFB2 Table Assistant" }), _jsx("p", { style: {
                            fontSize: '18px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            margin: '0 0 32px 0'
                        }, children: "Roll dice and manage your table results" }), _jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '12px',
                            marginBottom: '32px'
                        }, children: tables.map(table => (_jsxs("button", { onClick: () => rollDice(table.max), style: {
                                padding: '16px',
                                background: selectedTable === table.id ? '#3b82f6' : '#374151',
                                border: '2px solid',
                                borderColor: selectedTable === table.id ? '#3b82f6' : '#4b5563',
                                borderRadius: '8px',
                                color: '#f9fafb',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px'
                            }, onMouseEnter: (e) => {
                                if (selectedTable !== table.id) {
                                    e.currentTarget.style.background = '#4b5563';
                                    e.currentTarget.style.borderColor = '#6b7280';
                                }
                            }, onMouseLeave: (e) => {
                                if (selectedTable !== table.id) {
                                    e.currentTarget.style.background = '#374151';
                                    e.currentTarget.style.borderColor = '#4b5563';
                                }
                            }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\uD83C\uDFB2" }), _jsx("span", { children: table.name })] }, table.id))) }), rollResult !== null && (_jsxs("div", { style: {
                            textAlign: 'center',
                            marginBottom: '32px'
                        }, children: [_jsx("div", { style: {
                                    fontSize: '48px',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    marginBottom: '8px'
                                }, children: rollResult }), _jsx("div", { style: {
                                    fontSize: '18px',
                                    color: '#9ca3af'
                                }, children: "Latest Roll Result" })] })), rollHistory.length > 0 && (_jsxs("div", { style: {
                            background: '#111827',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #374151'
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '16px'
                                }, children: [_jsx("h3", { style: {
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            margin: '0'
                                        }, children: "\uD83D\uDCCA Roll History" }), _jsx("button", { onClick: clearHistory, style: {
                                            padding: '6px 12px',
                                            background: '#dc2626',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#f9fafb',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#b91c1c';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#dc2626';
                                        }, children: "Clear" })] }), _jsx("div", { style: {
                                    display: 'grid',
                                    gap: '8px'
                                }, children: rollHistory.map((roll, index) => (_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: '#1f2937',
                                        borderRadius: '6px',
                                        border: '1px solid #374151'
                                    }, children: [_jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }, children: [_jsx("span", { style: {
                                                        fontSize: '18px',
                                                        fontWeight: '600',
                                                        color: '#10b981',
                                                        minWidth: '30px'
                                                    }, children: roll.result }), _jsxs("span", { style: {
                                                        color: '#d1d5db',
                                                        fontSize: '14px'
                                                    }, children: ["on ", roll.table] })] }), _jsx("span", { style: {
                                                color: '#9ca3af',
                                                fontSize: '12px'
                                            }, children: roll.timestamp.toLocaleTimeString() })] }, index))) })] }))] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                }, children: [_jsxs("div", { style: {
                            background: '#1f2937',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #374151'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#f9fafb',
                                    margin: '0 0 12px 0'
                                }, children: "\uD83C\uDFAF Quick Actions" }), _jsxs("div", { style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }, children: [_jsx("button", { onClick: () => rollDice(6), style: {
                                            padding: '12px',
                                            background: '#374151',
                                            border: '1px solid #4b5563',
                                            borderRadius: '6px',
                                            color: '#f9fafb',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#4b5563';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#374151';
                                        }, children: "\uD83C\uDFB2 Roll D6 (Standard)" }), _jsx("button", { onClick: () => rollDice(20), style: {
                                            padding: '12px',
                                            background: '#374151',
                                            border: '1px solid #4b5563',
                                            borderRadius: '6px',
                                            color: '#f9fafb',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.background = '#4b5563';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.background = '#374151';
                                        }, children: "\uD83C\uDFB2 Roll D20 (D&D Style)" })] })] }), _jsxs("div", { style: {
                            background: '#1f2937',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #374151'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#f9fafb',
                                    margin: '0 0 12px 0'
                                }, children: "\uD83D\uDCC8 Statistics" }), _jsxs("div", { style: {
                                    color: '#9ca3af',
                                    fontSize: '14px',
                                    lineHeight: '1.6'
                                }, children: [_jsxs("div", { children: ["Total Rolls: ", rollHistory.length] }), _jsxs("div", { children: ["Average: ", rollHistory.length > 0 ? (rollHistory.reduce((sum, roll) => sum + roll.result, 0) / rollHistory.length).toFixed(2) : '0'] }), _jsxs("div", { children: ["Highest: ", rollHistory.length > 0 ? Math.max(...rollHistory.map(r => r.result)) : '0'] }), _jsxs("div", { children: ["Lowest: ", rollHistory.length > 0 ? Math.min(...rollHistory.map(r => r.result)) : '0'] })] })] })] })] }));
};
export default TableAssistantPage;
