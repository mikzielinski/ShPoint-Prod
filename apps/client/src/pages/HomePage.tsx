import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AbilityIcon } from '../components/AbilityIcon';
import { api } from '../lib/env';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { me } = useAuth();
  const [stats, setStats] = useState({
    characters: 0,
    sets: 0,
    users: 0,
    features: 17
  });
  const [loading, setLoading] = useState(true);

  // Load dynamic stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load characters
        const charactersResponse = await fetch(api('/api/characters'));
        const charactersData = await charactersResponse.json();
        const charactersCount = charactersData.items?.length || 0;

        // Load sets (from local data)
        const { setsData } = await import('../data/sets');
        const setsCount = setsData.length;

        // Load users (if admin, otherwise show current user)
        let usersCount = 0;
        if (me?.role === 'ADMIN') {
          try {
            const usersResponse = await fetch(api('/api/admin/users'));
            const usersData = await usersResponse.json();
            usersCount = usersData.length || 0;
          } catch (error) {
            console.log('Could not load users count:', error);
            usersCount = 1; // Fallback to 1 if admin but can't load
          }
        } else if (me) {
          usersCount = 1; // Show 1 for logged in non-admin users
        }

        setStats({
          characters: charactersCount,
          sets: setsCount,
          users: usersCount,
          features: 17
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to default values
        setStats({
          characters: 0,
          sets: 0,
          users: 0,
          features: 17
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [me?.role]);

  const updates = [
    {
      id: 'strike-teams-ui-update',
      date: '2025-09-20',
      title: '🎯 Enhanced Strike Teams UI',
      description: 'Completely redesigned strike teams interface with improved character display and interaction.',
      features: [
        'Larger character portraits (80x100px) with hover effects',
        'Clickable character portraits opening detailed CharacterModal',
        'Improved squad layout with Squad 1/Squad 2 separation',
        'Character sorting by squad order and role (Primary, Secondary, Support)',
        'Unified design between My Collection and Public Strike Teams pages',
        'Removed redundant modals for direct character access'
      ],
      status: 'completed'
    },
    {
      id: 'character-editor-fixes',
      date: '2025-09-20',
      title: '🔧 Character Editor Improvements',
      description: 'Fixed all linter errors and improved character editor functionality.',
      features: [
        'Fixed 5 TypeScript linter errors',
        'Improved React import handling',
        'Enhanced parameter type definitions',
        'Cleaned up property access issues',
        'Better error handling and validation'
      ],
      status: 'completed'
    },
    {
      id: 'duplicate-character-prevention',
      date: '2025-09-20',
      title: '🚫 Duplicate Character Prevention',
      description: 'Enhanced squad builder to prevent using the same character in multiple squads.',
      features: [
        'Character uniqueness validation across squads',
        'Base character name checking (e.g., "Ahsoka Tano" variants)',
        'Real-time duplicate detection in squad builder',
        'Improved character data structure with characterNames field',
        'Automatic base name extraction for better validation'
      ],
      status: 'completed'
    },
    {
      id: 'public-strike-teams',
      date: '2025-09-20',
      title: '🌐 Public Strike Teams Page',
      description: 'New public page for viewing and sharing strike teams without login requirement.',
      features: [
        'Public access to published strike teams',
        'Character modal integration for detailed card viewing',
        'Expandable/collapsible team cards',
        'User avatar and team statistics display',
        'Responsive design with hover effects'
      ],
      status: 'completed'
    },
    {
      id: 'code-cleanup',
      date: '2025-09-20',
      title: '🧹 Code Cleanup & Optimization',
      description: 'Major code cleanup removing compiled files and improving project structure.',
      features: [
        'Removed 50+ compiled .js files',
        'Kept only source .tsx files for better maintainability',
        'Fixed Vite dev server caching issues',
        'Improved build performance',
        'Cleaner project structure'
      ],
      status: 'completed'
    },
    {
      id: 'ability-icons',
      date: '2025-09-19',
      title: '🎨 Ability Type Icons',
      description: 'All abilities now display with proper Shatterpoint icons!',
      features: [
        'Unicode-based ability type icons',
        'Active (j), Reactive (i), Innate (l), Tactic (k), Identity (m)',
        'Test: ',
        <span key="test-icons" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <AbilityIcon type="Active" size="sm" />
          <AbilityIcon type="Reactive" size="sm" />
          <AbilityIcon type="Innate" size="sm" />
          <AbilityIcon type="Tactic" size="sm" />
          <AbilityIcon type="Identity" size="sm" />
          <span className="sp-icon-fallback" style={{ color: '#ff0000' }}>TEST</span>
        </span>
      ],
      status: 'completed'
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
        'Team statistics',
        'Publish/unpublish functionality',
        'Public strike teams page'
      ],
      status: 'completed'
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
      title: 'Public Teams',
      description: 'Browse shared strike teams',
      icon: '🌐',
      color: '#059669',
      action: () => navigate('/strike-teams')
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

  const statsData = [
    { label: 'Characters Available', value: loading ? '...' : stats.characters.toString(), color: '#3b82f6' },
    { label: 'Expansion Sets', value: loading ? '...' : stats.sets.toString(), color: '#16a34a' },
    { label: 'Active Users', value: loading ? '...' : stats.users.toString(), color: '#dc2626' },
    { label: 'Features Completed', value: stats.features.toString(), color: '#8b5cf6' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in-progress': return '#f59e0b';
      case 'planned': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🚧';
      case 'planned': return '📋';
      default: return '📋';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#f9fafb',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ShPoint News
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Latest updates and features for Star Wars: Shatterpoint collection manager
          </p>
          {me && (
            <div style={{
              marginTop: '20px',
              fontSize: '16px',
              color: '#6b7280'
            }}>
              Welcome back, <strong style={{ color: '#f9fafb' }}>{me.username || me.name || me.email}</strong>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {statsData.map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #374151',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: stat.color,
                marginBottom: '8px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Only for logged in users */}
        {me && (
          <div style={{
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#f9fafb',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Quick Actions
            </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {quickActions.map((action, index) => {
              if (action.adminOnly && me?.role !== 'ADMIN') return null;
              
              return (
                <button
                  key={index}
                  onClick={action.action}
                  style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #374151',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#374151';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '24px' }}>
                      {action.icon}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#f9fafb'
                    }}>
                      {action.title}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    lineHeight: '1.4'
                  }}>
                    {action.description}
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        )}

        {/* Recent Updates */}
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #374151'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#f9fafb',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Latest News & Updates
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {updates.map((update, index) => (
              <div
                key={update.id}
                style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #374151',
                  borderLeft: `4px solid ${getStatusColor(update.status)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#f9fafb',
                      marginBottom: '4px'
                    }}>
                      {update.title}
                    </h3>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {new Date(update.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: `${getStatusColor(update.status)}20`,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: getStatusColor(update.status)
                  }}>
                    {getStatusIcon(update.status)}
                    {update.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  lineHeight: '1.5',
                  marginBottom: '16px'
                }}>
                  {update.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {update.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      style={{
                        background: '#1f2937',
                        color: '#e5e7eb',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <p>
            ShPoint News - Star Wars: Shatterpoint Updates
          </p>
          <p style={{ marginTop: '8px', fontSize: '12px' }}>
            Built with ❤️ for the Shatterpoint community
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
