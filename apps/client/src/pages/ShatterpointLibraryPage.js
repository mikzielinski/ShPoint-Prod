import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
const ShatterpointLibraryPage = () => {
    const navigate = useNavigate();
    const { me } = useAuth();
    const categories = [
        {
            id: 'characters',
            title: 'Characters',
            description: 'Browse and manage your character collection',
            icon: '👥',
            color: '#3b82f6',
            path: '/characters',
            stats: '200+ characters available'
        },
        {
            id: 'sets',
            title: 'Sets & Boxes',
            description: 'Track your expansion sets and core boxes',
            icon: '📦',
            color: '#16a34a',
            path: '/sets',
            stats: '50+ sets available'
        },
        {
            id: 'missions',
            title: 'Missions',
            description: 'Complete missions and track campaign progress',
            icon: '🎯',
            color: '#dc2626',
            path: '/missions',
            stats: 'Campaign mode coming soon'
        }
    ];
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '20px'
        }, children: _jsxs("div", { style: {
                maxWidth: '1200px',
                margin: '0 auto'
            }, children: [_jsxs("div", { style: {
                        textAlign: 'center',
                        marginBottom: '40px'
                    }, children: [_jsx("h1", { style: {
                                fontSize: '48px',
                                fontWeight: '800',
                                color: '#f9fafb',
                                marginBottom: '16px',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }, children: "Shatterpoint Library" }), _jsx("p", { style: {
                                fontSize: '20px',
                                color: '#9ca3af',
                                maxWidth: '600px',
                                margin: '0 auto',
                                lineHeight: '1.6'
                            }, children: "Your central command for Star Wars: Shatterpoint collections, teams, and campaigns" })] }), _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '24px',
                        marginBottom: '40px'
                    }, children: categories.map((category) => (_jsxs("div", { onClick: () => navigate(category.path), style: {
                            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                            borderRadius: '16px',
                            padding: '32px',
                            border: '1px solid #374151',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                            e.currentTarget.style.borderColor = category.color;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#374151';
                        }, children: [_jsx("div", { style: {
                                    position: 'absolute',
                                    top: '-50%',
                                    right: '-50%',
                                    width: '200%',
                                    height: '200%',
                                    background: `radial-gradient(circle, ${category.color}20 0%, transparent 70%)`,
                                    opacity: 0.1
                                } }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [_jsx("div", { style: {
                                            fontSize: '48px',
                                            marginBottom: '16px'
                                        }, children: category.icon }), _jsx("h2", { style: {
                                            fontSize: '24px',
                                            fontWeight: '700',
                                            color: '#f9fafb',
                                            marginBottom: '12px'
                                        }, children: category.title }), _jsx("p", { style: {
                                            fontSize: '16px',
                                            color: '#9ca3af',
                                            marginBottom: '20px',
                                            lineHeight: '1.5'
                                        }, children: category.description }), _jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }, children: [_jsx("span", { style: {
                                                    fontSize: '14px',
                                                    color: category.color,
                                                    fontWeight: '600'
                                                }, children: category.stats }), _jsx("div", { style: {
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: category.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }, children: "\u2192" })] })] })] }, category.id))) }), me && (_jsxs("div", { style: {
                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #374151'
                    }, children: [_jsx("h3", { style: {
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#f9fafb',
                                marginBottom: '16px',
                                textAlign: 'center'
                            }, children: "Your Collection Overview" }), _jsxs("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px'
                            }, children: [_jsxs("div", { style: {
                                        textAlign: 'center',
                                        padding: '16px',
                                        background: '#0f172a',
                                        borderRadius: '8px',
                                        border: '1px solid #374151'
                                    }, children: [_jsx("div", { style: {
                                                fontSize: '24px',
                                                fontWeight: '700',
                                                color: '#3b82f6',
                                                marginBottom: '4px'
                                            }, children: "0" }), _jsx("div", { style: {
                                                fontSize: '14px',
                                                color: '#9ca3af'
                                            }, children: "Characters Owned" })] }), _jsxs("div", { style: {
                                        textAlign: 'center',
                                        padding: '16px',
                                        background: '#0f172a',
                                        borderRadius: '8px',
                                        border: '1px solid #374151'
                                    }, children: [_jsx("div", { style: {
                                                fontSize: '24px',
                                                fontWeight: '700',
                                                color: '#16a34a',
                                                marginBottom: '4px'
                                            }, children: "0" }), _jsx("div", { style: {
                                                fontSize: '14px',
                                                color: '#9ca3af'
                                            }, children: "Sets Owned" })] }), _jsxs("div", { style: {
                                        textAlign: 'center',
                                        padding: '16px',
                                        background: '#0f172a',
                                        borderRadius: '8px',
                                        border: '1px solid #374151'
                                    }, children: [_jsx("div", { style: {
                                                fontSize: '24px',
                                                fontWeight: '700',
                                                color: '#dc2626',
                                                marginBottom: '4px'
                                            }, children: "0" }), _jsx("div", { style: {
                                                fontSize: '14px',
                                                color: '#9ca3af'
                                            }, children: "Missions Completed" })] })] })] }))] }) }));
};
export default ShatterpointLibraryPage;
