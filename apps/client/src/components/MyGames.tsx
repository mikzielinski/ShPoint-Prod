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
  thumbnailUrl?: string;
}

interface StrikeTeam {
  id: string;
  name: string;
  description?: string;
}

interface GameResult {
  id: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  mode: 'CASUAL' | 'RANKED' | 'TOURNAMENT' | 'FRIENDLY';
  roundsPlayed: number;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  playedAt: string;
  player1: User;
  player2: User;
  winner?: User;
  mission?: Mission;
  player1StrikeTeam?: StrikeTeam;
  player2StrikeTeam?: StrikeTeam;
  characterResults: Array<{
    id: string;
    character: {
      id: string;
      name: string;
      portraitUrl?: string;
    };
    player: User;
    damageDealt: number;
    damageTaken: number;
    abilitiesUsed: number;
    objectivesSecured: number;
    isMVP: boolean;
  }>;
  gameSession?: {
    id: string;
    currentTier: 'TIER_1' | 'TIER_2' | 'TIER_3';
    isActive: boolean;
    startedAt: string;
    completedAt?: string;
    struggleCards: Array<{
      id: string;
      tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
      cardName: string;
      cardDescription?: string;
      selectedBy?: string;
      isActive: boolean;
      isCompleted: boolean;
      winnerId?: string;
      result: 'WIN' | 'LOSS' | 'DRAW';
      selectedAt: string;
      completedAt?: string;
    }>;
    characterStates: Array<{
      id: string;
      character: {
        id: string;
        name: string;
        portraitUrl?: string;
      };
      player: User;
      currentStamina: number;
      currentDurability: number;
      currentForce?: number;
      currentHanker?: number;
      status: 'NORMAL' | 'STRAIN' | 'PINNED' | 'EXPOSE' | 'DISARM';
      statusDuration?: number;
      damageDealt: number;
      damageTaken: number;
      abilitiesUsed: number;
      objectivesSecured: number;
      isMVP: boolean;
      currentPosition?: any;
      updatedAt: string;
    }>;
  };
}

interface ApprovedGame {
  id: string;
  scheduledDate: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  mission?: Mission;
  player1: User;
  notes?: string;
  isPaid?: boolean;
  totalCost?: number;
  currency?: string;
  skillLevel?: string;
  isApproved: boolean;
  registrationDate: string;
  registrationStatus: string;
}

interface MyGamesProps {
  playerId?: string;
}

export default function MyGames({ playerId }: MyGamesProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [games, setGames] = useState<GameResult[]>([]);
  const [approvedGames, setApprovedGames] = useState<ApprovedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'draws'>('all');
  const [mode, setMode] = useState<'all' | 'CASUAL' | 'RANKED' | 'TOURNAMENT' | 'FRIENDLY'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'approved'>('results');

  const targetPlayerId = playerId || me?.id;

  const loadGames = async (pageNum = 1, append = false) => {
    if (!me || !targetPlayerId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      });

      if (filter !== 'all') {
        params.append('result', filter === 'wins' ? 'WIN' : filter === 'losses' ? 'LOSS' : 'DRAW');
      }

      if (mode !== 'all') {
        params.append('mode', mode);
      }

      const response = await fetch(`${api}/api/v2/game-results?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        if (append) {
          setGames(prev => [...prev, ...data.results]);
        } else {
          setGames(data.results);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load games');
      }
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedGames = async () => {
    if (!me) return;

    try {
      setApprovedLoading(true);
      const response = await fetch(api('/api/v2/scheduled-games/my-approved'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setApprovedGames(data.games);
      } else {
        console.error('Failed to load approved games:', data.error);
      }
    } catch (err) {
      console.error('Failed to load approved games:', err);
    } finally {
      setApprovedLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [me, targetPlayerId, filter, mode]);

  useEffect(() => {
    loadApprovedGames();
  }, [me]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'WIN': return '🏆';
      case 'LOSS': return '💔';
      case 'DRAW': return '🤝';
      default: return '❓';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'WIN': return '#28a745';
      case 'LOSS': return '#dc3545';
      case 'DRAW': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NORMAL': return '✅';
      case 'STRAIN': return '😰';
      case 'PINNED': return '📌';
      case 'EXPOSE': return '🎯';
      case 'DISARM': return '🚫';
      default: return '❓';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'TIER_1': return '1️⃣';
      case 'TIER_2': return '2️⃣';
      case 'TIER_3': return '3️⃣';
      default: return '❓';
    }
  };

  const toggleGameExpansion = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  if (!me) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Please log in to view your games.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>My Games</h2>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid #374151'
      }}>
        <button
          onClick={() => setActiveTab('results')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'results' ? '#3b82f6' : 'transparent',
            color: activeTab === 'results' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Game Results
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'approved' ? '#3b82f6' : 'transparent',
            color: activeTab === 'approved' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Approved Games ({approvedGames.length})
        </button>
      </div>

      {activeTab === 'approved' && (
        <div>
          {approvedLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading approved games...</div>
          ) : approvedGames.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              No approved games found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {approvedGames.map(game => (
                <div key={game.id} style={{
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#1f2937'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '18px' }}>
                        {game.mission?.name || 'Mission'}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#d1d5db' }}>
                        <div>
                          <strong style={{ color: '#fbbf24' }}>📅 When:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {new Date(game.scheduledDate).toLocaleString('pl-PL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#fbbf24' }}>📍 Where:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {game.location || game.address || 
                             `${game.city || ''}, ${game.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        background: '#10b981', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}>
                        ✅ APPROVED
                      </div>
                      {game.isPaid && (
                        <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>
                          💰 {game.totalCost} {game.currency}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#d1d5db', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ color: '#fbbf24' }}>👤 Host:</strong>
                      <span style={{ marginLeft: '8px' }}>
                        {game.player1.name || game.player1.username || 'Unknown'}
                      </span>
                    </div>
                    {game.skillLevel && (
                      <div>
                        <strong style={{ color: '#fbbf24' }}>🎮 Skill:</strong>
                        <span style={{ marginLeft: '8px' }}>
                          {game.skillLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {game.notes && (
                    <div style={{ 
                      background: '#374151', 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      fontSize: '14px', 
                      color: '#d1d5db',
                      marginBottom: '12px'
                    }}>
                      <strong style={{ color: '#fbbf24' }}>📝 Notes:</strong>
                      <span style={{ marginLeft: '8px' }}>{game.notes}</span>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Approved on: {new Date(game.registrationDate).toLocaleString('pl-PL')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Result
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '6px 8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Results</option>
            <option value="wins">Wins</option>
            <option value="losses">Losses</option>
            <option value="draws">Draws</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            style={{
              padding: '6px 8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Modes</option>
            <option value="CASUAL">Casual</option>
            <option value="RANKED">Ranked</option>
            <option value="TOURNAMENT">Tournament</option>
            <option value="FRIENDLY">Friendly</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading && games.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading games...</div>
      ) : games.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
          No games found
        </div>
      ) : (
        <div>
          {games.map(game => (
            <div key={game.id} style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              {/* Game Header */}
              <div
                onClick={() => toggleGameExpansion(game.id)}
                style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {getResultIcon(game.result)}
                  </span>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: getResultColor(game.result)
                    }}>
                      {game.result} vs {game.player1.id === targetPlayerId ? game.player2.name || game.player2.username : game.player1.name || game.player1.username}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {game.mission?.name || 'No Mission'} • {game.mode} • {formatDate(game.playedAt)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  {expandedGame === game.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Game Details */}
              {expandedGame === game.id && (
                <div style={{ padding: '16px' }}>
                  {/* Basic Game Info */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>Game Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Rounds:</strong> {game.roundsPlayed}</div>
                      {game.durationMinutes && (
                        <div><strong>Duration:</strong> {game.durationMinutes} minutes</div>
                      )}
                      {game.location && (
                        <div><strong>Location:</strong> {game.location}</div>
                      )}
                      <div><strong>Mode:</strong> {game.mode}</div>
                    </div>
                    {game.notes && (
                      <div style={{ marginTop: '8px' }}>
                        <strong>Notes:</strong> {game.notes}
                      </div>
                    )}
                  </div>

                  {/* Strike Teams */}
                  {(game.player1StrikeTeam || game.player2StrikeTeam) && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0' }}>Strike Teams</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {game.player1StrikeTeam && (
                          <div style={{ 
                            padding: '8px', 
                            backgroundColor: '#e3f2fd', 
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}>
                            <strong>{game.player1.name || game.player1.username}:</strong><br />
                            {game.player1StrikeTeam.name}
                          </div>
                        )}
                        {game.player2StrikeTeam && (
                          <div style={{ 
                            padding: '8px', 
                            backgroundColor: '#fff3e0', 
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}>
                            <strong>{game.player2.name || game.player2.username}:</strong><br />
                            {game.player2StrikeTeam.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Character Performance */}
                  {game.characterResults.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0' }}>Character Performance</h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {game.characterResults.map(charResult => (
                          <div key={charResult.id} style={{
                            padding: '8px',
                            backgroundColor: charResult.isMVP ? '#fff3cd' : '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '14px',
                            border: charResult.isMVP ? '2px solid #ffc107' : '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              {charResult.character.portraitUrl && (
                                <img 
                                  src={charResult.character.portraitUrl} 
                                  alt={charResult.character.name}
                                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                />
                              )}
                              <strong>{charResult.character.name}</strong>
                              <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                ({charResult.player.name || charResult.player.username})
                              </span>
                              {charResult.isMVP && <span style={{ color: '#ffc107' }}>⭐ MVP</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
                              <div>Damage Dealt: {charResult.damageDealt}</div>
                              <div>Damage Taken: {charResult.damageTaken}</div>
                              <div>Abilities Used: {charResult.abilitiesUsed}</div>
                              <div>Objectives: {charResult.objectivesSecured}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Game Session Details */}
                  {game.gameSession && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0 }}>Game Session Details</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              const url = `${api}/api/v2/game-sessions/${game.gameSession.id}/export?format=json`;
                              window.open(url, '_blank');
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            📄 Export JSON
                          </button>
                          <button
                            onClick={() => {
                              const url = `${api}/api/v2/game-sessions/${game.gameSession.id}/export?format=csv`;
                              window.open(url, '_blank');
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            📊 Export CSV
                          </button>
                        </div>
                      </div>
                      
                      {/* Struggle Cards */}
                      {game.gameSession.struggleCards.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ margin: '0 0 8px 0' }}>Struggle Cards</h5>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {game.gameSession.struggleCards.map(card => (
                              <div key={card.id} style={{
                                padding: '8px',
                                backgroundColor: card.isActive ? '#d4edda' : card.isCompleted ? '#f8f9fa' : '#fff3cd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                border: card.isActive ? '2px solid #28a745' : '1px solid #e9ecef'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span>{getTierIcon(card.tier)}</span>
                                  <strong>{card.cardName}</strong>
                                  {card.isActive && <span style={{ color: '#28a745' }}>● Active</span>}
                                  {card.isCompleted && <span style={{ color: '#6c757d' }}>✓ Completed</span>}
                                </div>
                                {card.cardDescription && (
                                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                                    {card.cardDescription}
                                  </div>
                                )}
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  Selected: {formatDate(card.selectedAt)}
                                  {card.completedAt && ` • Completed: ${formatDate(card.completedAt)}`}
                                  {card.winnerId && ` • Winner: ${card.winnerId === game.player1.id ? game.player1.name || game.player1.username : game.player2.name || game.player2.username}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Character States */}
                      {game.gameSession.characterStates.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px 0' }}>Character States</h5>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {game.gameSession.characterStates.map(charState => (
                              <div key={charState.id} style={{
                                padding: '8px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                fontSize: '14px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  {charState.character.portraitUrl && (
                                    <img 
                                      src={charState.character.portraitUrl} 
                                      alt={charState.character.name}
                                      style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                    />
                                  )}
                                  <strong>{charState.character.name}</strong>
                                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                    ({charState.player.name || charState.player.username})
                                  </span>
                                  <span>{getStatusIcon(charState.status)}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
                                  <div>Stamina: {charState.currentStamina}</div>
                                  <div>Durability: {charState.currentDurability}</div>
                                  {charState.currentForce && <div>Force: {charState.currentForce}</div>}
                                  {charState.currentHanker && <div>Hanker: {charState.currentHanker}</div>}
                                </div>
                                {charState.status !== 'NORMAL' && (
                                  <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                                    Status: {charState.status} {charState.statusDuration && `(${charState.statusDuration} rounds)`}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  loadGames(nextPage, true);
                }}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
