import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
const api = (path) => `http://localhost:3001${path}`;
export default function PublicStrikeTeamsPage() {
    const { auth } = useAuth();
    // State
    const [strikeTeams, setStrikeTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Load published strike teams
    const loadPublishedTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch(api('/api/shatterpoint/strike-teams/public'));
            const data = await response.json();
            if (data.ok) {
                setStrikeTeams(data.strikeTeams);
                setError(null);
            }
            else {
                setError(data.error || 'Failed to load strike teams');
            }
        }
        catch (err) {
            setError('Failed to load strike teams');
            console.error('Error loading published strike teams:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadPublishedTeams();
    }, []);
    // Helper function to get user display name
    const getUserDisplayName = (user) => {
        if (user.username)
            return user.username;
        if (user.name)
            return user.name;
        return 'Anonymous';
    };
    // Helper function to get user avatar
    const getUserAvatar = (user) => {
        return user.avatarUrl || user.image;
    };
    // Helper function to get user initials
    const getUserInitials = (user) => {
        const name = user.name || user.username || 'Anonymous';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    if (loading) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f9fafb'
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '16px' }, children: "\u2694\uFE0F" }), _jsx("div", { children: "Loading published strike teams..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f9fafb',
                padding: '20px'
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '16px' }, children: "\u274C" }), _jsx("div", { style: { fontSize: '1.2rem', marginBottom: '8px' }, children: "Error" }), _jsx("div", { style: { color: '#ef4444' }, children: error }), _jsx("button", { onClick: loadPublishedTeams, style: {
                            marginTop: '16px',
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }, children: "Try Again" })] }) }));
    }
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '40px 20px',
            color: '#f9fafb'
        }, children: _jsxs("div", { style: {
                maxWidth: '1200px',
                margin: '0 auto',
                fontFamily: '"Inter", sans-serif'
            }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '40px' }, children: [_jsx("h1", { style: {
                                fontSize: '3rem',
                                fontWeight: '800',
                                marginBottom: '16px',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }, children: "Published Strike Teams" }), _jsx("p", { style: {
                                fontSize: '1.2rem',
                                color: '#9ca3af',
                                maxWidth: '600px',
                                margin: '0 auto'
                            }, children: "Discover strike teams shared by the community. Use them as inspiration or challenge them in battle!" })] }), strikeTeams.length === 0 ? (_jsxs("div", { style: {
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#9ca3af'
                    }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '16px' }, children: "\u2694\uFE0F" }), _jsx("div", { style: { fontSize: '1.2rem', marginBottom: '8px' }, children: "No Published Teams Yet" }), _jsx("div", { children: "Be the first to publish your strike team!" })] })) : (_jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px'
                    }, children: strikeTeams.map((team) => (_jsxs("div", { style: {
                            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid #4b5563',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                        }, children: [_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h3", { style: {
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            marginBottom: '8px',
                                            color: '#f9fafb'
                                        }, children: team.name }), team.description && (_jsx("p", { style: {
                                            color: '#9ca3af',
                                            fontSize: '14px',
                                            marginBottom: '12px',
                                            lineHeight: '1.4'
                                        }, children: team.description })), _jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px'
                                        }, children: [getUserAvatar(team.user) ? (_jsx("img", { src: getUserAvatar(team.user), alt: "Author avatar", style: {
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    border: '1px solid #4b5563'
                                                }, onError: (e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                } })) : null, _jsx("div", { style: {
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    display: getUserAvatar(team.user) ? 'none' : 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: 'white'
                                                }, children: getUserInitials(team.user) }), _jsxs("span", { style: {
                                                    fontSize: '14px',
                                                    color: '#d1d5db',
                                                    fontWeight: '500'
                                                }, children: ["by ", getUserDisplayName(team.user)] })] }), _jsx("span", { style: {
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: team.type === 'MY_TEAMS' ? '#16a34a' : '#f59e0b',
                                            color: 'white',
                                            display: 'inline-block'
                                        }, children: team.type === 'MY_TEAMS' ? 'My Team' : 'Dream Team' })] }), _jsxs("div", { style: {
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '20px',
                                    padding: '12px',
                                    background: '#111827',
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#22c55e', fontWeight: 'bold', fontSize: '16px' }, children: team.wins }), _jsx("div", { style: { color: '#9ca3af' }, children: "Wins" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }, children: team.losses }), _jsx("div", { style: { color: '#9ca3af' }, children: "Losses" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }, children: team.draws }), _jsx("div", { style: { color: '#9ca3af' }, children: "Draws" })] }), _jsxs("div", { style: { textAlign: 'center', flex: 1 }, children: [_jsx("div", { style: { color: '#d1d5db', fontWeight: 'bold', fontSize: '16px' }, children: team.characters.length }), _jsx("div", { style: { color: '#9ca3af' }, children: "Units" })] })] }), _jsxs("div", { children: [_jsx("h4", { style: {
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#d1d5db',
                                            marginBottom: '8px'
                                        }, children: "Squad Composition" }), _jsx("div", { style: {
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '8px'
                                        }, children: team.characters.slice(0, 6).map((teamChar) => (_jsxs("div", { style: {
                                                background: '#111827',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: '1px solid #374151',
                                                textAlign: 'center'
                                            }, children: [_jsx("div", { style: {
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: teamChar.role === 'PRIMARY' ? '#3b82f6' :
                                                            teamChar.role === 'SECONDARY' ? '#8b5cf6' : '#10b981',
                                                        marginBottom: '4px'
                                                    }, children: teamChar.role }), _jsx("div", { style: {
                                                        fontSize: '11px',
                                                        color: '#9ca3af',
                                                        lineHeight: '1.2'
                                                    }, children: teamChar.character.name })] }, teamChar.id))) })] }), _jsxs("div", { style: {
                                    marginTop: '16px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #374151',
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    textAlign: 'center'
                                }, children: ["Published ", new Date(team.updatedAt).toLocaleDateString()] })] }, team.id))) }))] }) }));
}
