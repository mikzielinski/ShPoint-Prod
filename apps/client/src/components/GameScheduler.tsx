import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

interface PublicGame {
  id: string;
  player1: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  mission: {
    id: string;
    name: string;
    description?: string;
  };
  scheduledDate: string;
  location: string;
  address?: string;
  notes?: string;
  maxPlayers: number;
  status: string;
  registrations: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      username?: string;
      avatarUrl?: string;
    };
    status: string;
    waitlistPosition?: number;
    registeredAt: string;
  }>;
  _count: {
    registrations: number;
  };
}

interface Mission {
  id: string;
  name: string;
  description?: string;
}

const GameScheduler: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  
  const [games, setGames] = useState<PublicGame[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGame, setNewGame] = useState({
    missionId: '',
    scheduledDate: '',
    location: '',
    address: '',
    notes: '',
    maxPlayers: 2,
    skillLevel: 'INTERMEDIATE'
  });

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/v2/public-games'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setGames(data.games || []);
        }
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMissions = async () => {
    try {
      const response = await fetch(api('/api/v2/missions'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setMissions(data.missions || []);
          console.log('Loaded missions:', data.missions);
        } else {
          console.error('Failed to load missions:', data);
        }
      } else {
        console.error('Missions API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  };

  useEffect(() => {
    loadGames();
    loadMissions();
  }, []);

  const createGame = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(api('/api/v2/public-games'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newGame)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setShowCreateForm(false);
          setNewGame({
            missionId: '',
            scheduledDate: '',
            location: '',
            address: '',
            notes: '',
            maxPlayers: 2,
            skillLevel: 'INTERMEDIATE'
          });
          loadGames();
        }
      }
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const registerForGame = async (gameId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(api(`/api/v2/public-games/${gameId}/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: '' })
      });
      
      if (response.ok) {
        loadGames();
      }
    } catch (error) {
      console.error('Error registering for game:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#10b981';
      case 'FULL': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#6b7280';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Available';
      case 'FULL': return 'Full (Waitlist)';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  if (!user) {
    return (
      <div style={{
        background: '#1f2937',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        border: '1px solid #374151'
      }}>
        <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>🔐 Sign in Required</h3>
        <p style={{ color: '#9ca3af' }}>
          You need to be logged in to use the game scheduler.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #374151'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          color: '#f9fafb',
          fontSize: '24px',
          fontWeight: '700',
          margin: 0
        }}>
          🎯 Game Scheduler
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          + Create Public Game
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          background: '#374151',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #4b5563'
        }}>
          <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>Create Public Game</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Mission *
            </label>
            <select
              value={newGame.missionId}
              onChange={(e) => setNewGame({...newGame, missionId: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            >
              <option value="">Select Mission</option>
              {missions.map(mission => (
                <option key={mission.id} value={mission.id}>{mission.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={newGame.scheduledDate}
              onChange={(e) => setNewGame({...newGame, scheduledDate: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Location *
            </label>
            <input
              type="text"
              value={newGame.location}
              onChange={(e) => setNewGame({...newGame, location: e.target.value})}
              placeholder="e.g., Warsaw, Poland"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Address (Optional)
            </label>
            <input
              type="text"
              value={newGame.address}
              onChange={(e) => setNewGame({...newGame, address: e.target.value})}
              placeholder="Specific address or venue"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Skill Level
            </label>
            <select
              value={newGame.skillLevel}
              onChange={(e) => setNewGame({...newGame, skillLevel: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="PRO">Pro</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Max Players
            </label>
            <select
              value={newGame.maxPlayers}
              onChange={(e) => setNewGame({...newGame, maxPlayers: parseInt(e.target.value)})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            >
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Description (Optional)
            </label>
            <textarea
              value={newGame.notes}
              onChange={(e) => setNewGame({...newGame, notes: e.target.value})}
              placeholder="Any additional details about the game..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={createGame}
              disabled={!newGame.missionId || !newGame.scheduledDate || !newGame.location}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: (!newGame.missionId || !newGame.scheduledDate || !newGame.location) ? 0.5 : 1
              }}
            >
              Create Game
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af' }}>Loading games...</p>
        </div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af' }}>No public games available. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {games.map((game) => {
            const currentPlayers = game._count.registrations + (game.player1.id === game.player2.id ? 1 : 2);
            const isFull = currentPlayers >= game.maxPlayers;
            const isRegistered = game.registrations.some(r => r.user.id === user.id);
            
            return (
              <div key={game.id} style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #4b5563'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h4 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: '18px' }}>
                      {game.mission.name}
                    </h4>
                    <p style={{ color: '#9ca3af', margin: '0 0 8px 0', fontSize: '14px' }}>
                      Host: {game.player1.name || game.player1.username} • {game.location}
                    </p>
                    <p style={{ color: '#d1d5db', margin: '0', fontSize: '14px' }}>
                      📅 {new Date(game.scheduledDate).toLocaleString()} • 
                      👥 {currentPlayers}/{game.maxPlayers} players
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      background: getStatusColor(game.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getStatusText(game.status)}
                    </span>
                    {isRegistered && (
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Registered
                      </span>
                    )}
                  </div>
                </div>
                
                {game.notes && (
                  <p style={{ color: '#d1d5db', margin: '0 0 12px 0', fontSize: '14px' }}>
                    {game.notes}
                  </p>
                )}
                
                {game.registrations.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }}>
                      Players ({game.registrations.length}):
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {game.registrations.map(reg => (
                        <span
                          key={reg.id}
                          style={{
                            background: reg.status === 'APPROVED' ? '#10b981' : 
                                       reg.status === 'PENDING' ? '#f59e0b' : '#6b7280',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          {reg.user.name || reg.user.username}
                          {reg.waitlistPosition && ` (#${reg.waitlistPosition})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {!isRegistered && game.status === 'SCHEDULED' && (
                  <button
                    onClick={() => registerForGame(game.id)}
                    disabled={isFull}
                    style={{
                      background: isFull ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      opacity: isFull ? 0.5 : 1
                    }}
                  >
                    {isFull ? 'Join Waitlist' : 'Join Game'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameScheduler;
