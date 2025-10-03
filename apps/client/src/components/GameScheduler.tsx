import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import { useMissions } from '../contexts/MissionsContext';
import { usePlayers } from '../contexts/PlayersContext';

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
  city?: string;
  country?: string;
  location?: string;
  address?: string;
  notes?: string;
  maxPlayers: number;
  skillLevel?: string;
  isPaid?: boolean;
  totalCost?: number;
  currency?: string;
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
  const { missions, loading: missionsLoading, error: missionsError } = useMissions();
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    country: ''
  });
  const [newGame, setNewGame] = useState({
    missionId: '',
    scheduledDate: '',
    city: '',
    country: '',
    location: '',
    address: '',
    notes: '',
    skillLevel: 'INTERMEDIATE',
    isPaid: false,
    totalCost: '',
    currency: 'PLN'
  });

  const loadGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(api(`/api/v2/public-games${queryString}`), {
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


  useEffect(() => {
    console.log('🔄 GameScheduler: useEffect triggered, user:', user ? user.email : 'null');
    if (user) {
      console.log('🔄 GameScheduler: User authenticated, loading games...');
      loadGames();
    } else {
      console.log('🔄 GameScheduler: No user, skipping API calls');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [filters]);

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
          setShowCreateModal(false);
          setNewGame({
            missionId: '',
            scheduledDate: '',
            city: '',
            country: '',
            location: '',
            address: '',
            notes: '',
            skillLevel: 'INTERMEDIATE',
            isPaid: false,
            totalCost: '',
            currency: 'PLN'
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
          You need to be logged in to browse and create public games.
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
          🌍 Public Games
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
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

      {/* Filters */}
      <div style={{
        background: '#111827',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid #374151'
      }}>
        <h3 style={{ color: '#f9fafb', margin: '0 0 12px 0', fontSize: '16px' }}>🔍 Filter Games</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
              City
            </label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              placeholder="e.g., Warsaw"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
              Country
            </label>
            <input
              type="text"
              value={filters.country}
              onChange={(e) => setFilters({...filters, country: e.target.value})}
              placeholder="e.g., Poland"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            onClick={() => setFilters({ city: '', country: '' })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #6b7280',
              background: '#374151',
              color: '#f9fafb',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #374151',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                color: '#f9fafb', 
                margin: 0, 
                fontSize: '20px',
                fontWeight: '600'
              }}>
                🌍 Create Public Game
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Mission *
              </label>
              <select
                value={newGame.missionId}
                onChange={(e) => setNewGame({...newGame, missionId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
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

            <div style={{ marginBottom: '20px' }}>
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
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                  City *
                </label>
                <input
                  type="text"
                  value={newGame.city}
                  onChange={(e) => setNewGame({...newGame, city: e.target.value})}
                  placeholder="e.g., Warsaw"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#f9fafb',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                  Country *
                </label>
                <input
                  type="text"
                  value={newGame.country}
                  onChange={(e) => setNewGame({...newGame, country: e.target.value})}
                  placeholder="e.g., Poland"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#f9fafb',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Venue/Store Name (Optional)
              </label>
              <input
                type="text"
                value={newGame.location}
                onChange={(e) => setNewGame({...newGame, location: e.target.value})}
                placeholder="e.g., Local Game Store"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
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
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Skill Level
              </label>
              <select
                value={newGame.skillLevel}
                onChange={(e) => setNewGame({...newGame, skillLevel: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Payment Information
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={newGame.isPaid}
                  onChange={(e) => setNewGame({...newGame, isPaid: e.target.checked, totalCost: e.target.checked ? newGame.totalCost : ''})}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3b82f6'
                  }}
                />
                <label htmlFor="isPaid" style={{ color: '#d1d5db', fontSize: '14px', cursor: 'pointer' }}>
                  Reservation is paid
                </label>
              </div>
              
              {newGame.isPaid && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#d1d5db', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Total Cost
                    </label>
                    <input
                      type="number"
                      value={newGame.totalCost}
                      onChange={(e) => setNewGame({...newGame, totalCost: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #4b5563',
                        background: '#374151',
                        color: '#f9fafb',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ width: '80px' }}>
                    <label style={{ color: '#d1d5db', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Currency
                    </label>
                    <select
                      value={newGame.currency}
                      onChange={(e) => setNewGame({...newGame, currency: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #4b5563',
                        background: '#374151',
                        color: '#f9fafb',
                        fontSize: '14px'
                      }}
                    >
                      <option value="PLN">PLN</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
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
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: '#374151',
                  color: '#f9fafb',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createGame}
                disabled={!newGame.missionId || !newGame.scheduledDate || !newGame.city || !newGame.country}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (!newGame.missionId || !newGame.scheduledDate || !newGame.city || !newGame.country) ? 0.5 : 1
                }}
              >
                Create Game
              </button>
            </div>
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {games.map((game) => {
            const currentPlayers = game._count.registrations + 1; // player1 + registered players
            const isFull = currentPlayers >= game.maxPlayers;
            const userRegistration = game.registrations.find(r => r.user.id === user.id);
            const isRegistered = !!userRegistration;
            const isApproved = userRegistration?.status === 'APPROVED';
            const isRejected = userRegistration?.status === 'REJECTED';
            const isPending = userRegistration?.status === 'PENDING';
            
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
                      Host: {game.player1.name || game.player1.username}
                    </p>
                    <p style={{ color: '#d1d5db', margin: '0 0 8px 0', fontSize: '14px' }}>
                      📍 {game.city}{game.country ? `, ${game.country}` : ''}{game.location ? ` • ${game.location}` : ''}
                    </p>
                    <p style={{ color: '#d1d5db', margin: '0 0 4px 0', fontSize: '14px' }}>
                      📅 {new Date(game.scheduledDate).toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {game.skillLevel && (
                        <span style={{
                          background: '#374151',
                          color: '#d1d5db',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {game.skillLevel}
                        </span>
                      )}
                      {game.isPaid && game.totalCost && (
                        <span style={{
                          background: '#047857',
                          color: '#d1fae5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          💰 {game.totalCost} {game.currency || 'PLN'}
                        </span>
                      )}
                    </div>
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
                        background: isApproved ? '#10b981' : 
                                   isRejected ? '#ef4444' : 
                                   isPending ? '#f59e0b' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {isApproved ? 'Approved' : 
                         isRejected ? 'Rejected' : 
                         isPending ? 'Pending' : 'Registered'}
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
                
                {/* Show join button only if user is not registered or has pending registration */}
                {(!isRegistered || isPending) && game.status === 'SCHEDULED' && !isRejected && (
                  <button
                    onClick={() => registerForGame(game.id)}
                    disabled={isFull && !isPending}
                    style={{
                      background: isFull && !isPending ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (isFull && !isPending) ? 'not-allowed' : 'pointer',
                      opacity: (isFull && !isPending) ? 0.5 : 1
                    }}
                  >
                    {isFull && !isPending ? 'Join Waitlist' : 
                     isPending ? 'Registration Pending' : 'Join Game'}
                  </button>
                )}
                
                {/* Show message for rejected players */}
                {isRejected && (
                  <div style={{
                    background: '#7f1d1d',
                    color: '#fecaca',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #dc2626'
                  }}>
                    ❌ Your registration was rejected. You cannot join this game.
                  </div>
                )}
                
                {/* Show message for approved players */}
                {isApproved && (
                  <div style={{
                    background: '#065f46',
                    color: '#d1fae5',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #10b981'
                  }}>
                    ✅ Your registration is approved! You can join this game.
                  </div>
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
