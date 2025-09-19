import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AbilityIcon } from '../components/AbilityIcon';
const HomePage = () => {
    const navigate = useNavigate();
    const { me } = useAuth();
    const updates = [
        {
            id: 'ability-icons',
            date: '2025-09-19',
            title: '🎨 Ability Type Icons',
            description: 'All abilities now display with proper Shatterpoint icons!',
            features: [
                'Unicode-based ability type icons',
                'Active (j), Reactive (i), Innate (l), Tactic (k), Identity (m)',
                'Test: ',
                _jsxs("span", { style: { display: 'inline-flex', gap: '8px', alignItems: 'center' }, children: [_jsx(AbilityIcon, { type: "Active", size: "sm" }), _jsx(AbilityIcon, { type: "Reactive", size: "sm" }), _jsx(AbilityIcon, { type: "Innate", size: "sm" }), _jsx(AbilityIcon, { type: "Tactic", size: "sm" }), _jsx(AbilityIcon, { type: "Identity", size: "sm" }), _jsx("span", { className: "sp-icon-fallback", style: { color: '#ff0000' }, children: "TEST" })] }, "test-icons")
            ],
        },
        {
            id: 'invitation-system',
            date: '2025-09-18',
            title: '🎉 Email Invitation System',
            description: 'Users can now invite others via email with beautiful HTML templates. Admins can manage global invitation limits.',
            features: [
                'Email invitations with HTML templates',
                'Global invitation limits per role',
                'Admin controls for invitation management',
                'Email configuration testing'
            ],
            status: 'completed'
        },
        {
            id: 'user-management',
            date: '2025-09-18',
            title: '👥 Enhanced User Management',
            description: 'Comprehensive admin panel with user management, suspension system, and avatar management.',
            features: [
                'Advanced user suspension system',
                'Custom avatar and username management',
                'Google avatar fallback with initials',
                'Collapsible admin sections'
            ],
            status: 'completed'
        },
        {
            id: 'access-control',
            date: '2025-09-18',
            title: '🔒 Access Control System',
            description: 'Implemented role-based access control with unauthorized and banned user pages.',
            features: [
                'Role-based access control (ADMIN, EDITOR, USER)',
                'Unauthorized user page',
                'Banned user page with countdown timer',
                'Restricted access for banned users'
            ],
            status: 'completed'
        },
        {
            id: 'ui-improvements',
            date: '2025-09-18',
            title: '🎨 UI/UX Improvements',
            description: 'Enhanced user interface with better styling, dropdowns, and responsive design.',
            features: [
                'Intelligent dropdown positioning',
                'Improved modal styling',
                'Better error handling',
                'Responsive design improvements'
            ],
            status: 'completed'
        },
        {
            id: 'strike-teams',
            date: '2025-09-15',
            title: '⚔️ Strike Teams Builder',
            description: 'Create and manage your Shatterpoint strike teams with character combinations.',
            features: [
                'Team composition builder',
                'Character synergy analysis',
                'Save and share teams',
                'Team statistics'
            ],
            status: 'in-progress'
        },
        {
            id: 'character-collections',
            date: '2025-09-10',
            title: '📚 Character Collections',
            description: 'Track your character collection with detailed status and notes.',
            features: [
                'Collection tracking (owned, painted, wishlist)',
                'Character notes and ratings',
                'Collection statistics',
                'Import/export functionality'
            ],
            status: 'completed'
        }
    ];
    const quickActions = [
        {
            title: 'Browse Library',
            description: 'Explore characters, sets, and missions',
            icon: '📚',
            color: '#3b82f6',
            action: () => navigate('/library')
        },
        {
            title: 'My Collection',
            description: 'Manage your character collection',
            icon: '🎯',
            color: '#16a34a',
            action: () => navigate('/my-collection')
        },
        {
            title: 'Strike Teams',
            description: 'Build and manage your teams',
            icon: '⚔️',
            color: '#dc2626',
            action: () => navigate('/my-strike-teams')
        },
        {
            title: 'Admin Panel',
            description: 'Manage users and system settings',
            icon: '⚙️',
            color: '#8b5cf6',
            action: () => navigate('/admin'),
            adminOnly: true
        }
    ];
    const stats = [
        { label: 'Characters Available', value: '200+', color: '#3b82f6' },
        { label: 'Expansion Sets', value: '50+', color: '#16a34a' },
        { label: 'Active Users', value: '1', color: '#dc2626' },
        { label: 'Features Completed', value: '12', color: '#8b5cf6' }
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#16a34a';
            case 'in-progress': return '#f59e0b';
            case 'planned': return '#6b7280';
            default: return '#6b7280';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return '✅';
            case 'in-progress': return '🚧';
            case 'planned': return '📋';
            default: return '📋';
        }
    };
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
                            }, children: "ShPoint Dashboard" }), _jsx("p", { style: {
                                fontSize: '20px',
                                color: '#9ca3af',
                                maxWidth: '600px',
                                margin: '0 auto',
                                lineHeight: '1.6'
                            }, children: "Your central command for Star Wars: Shatterpoint collections and team management" }), me && (_jsxs("div", { style: {
                                marginTop: '20px',
                                fontSize: '16px',
                                color: '#6b7280'
                            }, children: ["Welcome back, ", _jsx("strong", { style: { color: '#f9fafb' }, children: me.username || me.name || me.email })] }))] }), _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }, children: stats.map((stat, index) => (_jsxs("div", { style: {
                            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #374151',
                            textAlign: 'center'
                        }, children: [_jsx("div", { style: {
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    color: stat.color,
                                    marginBottom: '8px'
                                }, children: stat.value }), _jsx("div", { style: {
                                    fontSize: '14px',
                                    color: '#9ca3af',
                                    fontWeight: '500'
                                }, children: stat.label })] }, index))) }), _jsxs("div", { style: {
                        marginBottom: '40px'
                    }, children: [_jsx("h2", { style: {
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#f9fafb',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }, children: "Quick Actions" }), _jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '16px'
                            }, children: quickActions.map((action, index) => {
                                if (action.adminOnly && me?.role !== 'ADMIN')
                                    return null;
                                return (_jsxs("button", { onClick: action.action, style: {
                                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '1px solid #374151',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'left',
                                        width: '100%'
                                    }, onMouseEnter: (e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
                                        e.currentTarget.style.borderColor = action.color;
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#374151';
                                    }, children: [_jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginBottom: '8px'
                                            }, children: [_jsx("div", { style: { fontSize: '24px' }, children: action.icon }), _jsx("div", { style: {
                                                        fontSize: '18px',
                                                        fontWeight: '600',
                                                        color: '#f9fafb'
                                                    }, children: action.title })] }), _jsx("div", { style: {
                                                fontSize: '14px',
                                                color: '#9ca3af',
                                                lineHeight: '1.4'
                                            }, children: action.description })] }, index));
                            }) })] }), _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #374151'
                    }, children: [_jsx("h2", { style: {
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#f9fafb',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: "Recent Updates & Features" }), _jsx("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }, children: updates.map((update, index) => (_jsxs("div", { style: {
                                    background: '#0f172a',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '1px solid #374151',
                                    borderLeft: `4px solid ${getStatusColor(update.status)}`
                                }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            marginBottom: '12px'
                                        }, children: [_jsxs("div", { children: [_jsx("h3", { style: {
                                                            fontSize: '18px',
                                                            fontWeight: '600',
                                                            color: '#f9fafb',
                                                            marginBottom: '4px'
                                                        }, children: update.title }), _jsx("div", { style: {
                                                            fontSize: '12px',
                                                            color: '#6b7280',
                                                            fontWeight: '500'
                                                        }, children: new Date(update.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) })] }), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: `${getStatusColor(update.status)}20`,
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: getStatusColor(update.status)
                                                }, children: [getStatusIcon(update.status), update.status?.toUpperCase() || 'UNKNOWN'] })] }), _jsx("p", { style: {
                                            fontSize: '14px',
                                            color: '#9ca3af',
                                            lineHeight: '1.5',
                                            marginBottom: '16px'
                                        }, children: update.description }), _jsx("div", { style: {
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px'
                                        }, children: update.features.map((feature, featureIndex) => (_jsx("div", { style: {
                                                background: '#1f2937',
                                                color: '#e5e7eb',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }, children: feature }, featureIndex))) })] }, update.id))) })] }), _jsxs("div", { style: {
                        textAlign: 'center',
                        marginTop: '40px',
                        padding: '20px',
                        color: '#6b7280',
                        fontSize: '14px'
                    }, children: [_jsx("p", { children: "ShPoint - Star Wars: Shatterpoint Collection Manager" }), _jsx("p", { style: { marginTop: '8px', fontSize: '12px' }, children: "Built with \u2764\uFE0F for the Shatterpoint community" })] })] }) }));
};
export default HomePage;
