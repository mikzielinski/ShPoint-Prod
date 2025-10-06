import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import ApiTokenManager from './ApiTokenManager';
import MyGames from './MyGames';
import Inbox from './Inbox';
import { ShPointLogo } from './ShPointLogo';

interface ComprehensiveStatsData {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPlayTimeHours: number;
  collection: {
    characters: { owned: number; total: number; completion: number };
    sets: { owned: number; total: number; completion: number };
    missions: { owned: number; total: number; completion: number };
  };
  favoriteMissions: Array<{
    missionId: string;
    _count: { missionId: number };
    mission: { id: string; name: string; thumbnailUrl?: string } | null;
  }>;
  favoriteCharacters: Array<{
    characterId: string;
    _count: { characterId: number };
    character: { id: string; name: string; portraitUrl?: string } | null;
  }>;
  favoriteCards: Array<{
    id: string;
    character: { id: string; name: string; portraitUrl?: string };
  }>;
  strikeTeams: {
    total: number;
    totalWins: number;
    totalLosses: number;
  };
  challenges: {
    sent: number;
    received: number;
    accepted: number;
  };
  recentGames: Array<{
    id: string;
    result: string;
    playedAt: string;
    player1: { id: string; name?: string; username?: string };
    player2: { id: string; name?: string; username?: string };
    winner?: { id: string; name?: string; username?: string };
    mission?: { id: string; name: string; thumbnailUrl?: string };
  }>;
}

function ComprehensiveStats() {
  const [stats, setStats] = useState<ComprehensiveStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(api('/api/v2/user/comprehensive-stats'), {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.ok) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('Failed to load comprehensive stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        Loading comprehensive statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        No statistics available
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#f9fafb', margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>
        📊 My Comprehensive Statistics
      </h3>

      {/* Game Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          🎮 Game Statistics
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Games Played</h5>
            <p style={{ color: '#10b981', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.gamesPlayed}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Win Rate</h5>
            <p style={{ color: '#3b82f6', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.winRate}%</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Wins</h5>
            <p style={{ color: '#10b981', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.wins}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Losses</h5>
            <p style={{ color: '#ef4444', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.losses}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Draws</h5>
            <p style={{ color: '#f59e0b', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.draws}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Total Play Time</h5>
            <p style={{ color: '#8b5cf6', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.totalPlayTimeHours}h</p>
          </div>
        </div>
      </div>

      {/* Collection Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          📚 Collection Progress
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Characters</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#d1d5db', fontSize: '16px' }}>{stats.collection.characters.owned}/{stats.collection.characters.total}</span>
              <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>{stats.collection.characters.completion}%</span>
            </div>
            <div style={{ 
              background: '#1f2937', 
              height: '8px', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                background: '#10b981', 
                height: '100%', 
                width: `${stats.collection.characters.completion}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Sets/Boxes</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#d1d5db', fontSize: '16px' }}>{stats.collection.sets.owned}/{stats.collection.sets.total}</span>
              <span style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 'bold' }}>{stats.collection.sets.completion}%</span>
            </div>
            <div style={{ 
              background: '#1f2937', 
              height: '8px', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                background: '#3b82f6', 
                height: '100%', 
                width: `${stats.collection.sets.completion}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Missions</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#d1d5db', fontSize: '16px' }}>{stats.collection.missions.owned}/{stats.collection.missions.total}</span>
              <span style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 'bold' }}>{stats.collection.missions.completion}%</span>
            </div>
            <div style={{ 
              background: '#1f2937', 
              height: '8px', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                background: '#f59e0b', 
                height: '100%', 
                width: `${stats.collection.missions.completion}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Favorite Cards */}
      {stats.favoriteCards.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
            ❤️ Top 10 Favorite Cards
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '12px' 
          }}>
            {stats.favoriteCards.map((card, index) => (
              <div key={card.id} style={{
                background: '#374151',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #4b5563',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#f59e0b', 
                  fontWeight: 'bold', 
                  marginBottom: '4px' 
                }}>
                  #{index + 1}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#f9fafb', 
                  fontWeight: '500',
                  lineHeight: '1.2'
                }}>
                  {card.character.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Played Characters */}
      {stats.favoriteCharacters.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
            🎯 Most Played Characters
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '12px' 
          }}>
            {stats.favoriteCharacters.slice(0, 5).map((char, index) => (
              <div key={char.characterId} style={{
                background: '#374151',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#f59e0b', 
                  fontWeight: 'bold',
                  minWidth: '20px'
                }}>
                  #{index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#f9fafb', 
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>
                    {char.character?.name || 'Unknown'}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af' 
                  }}>
                    {char._count.characterId} games
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strike Team & Challenge Stats */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          ⚔️ Strike Teams & Challenges
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Strike Teams</h5>
            <p style={{ color: '#8b5cf6', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.strikeTeams.total}</p>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {stats.strikeTeams.totalWins}W / {stats.strikeTeams.totalLosses}L
            </div>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Challenges Sent</h5>
            <p style={{ color: '#3b82f6', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.challenges.sent}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Challenges Received</h5>
            <p style={{ color: '#10b981', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.challenges.received}</p>
          </div>
          <div style={{
            background: '#374151',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <h5 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>Challenges Accepted</h5>
            <p style={{ color: '#f59e0b', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{stats.challenges.accepted}</p>
          </div>
        </div>
      </div>

      {/* Recent Games */}
      {stats.recentGames.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
            🕒 Recent Games
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.recentGames.map((game) => (
              <div key={game.id} style={{
                background: '#374151',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #4b5563',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#f9fafb', 
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>
                    vs {game.player1.id === user?.id ? (game.player2.name || game.player2.username) : (game.player1.name || game.player1.username)}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af' 
                  }}>
                    {game.mission?.name || 'No Mission'} • {new Date(game.playedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  background: game.result === 'WIN' ? '#10b981' : game.result === 'LOSS' ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {game.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  const [showApiTokens, setShowApiTokens] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'games' | 'inbox' | 'stats' | 'modified' | 'api-tokens'>('profile');

  // Update username when user changes
  useEffect(() => {
    setUsername(user?.username || '');
  }, [user]);

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(api('/api/user/username'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Username updated successfully');
        // Update user context if needed
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update username');
      }
    } catch (err) {
      setError('Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="user-profile">
        <div className="alert alert-error">Not logged in</div>
      </div>
    );
  }

  return (
    <div className="user-profile" style={{ 
      background: '#1f2937', 
      border: '1px solid #374151', 
      borderRadius: '8px', 
      padding: '20px',
      maxWidth: '1200px',
      width: '100%',
      margin: '20px auto',
      boxSizing: 'border-box'
    }}>
      <div className="user-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShPointLogo size={32} showText={false} />
          <h2 style={{ color: '#f9fafb', margin: 0 }}>User Profile</h2>
        </div>
        {onClose && (
          <button 
            className="btn btn-sm btn-outline"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #374151'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'profile' ? '#3b82f6' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('games')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'games' ? '#3b82f6' : 'transparent',
            color: activeTab === 'games' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          My Games
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'inbox' ? '#3b82f6' : 'transparent',
            color: activeTab === 'inbox' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'stats' ? '#3b82f6' : 'transparent',
            color: activeTab === 'stats' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          My Stats
        </button>
        {(user.role === 'EDITOR' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('modified')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'modified' ? '#3b82f6' : 'transparent',
              color: activeTab === 'modified' ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            My Modified Cards
          </button>
        )}
        <button
          onClick={() => setActiveTab('api-tokens')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'api-tokens' ? '#3b82f6' : 'transparent',
            color: activeTab === 'api-tokens' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          API Tokens
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          <div className="user-info" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Email:</strong>
              <span style={{ color: '#d1d5db' }}>{user.email}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Name:</strong>
              <span style={{ color: '#d1d5db' }}>{user.name || 'Not set'}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Role:</strong>
              <span className={`chip chip--role-${user.role.toLowerCase()}`} style={{ 
                background: user.role === 'ADMIN' ? '#dc2626' : 
                           user.role === 'EDITOR' ? '#d97706' : 
                           user.role === 'API_USER' ? '#7c3aed' : '#374151',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {user.role}
              </span>
            </div>
          </div>

      <div className="username-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#f9fafb', margin: '0 0 12px 0', fontSize: '16px' }}>Username</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#374151',
              color: '#f9fafb',
              fontSize: '14px'
            }}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleUpdateUsername}
            disabled={loading || username === user.username}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginTop: '8px', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-ok" style={{ marginTop: '8px', fontSize: '12px' }}>
            {success}
          </div>
        )}
      </div>

      {user.role === 'API_USER' && (
        <div className="api-tokens-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#f9fafb', margin: 0, fontSize: '16px' }}>API Tokens</h3>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowApiTokens(!showApiTokens)}
            >
              {showApiTokens ? 'Hide' : 'Show'} Tokens
            </button>
          </div>
          
          {showApiTokens && (
            <ApiTokenManager />
          )}
        </div>
      )}
        </>
      )}

      {activeTab === 'games' && (
        <MyGames playerId={user.id} />
      )}

      {activeTab === 'inbox' && (
        <Inbox onClose={() => setActiveTab('profile')} />
      )}

      {activeTab === 'stats' && (
        <ComprehensiveStats />
      )}

      {activeTab === 'modified' && (user.role === 'EDITOR' || user.role === 'ADMIN') && (
        <div style={{ padding: '20px' }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0' }}>My Modified Cards</h3>
          <div style={{
            background: '#374151',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #4b5563',
            textAlign: 'center'
          }}>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              This feature will show cards you've created or modified as an editor.
            </p>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '14px' }}>
              Coming soon...
            </p>
          </div>
        </div>
      )}

      {activeTab === 'api-tokens' && (
        <ApiTokenManager />
      )}

      <div className="profile-actions" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #374151' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => window.location.href = api('/auth/logout')}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
