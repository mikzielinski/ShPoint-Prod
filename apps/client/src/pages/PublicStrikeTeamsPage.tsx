import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

// Types
interface StrikeTeam {
  id: string;
  name: string;
  type: 'MY_TEAMS' | 'DREAM_TEAMS';
  description?: string;
  wins: number;
  losses: number;
  draws: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  characters: StrikeTeamCharacter[];
  user: {
    id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    image?: string;
  };
}

interface StrikeTeamCharacter {
  id: string;
  characterId: string;
  role: 'PRIMARY' | 'SECONDARY' | 'SUPPORT';
  order: number;
  character: {
    id: string;
    name: string;
    role?: string;
    faction?: string;
    portrait?: string;
    tags?: string[];
    sp?: number;
    pc?: number;
    era?: string;
  };
}

const api = (path: string) => `http://localhost:3001${path}`;

export default function PublicStrikeTeamsPage() {
  const { auth } = useAuth();
  
  // State
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load published strike teams
  const loadPublishedTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/shatterpoint/strike-teams/public'));
      const data = await response.json();
      
      if (data.ok) {
        setStrikeTeams(data.strikeTeams);
        setError(null);
      } else {
        setError(data.error || 'Failed to load strike teams');
      }
    } catch (err) {
      setError('Failed to load strike teams');
      console.error('Error loading published strike teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedTeams();
  }, []);

  // Helper function to get user display name
  const getUserDisplayName = (user: StrikeTeam['user']) => {
    if (user.username) return user.username;
    if (user.name) return user.name;
    return 'Anonymous';
  };

  // Helper function to get user avatar
  const getUserAvatar = (user: StrikeTeam['user']) => {
    return user.avatarUrl || user.image;
  };

  // Helper function to get user initials
  const getUserInitials = (user: StrikeTeam['user']) => {
    const name = user.name || user.username || 'Anonymous';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚔️</div>
          <div>Loading published strike teams...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f9fafb',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Error</div>
          <div style={{ color: '#ef4444' }}>{error}</div>
          <button
            onClick={loadPublishedTeams}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
      color: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: '"Inter", sans-serif'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Published Strike Teams
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Discover strike teams shared by the community. Use them as inspiration or challenge them in battle!
          </p>
        </div>

        {/* Teams Grid */}
        {strikeTeams.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚔️</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Published Teams Yet</div>
            <div>Be the first to publish your strike team!</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {strikeTeams.map((team) => (
              <div
                key={team.id}
                style={{
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #4b5563',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
              >
                {/* Team Header */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#f9fafb'
                  }}>
                    {team.name}
                  </h3>
                  
                  {team.description && (
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '14px',
                      marginBottom: '12px',
                      lineHeight: '1.4'
                    }}>
                      {team.description}
                    </p>
                  )}

                  {/* Author Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    {getUserAvatar(team.user) ? (
                      <img
                        src={getUserAvatar(team.user)}
                        alt="Author avatar"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1px solid #4b5563'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{
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
                      }}
                    >
                      {getUserInitials(team.user)}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: '#d1d5db',
                      fontWeight: '500'
                    }}>
                      by {getUserDisplayName(team.user)}
                    </span>
                  </div>

                  {/* Team Type Badge */}
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: team.type === 'MY_TEAMS' ? '#16a34a' : '#f59e0b',
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {team.type === 'MY_TEAMS' ? 'My Team' : 'Dream Team'}
                  </span>
                </div>

                {/* Team Statistics */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '20px',
                  padding: '12px',
                  background: '#111827',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '16px' }}>
                      {team.wins}
                    </div>
                    <div style={{ color: '#9ca3af' }}>Wins</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
                      {team.losses}
                    </div>
                    <div style={{ color: '#9ca3af' }}>Losses</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }}>
                      {team.draws}
                    </div>
                    <div style={{ color: '#9ca3af' }}>Draws</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '16px' }}>
                      {team.characters.length}
                    </div>
                    <div style={{ color: '#9ca3af' }}>Units</div>
                  </div>
                </div>

                {/* Characters Preview */}
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#d1d5db',
                    marginBottom: '8px'
                  }}>
                    Squad Composition
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px'
                  }}>
                    {team.characters.slice(0, 6).map((teamChar) => (
                      <div
                        key={teamChar.id}
                        style={{
                          background: '#111827',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #374151',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: teamChar.role === 'PRIMARY' ? '#3b82f6' : 
                                 teamChar.role === 'SECONDARY' ? '#8b5cf6' : '#10b981',
                          marginBottom: '4px'
                        }}>
                          {teamChar.role}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          lineHeight: '1.2'
                        }}>
                          {teamChar.character.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Published Date */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #374151',
                  fontSize: '12px',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  Published {new Date(team.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
