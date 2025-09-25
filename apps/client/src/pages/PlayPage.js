import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
const PlayPage = () => {
    return (_jsx("div", { style: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            color: '#f9fafb'
        }, children: _jsxs("div", { style: {
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
                    }, children: "\uD83C\uDFAE Play Strike Teams" }), _jsx("p", { style: {
                        fontSize: '18px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        margin: '0 0 32px 0'
                    }, children: "Battle with your strike teams from My Collection" }), _jsxs("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }, children: [_jsx(NavLink, { to: "/play/hero-vs-hero", style: {
                                textDecoration: 'none',
                                color: 'inherit'
                            }, children: _jsxs("div", { style: {
                                    background: '#1f2937',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '2px solid #374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.background = '#374151';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.borderColor = '#374151';
                                    e.currentTarget.style.background = '#1f2937';
                                }, children: [_jsx("div", { style: {
                                            fontSize: '48px',
                                            marginBottom: '16px'
                                        }, children: _jsx("span", { className: "sp sp-melee", style: { fontSize: '48px', color: '#f97316' }, children: "o" }) }), _jsx("h3", { style: {
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            margin: '0 0 8px 0'
                                        }, children: "Hero vs Hero" }), _jsx("p", { style: {
                                            fontSize: '14px',
                                            color: '#9ca3af',
                                            margin: '0'
                                        }, children: "Battle between individual characters from your collection" })] }) }), _jsx(NavLink, { to: "/play/strike-team-vs-strike-team", style: {
                                textDecoration: 'none',
                                color: 'inherit'
                            }, children: _jsxs("div", { style: {
                                    background: '#1f2937',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '2px solid #374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.background = '#374151';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.borderColor = '#374151';
                                    e.currentTarget.style.background = '#1f2937';
                                }, children: [_jsx("div", { style: {
                                            fontSize: '48px',
                                            marginBottom: '16px'
                                        }, children: "\uD83C\uDFAF" }), _jsx("h3", { style: {
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#f9fafb',
                                            margin: '0 0 8px 0'
                                        }, children: "Strike Team vs Strike Team" }), _jsx("p", { style: {
                                            fontSize: '14px',
                                            color: '#9ca3af',
                                            margin: '0'
                                        }, children: "Full squad battles with your strike teams" })] }) })] })] }) }));
};
export default PlayPage;
