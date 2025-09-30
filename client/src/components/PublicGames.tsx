import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface User {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}

interface Mission {
  id: string;
  name: string;
  description: string;
}

interface GameRegistration {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLIST';
  registeredAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  waitlistPosition?: number;
  notes?: string;
  user: User;
}

interface ScheduledGame {
  id: string;
  player1Id: string;
  player2Id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  location?: string;
  address?: string;
  notes?: string;
  isPublic: boolean;
  maxPlayers: number;
  player1: User;
  player2: User;
  mission: Mission;
  registrations: GameRegistration[];
  _count: {
    registrations: number;
  };
}

const PublicGames: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGame, setNewGame] = useState({
    missionId: '',
    scheduledDate: '',
    location: '',
    address: '',
    notes: '',
    maxPlayers: 2
  });
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    fetchPublicGames();
    fetchMissions();
  }, []);

  const fetchPublicGames = async () => {
    try {
      const response = await fetch(api('/api/v2/public-games'));
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      }
    } catch (err) {
      setError('Failed to fetch public games');
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      const response = await fetch(api('/api/v2/missions'));
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
      }
    } catch (err) {
      setError('Failed to fetch missions');
    }
  };

  const createPublicGame = async () => {
    try {
      const response = await fetch(api('/api/v2/public-games'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
      });

      if (response.ok) {
        setShowCreateGame(false);
        setNewGame({
          missionId: '',
          scheduledDate: '',
          location: '',
          address: '',
          notes: '',
          maxPlayers: 2
        });
        fetchPublicGames();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create public game');
      }
    } catch (err) {
      setError('Failed to create public game');
    }
  };

  const registerForGame = async (gameId: string) => {
    try {
      const response = await fetch(api(`/api/v2/public-games/${gameId}/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });

      if (response.ok) {
        fetchPublicGames();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to register for game');
      }
    } catch (err) {
      setError('Failed to register for game');
    }
  };

  const getCurrentPlayerCount = (game: ScheduledGame) => {
    return game.registrations.filter(r => r.status === 'APPROVED').length + 
           (game.player1Id === game.player2Id ? 1 : 2);
  };

  const getPendingCount = (game: ScheduledGame) => {
    return game.registrations.filter(r => r.status === 'PENDING').length;
  };

  const getWaitlistCount = (game: ScheduledGame) => {
    return game.registrations.filter(r => r.status === 'WAITLIST').length;
  };

  const getUserRegistration = (game: ScheduledGame) => {
    return game.registrations.find(r => r.userId === user?.id);
  };

  const getGameStatus = (game: ScheduledGame) => {
    const currentPlayers = getCurrentPlayerCount(game);
    const pendingCount = getPendingCount(game);
    const waitlistCount = getWaitlistCount(game);
    
    if (game.status === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (game.status === 'COMPLETED') return 'COMPLETED';
    if (game.status === 'CANCELLED') return 'CANCELLED';
    if (currentPlayers >= game.maxPlayers && waitlistCount > 0) return 'FULL_WAITLIST';
    if (currentPlayers >= game.maxPlayers) return 'FULL';
    if (pendingCount > 0) return 'PENDING_APPROVAL';
    return 'AVAILABLE';
  };

  if (loading) {
    return <div style={{ color: '#e2e8f0', textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ color: '#e2e8f0', padding: '20px' }}>
      <h2 style={{ color: '#f9fafb', marginBottom: '20px' }}>Public Games</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#dc2626', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '6px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowCreateGame(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Public Game
        </button>
      </div>

      {showCreateGame && (
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#f9fafb', marginBottom: '15px' }}>Create Public Game</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0' }}>
              Mission:
            </label>
            <select
              value={newGame.missionId}
              onChange={(e) => setNewGame({...newGame, missionId: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
            >
              <option value="">Select Mission</option>
              {missions.map(mission => (
                <option key={mission.id} value={mission.id}>{mission.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0' }}>
              Date & Time:
            </label>
            <input
              type="datetime-local"
              value={newGame.scheduledDate}
              onChange={(e) => setNewGame({...newGame, scheduledDate: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0' }}>
              Location:
            </label>
            <input
              type="text"
              value={newGame.location}
              onChange={(e) => setNewGame({...newGame, location: e.target.value})}
              placeholder="Where will you play?"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0' }}>
              Max Players:
            </label>
            <input
              type="number"
              min="2"
              max="8"
              value={newGame.maxPlayers}
              onChange={(e) => setNewGame({...newGame, maxPlayers: Number(e.target.value)})}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0' }}>
              Description:
            </label>
            <textarea
              value={newGame.notes}
              onChange={(e) => setNewGame({...newGame, notes: e.target.value})}
              placeholder="Additional details..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={createPublicGame}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create Public Game
            </button>
            <button
              onClick={() => setShowCreateGame(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ color: '#f9fafb', marginBottom: '15px' }}>Available Games</h3>
        {games.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No public games available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {games.map(game => {
              const currentPlayers = getCurrentPlayerCount(game);
              const pendingCount = getPendingCount(game);
              const waitlistCount = getWaitlistCount(game);
              const userRegistration = getUserRegistration(game);
              const gameStatus = getGameStatus(game);
              
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'AVAILABLE': return '#16a34a';
                  case 'PENDING_APPROVAL': return '#f59e0b';
                  case 'FULL_WAITLIST': return '#dc2626';
                  case 'FULL': return '#6b7280';
                  case 'IN_PROGRESS': return '#3b82f6';
                  case 'COMPLETED': return '#10b981';
                  case 'CANCELLED': return '#ef4444';
                  default: return '#6b7280';
                }
              };

              const getStatusText = (status: string) => {
                switch (status) {
                  case 'AVAILABLE': return 'Available';
                  case 'PENDING_APPROVAL': return 'Pending Approval';
                  case 'FULL_WAITLIST': return 'Full (Waitlist)';
                  case 'FULL': return 'Full';
                  case 'IN_PROGRESS': return 'In Progress';
                  case 'COMPLETED': return 'Completed';
                  case 'CANCELLED': return 'Cancelled';
                  default: return 'Unknown';
                }
              };

              const getUserStatusText = () => {
                if (!userRegistration) return null;
                switch (userRegistration.status) {
                  case 'PENDING': return 'Pending Approval';
                  case 'APPROVED': return 'Approved';
                  case 'WAITLIST': return `Waitlist #${userRegistration.waitlistPosition}`;
                  case 'REJECTED': return 'Rejected';
                  case 'CANCELLED': return 'Cancelled';
                  default: return null;
                }
              };
              
              return (
                <div key={game.id} style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <h4 style={{ color: '#f9fafb', margin: 0 }}>
                          {game.mission.name}
                        </h4>
                        <span style={{
                          backgroundColor: getStatusColor(gameStatus),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {getStatusText(gameStatus)}
                        </span>
                      </div>
                      <p style={{ color: '#e2e8f0', margin: '0 0 5px 0' }}>
                        <strong>Host:</strong> {game.player1.name || game.player1.username}
                      </p>
                      <p style={{ color: '#e2e8f0', margin: '0 0 5px 0' }}>
                        <strong>Date:</strong> {new Date(game.scheduledDate).toLocaleString()}
                      </p>
                      <p style={{ color: '#e2e8f0', margin: '0 0 5px 0' }}>
                        <strong>Location:</strong> {game.location}
                      </p>
                      <p style={{ color: '#e2e8f0', margin: '0 0 5px 0' }}>
                        <strong>Players:</strong> {currentPlayers}/{game.maxPlayers}
                        {pendingCount > 0 && ` (${pendingCount} pending)`}
                        {waitlistCount > 0 && ` (${waitlistCount} on waitlist)`}
                      </p>
                      {userRegistration && (
                        <p style={{ color: '#fbbf24', margin: '0 0 5px 0', fontSize: '14px' }}>
                          <strong>Your Status:</strong> {getUserStatusText()}
                        </p>
                      )}
                      {game.notes && (
                        <p style={{ color: '#9ca3af', margin: '0 0 5px 0', fontSize: '14px' }}>
                          {game.notes}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ marginLeft: '20px' }}>
                      {userRegistration ? (
                        <span style={{
                          backgroundColor: userRegistration.status === 'APPROVED' ? '#16a34a' : 
                                         userRegistration.status === 'PENDING' ? '#f59e0b' :
                                         userRegistration.status === 'WAITLIST' ? '#dc2626' : '#6b7280',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          {getUserStatusText()}
                        </span>
                      ) : gameStatus === 'AVAILABLE' || gameStatus === 'PENDING_APPROVAL' || gameStatus === 'FULL_WAITLIST' ? (
                        <button
                          onClick={() => registerForGame(game.id)}
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {gameStatus === 'FULL_WAITLIST' ? 'Join Waitlist' : 'Join Game'}
                        </button>
                      ) : (
                        <span style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          {getStatusText(gameStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicGames;
