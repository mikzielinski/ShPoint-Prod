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

interface PendingGame {
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
  registrationDate: string;
  registrationStatus: 'PENDING';
}

interface MyPublicGame {
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
  maxPlayers: number;
  status: string;
  createdAt: string;
  registrations: Array<{
    id: string;
    user: User;
    status: string;
    registeredAt: string;
  }>;
  _count: {
    registrations: number;
  };
}

interface Challenge {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  challenger: User;
  challenged: User;
  challengerStrikeTeam?: {
    id: string;
    name: string;
    description?: string;
  };
  scheduledGame?: {
    id: string;
    scheduledDate: string;
    location?: string;
    mission?: {
      id: string;
      name: string;
      thumbnailUrl?: string;
    };
  };
}

interface ApprovedGameForResults {
  id: string;
  scheduledDate: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  mission?: Mission;
  player1: User;
  player2?: User;
  notes?: string;
  isPaid?: boolean;
  totalCost?: number;
  currency?: string;
  skillLevel?: string;
  status: 'COMPLETED' | 'CONFIRMED';
  player1StrikeTeam?: StrikeTeam;
  player2StrikeTeam?: StrikeTeam;
}

interface PendingGameResultApproval {
  id: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  mode: 'CASUAL' | 'RANKED' | 'TOURNAMENT' | 'FRIENDLY';
  roundsPlayed: number;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  playedAt: string;
  createdAt: string;
  player1: User;
  player2: User;
  winner?: User;
  mission?: Mission;
  player1StrikeTeam?: StrikeTeam;
  player2StrikeTeam?: StrikeTeam;
  reportedBy: User;
  scheduledGame?: {
    id: string;
    scheduledDate: string;
    location?: string;
  };
}

interface MyGamesProps {
  playerId?: string;
}

export default function MyGames({ playerId }: MyGamesProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [games, setGames] = useState<GameResult[]>([]);
  const [approvedGames, setApprovedGames] = useState<ApprovedGame[]>([]);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [myPublicGames, setMyPublicGames] = useState<MyPublicGame[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [myPublicGamesLoading, setMyPublicGamesLoading] = useState(true);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'draws'>('all');
  const [mode, setMode] = useState<'all' | 'CASUAL' | 'RANKED' | 'TOURNAMENT' | 'FRIENDLY'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'approved' | 'my-games' | 'pending-approvals'>('results');

  // New state for enhanced features
  const [approvedGamesForResults, setApprovedGamesForResults] = useState<ApprovedGameForResults[]>([]);
  const [approvedGamesLoading, setApprovedGamesLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingGameResultApproval[]>([]);
  const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);
  
  // UI state
  const [showCreateResultModal, setShowCreateResultModal] = useState(false);
  const [selectedGameForResult, setSelectedGameForResult] = useState<ApprovedGameForResults | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingGameResultApproval | null>(null);
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [selectedGameForEdit, setSelectedGameForEdit] = useState<ApprovedGameForResults | null>(null);
  const [showCancelGameModal, setShowCancelGameModal] = useState(false);
  const [selectedGameForCancel, setSelectedGameForCancel] = useState<any>(null);
  
  // Filters
  const [gameFilter, setGameFilter] = useState<'all' | 'pending' | 'approved' | 'challenges' | 'results'>('all');

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

  const loadPendingGames = async () => {
    if (!me) return;

    try {
      setPendingLoading(true);
      const response = await fetch(api('/api/v2/scheduled-games/my-pending'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setPendingGames(data.games);
      } else {
        console.error('Failed to load pending games:', data.error);
      }
    } catch (err) {
      console.error('Failed to load pending games:', err);
    } finally {
      setPendingLoading(false);
    }
  };

  const loadMyPublicGames = async () => {
    if (!me) return;

    try {
      setMyPublicGamesLoading(true);
      const response = await fetch(api('/api/v2/scheduled-games/my-public'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setMyPublicGames(data.games);
      } else {
        console.error('Failed to load my public games:', data.error);
      }
    } catch (err) {
      console.error('Failed to load my public games:', err);
    } finally {
      setMyPublicGamesLoading(false);
    }
  };

  const loadChallenges = async () => {
    if (!me) return;

    try {
      setChallengesLoading(true);
      const response = await fetch(api('/api/v2/challenges?type=all'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setChallenges(data.challenges);
      } else {
        console.error('Failed to load challenges:', data.error);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setChallengesLoading(false);
    }
  };

  // Load approved games that can have results created
  const loadApprovedGamesForResults = async () => {
    if (!me) return;

    try {
      setApprovedGamesLoading(true);
      const response = await fetch(api('/api/v2/game-results/approved-games'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setApprovedGamesForResults(data.approvedGames);
      } else {
        console.error('Failed to load approved games for results:', data.error);
      }
    } catch (err) {
      console.error('Failed to load approved games for results:', err);
    } finally {
      setApprovedGamesLoading(false);
    }
  };

  // Load pending game result approvals
  const loadPendingApprovals = async () => {
    if (!me) return;

    try {
      setPendingApprovalsLoading(true);
      const response = await fetch(api('/api/v2/game-results/pending-approvals'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setPendingApprovals(data.pendingApprovals);
      } else {
        console.error('Failed to load pending approvals:', data.error);
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setPendingApprovalsLoading(false);
    }
  };

  const deletePublicGame = async (gameId: string) => {
    if (!me || !confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(api(`/api/v2/public-games/${gameId}`), {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Reload the list
        loadMyPublicGames();
        alert('Game deleted successfully!');
      } else {
        console.error('Failed to delete game:', data.error);
        alert(`Failed to delete game: ${data.error}`);
      }
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Error deleting game. Please try again.');
    }
  };

  const editPublicGame = async (gameId: string) => {
    // Find the game to edit
    const game = myPublicGames.find(g => g.id === gameId);
    if (game) {
      setSelectedGameForEdit(game);
      setShowEditGameModal(true);
    }
  };

  const cancelPublicGame = async (gameId: string) => {
    // Find the game to cancel
    const game = myPublicGames.find(g => g.id === gameId);
    if (game) {
      setSelectedGameForCancel(game);
      setShowCancelGameModal(true);
    }
  };

  // Create game result from approved game
  const createGameResult = async (gameData: any) => {
    if (!selectedGameForResult) return;

    try {
      const response = await fetch(api('/api/v2/game-results/from-approved'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          scheduledGameId: selectedGameForResult.id,
          gameData: gameData
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert('Game result created and sent for approval!');
        setShowCreateResultModal(false);
        setSelectedGameForResult(null);
        // Reload data
        loadApprovedGamesForResults();
        loadPendingApprovals();
      } else {
        alert(`Failed to create game result: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to create game result:', err);
      alert('Failed to create game result');
    }
  };

  // Approve game result
  const approveGameResult = async (gameResultId: string, reviewNotes?: string) => {
    try {
      const response = await fetch(api('/api/v2/game-results/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          gameResultId: gameResultId,
          reviewNotes: reviewNotes
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert('Game result approved successfully!');
        setShowApprovalModal(false);
        setSelectedApproval(null);
        // Reload data
        loadPendingApprovals();
        loadGames();
      } else {
        alert(`Failed to approve game result: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to approve game result:', err);
      alert('Failed to approve game result');
    }
  };

  // Reject game result
  const rejectGameResult = async (gameResultId: string, rejectionReason: string, proposedChanges?: any) => {
    try {
      const response = await fetch(api('/api/v2/game-results/reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          gameResultId: gameResultId,
          rejectionReason: rejectionReason,
          proposedChanges: proposedChanges
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert('Game result rejected and proposer notified!');
        setShowApprovalModal(false);
        setSelectedApproval(null);
        // Reload data
        loadPendingApprovals();
      } else {
        alert(`Failed to reject game result: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to reject game result:', err);
      alert('Failed to reject game result');
    }
  };

  // Edit approved game
  const editApprovedGame = async (gameId: string, updates: any) => {
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${gameId}/edit`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          gameId: gameId,
          updates: updates
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert('Game updated and opponent notified!');
        setShowEditGameModal(false);
        setSelectedGameForEdit(null);
        // Reload data
        loadApprovedGamesForResults();
        loadChallenges();
      } else {
        alert(`Failed to edit game: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to edit game:', err);
      alert('Failed to edit game');
    }
  };

  const cancelGame = async (gameId: string, reason?: string) => {
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${gameId}/cancel`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          reason: reason || 'Game cancelled by organizer',
          cancelledBy: me?.id 
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Reload the data
        loadApprovedGamesForResults();
        loadPendingGames();
        loadMyPublicGames();
        setShowCancelGameModal(false);
        setSelectedGameForCancel(null);
        alert('Game cancelled successfully');
      } else {
        console.error('Failed to cancel game:', data.error);
        alert('Failed to cancel game: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling game:', error);
      alert('Error cancelling game');
    }
  };

  useEffect(() => {
    loadGames();
  }, [me, targetPlayerId, filter, mode]);

  useEffect(() => {
    loadApprovedGames();
    loadPendingGames();
    loadMyPublicGames();
    loadChallenges();
    loadApprovedGamesForResults();
    loadPendingApprovals();
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
        <button
          onClick={() => setActiveTab('my-games')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'my-games' ? '#3b82f6' : 'transparent',
            color: activeTab === 'my-games' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          My Games ({pendingGames.length + myPublicGames.length + challenges.length + approvedGamesForResults.length})
        </button>
        <button
          onClick={() => setActiveTab('pending-approvals')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'pending-approvals' ? '#3b82f6' : 'transparent',
            color: activeTab === 'pending-approvals' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Pending Approvals ({pendingApprovals.length})
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

          {/* Approved Games for Results Section */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              🎯 Ready for Results ({approvedGamesForResults.length})
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              These approved games are ready to have results created. Click "Create Result" to submit the game outcome.
            </p>

            {approvedGamesLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                Loading approved games for results...
              </div>
            ) : approvedGamesForResults.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No approved games ready for results
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {approvedGamesForResults.map(game => (
                  <div key={game.id} style={{
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#1f2937'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '16px' }}>
                          {game.mission?.name || 'Mission'}
                        </h4>
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
                          background: '#3b82f6', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          marginBottom: '8px'
                        }}>
                          🎯 READY FOR RESULTS
                        </div>
                        <button
                          onClick={() => {
                            setSelectedGameForResult(game);
                            setShowCreateResultModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Create Result
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#d1d5db', marginBottom: '12px' }}>
                      <div>
                        <strong style={{ color: '#fbbf24' }}>👤 Players:</strong>
                        <span style={{ marginLeft: '8px' }}>
                          {game.player1.name || game.player1.username} vs {game.player2?.name || game.player2?.username || 'TBD'}
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
                      Status: {game.status} • Ready to create results
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'my-games' && (
        <div>
          {/* Challenges Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              ⚔️ Challenges ({challenges.length})
            </h3>
            {challengesLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>Loading challenges...</div>
            ) : challenges.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No challenges found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {challenges.map(challenge => (
                  <div key={challenge.id} style={{
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#1f2937'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px' }}>
                          <strong style={{ color: '#fbbf24' }}>
                            {challenge.challenger.id === me?.id ? 'You challenged' : 'You were challenged by'}
                          </strong>
                          <span style={{ marginLeft: '8px' }}>
                            {challenge.challenger.id === me?.id 
                              ? challenge.challenged.name || challenge.challenged.username || 'Unknown'
                              : challenge.challenger.name || challenge.challenger.username || 'Unknown'
                            }
                          </span>
                        </div>
                        {challenge.challengerStrikeTeam && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Strike Team: {challenge.challengerStrikeTeam.name}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          background: challenge.status === 'PENDING' ? '#f59e0b' : 
                                     challenge.status === 'ACCEPTED' ? '#10b981' :
                                     challenge.status === 'REJECTED' ? '#ef4444' : '#6b7280',
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          {challenge.status}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {new Date(challenge.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {challenge.scheduledGame && (
                      <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                        <strong style={{ color: '#fbbf24' }}>📅 Scheduled:</strong>
                        <span style={{ marginLeft: '8px' }}>
                          {new Date(challenge.scheduledGame.scheduledDate).toLocaleString('pl-PL')}
                        </span>
                        {challenge.scheduledGame.location && (
                          <>
                            <br />
                            <strong style={{ color: '#fbbf24' }}>📍 Location:</strong>
                            <span style={{ marginLeft: '8px' }}>{challenge.scheduledGame.location}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Games Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              ⏳ Pending Games ({pendingGames.length})
            </h3>
            {pendingLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>Loading pending games...</div>
            ) : pendingGames.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No pending games found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {pendingGames.map(game => (
                  <div key={game.id} style={{
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#1f2937'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: '16px' }}>
                          {game.mission?.name || 'Mission'}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                          <strong style={{ color: '#fbbf24' }}>📅 When:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {new Date(game.scheduledDate).toLocaleString('pl-PL', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                          <strong style={{ color: '#fbbf24' }}>📍 Where:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {game.location || game.address || 
                             `${game.city || ''}, ${game.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          background: '#f59e0b', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          ⏳ PENDING
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {new Date(game.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Public Games Section */}
          <div>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              📋 My Public Games ({myPublicGames.length})
            </h3>
            {myPublicGamesLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>Loading your public games...</div>
            ) : myPublicGames.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No public games found. Create one in the Play section!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {myPublicGames.map(game => (
                  <div key={game.id} style={{
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#1f2937'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: '16px' }}>
                          {game.mission?.name || 'Mission'}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                          <strong style={{ color: '#fbbf24' }}>📅 When:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {new Date(game.scheduledDate).toLocaleString('pl-PL', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                          <strong style={{ color: '#fbbf24' }}>📍 Where:</strong>
                          <span style={{ marginLeft: '8px' }}>
                            {game.location || game.address || 
                             `${game.city || ''}, ${game.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          background: '#3b82f6', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          📋 YOUR GAME
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button
                        onClick={() => editPublicGame(game.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => cancelPublicGame(game.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}
                      >
                        🗑️ Cancel
                      </button>
                      <button
                        onClick={() => deletePublicGame(game.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'pending-approvals' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              ⏳ Pending Game Result Approvals ({pendingApprovals.length})
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Review and approve game results proposed by your opponents. You have 48 hours to respond before auto-approval.
            </p>
          </div>

          {pendingApprovalsLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              Loading pending approvals...
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              No pending approvals found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {pendingApprovals.map(approval => (
                <div key={approval.id} style={{
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#1f2937'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '16px' }}>
                        Game Result Proposed by {approval.reportedBy.name || approval.reportedBy.username}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {approval.result} • {approval.mode} • {formatDate(approval.playedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowApprovalModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Review
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#d1d5db' }}>
                    <div><strong>Players:</strong> {approval.player1.name || approval.player1.username} vs {approval.player2.name || approval.player2.username}</div>
                    <div><strong>Winner:</strong> {approval.winner?.name || approval.winner?.username || 'Draw'}</div>
                    <div><strong>Rounds:</strong> {approval.roundsPlayed}</div>
                    {approval.durationMinutes && <div><strong>Duration:</strong> {approval.durationMinutes} min</div>}
                    {approval.mission && <div><strong>Mission:</strong> {approval.mission.name}</div>}
                    {approval.location && <div><strong>Location:</strong> {approval.location}</div>}
                  </div>

                  {approval.notes && (
                    <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#374151', borderRadius: '4px' }}>
                      <strong style={{ color: '#f9fafb' }}>Notes:</strong>
                      <div style={{ color: '#d1d5db', fontSize: '14px', marginTop: '4px' }}>{approval.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Game Result Modal */}
      {showCreateResultModal && selectedGameForResult && (
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
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>Create Game Result</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Create a result for: {selectedGameForResult.player1.name || selectedGameForResult.player1.username} vs {selectedGameForResult.player2?.name || selectedGameForResult.player2?.username}
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const gameData = {
                winnerId: formData.get('winnerId') as string,
                result: formData.get('result') as string,
                mode: formData.get('mode') as string,
                roundsPlayed: parseInt(formData.get('roundsPlayed') as string),
                durationMinutes: formData.get('durationMinutes') ? parseInt(formData.get('durationMinutes') as string) : undefined,
                location: formData.get('location') as string,
                notes: formData.get('notes') as string
              };
              createGameResult(gameData);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Winner</label>
                <select name="winnerId" required style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb'
                }}>
                  <option value="">Select Winner</option>
                  <option value={selectedGameForResult.player1.id}>{selectedGameForResult.player1.name || selectedGameForResult.player1.username}</option>
                  {selectedGameForResult.player2 && (
                    <option value={selectedGameForResult.player2.id}>{selectedGameForResult.player2.name || selectedGameForResult.player2.username}</option>
                  )}
                  <option value="draw">Draw</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Result</label>
                <select name="result" required style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb'
                }}>
                  <option value="WIN">Win</option>
                  <option value="LOSS">Loss</option>
                  <option value="DRAW">Draw</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Mode</label>
                <select name="mode" required style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb'
                }}>
                  <option value="FRIENDLY">Friendly</option>
                  <option value="CASUAL">Casual</option>
                  <option value="RANKED">Ranked</option>
                  <option value="TOURNAMENT">Tournament</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Rounds</label>
                  <input type="number" name="roundsPlayed" defaultValue="1" min="1" required style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb'
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Duration (min)</label>
                  <input type="number" name="durationMinutes" min="1" style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb'
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Location</label>
                <input type="text" name="location" defaultValue={selectedGameForResult.location} style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb'
                }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#f9fafb', marginBottom: '4px' }}>Notes</label>
                <textarea name="notes" rows={3} style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb',
                  resize: 'vertical'
                }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => {
                  setShowCreateResultModal(false);
                  setSelectedGameForResult(null);
                }} style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Create Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedApproval && (
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
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>Review Game Result</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Proposed by: {selectedApproval.reportedBy.name || selectedApproval.reportedBy.username}
            </p>
            
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#374151', borderRadius: '4px' }}>
              <div style={{ color: '#f9fafb', marginBottom: '8px' }}><strong>Game Details:</strong></div>
              <div style={{ fontSize: '14px', color: '#d1d5db' }}>
                <div>Result: {selectedApproval.result}</div>
                <div>Winner: {selectedApproval.winner?.name || selectedApproval.winner?.username || 'Draw'}</div>
                <div>Rounds: {selectedApproval.roundsPlayed}</div>
                {selectedApproval.durationMinutes && <div>Duration: {selectedApproval.durationMinutes} min</div>}
                {selectedApproval.mission && <div>Mission: {selectedApproval.mission.name}</div>}
                {selectedApproval.location && <div>Location: {selectedApproval.location}</div>}
                {selectedApproval.notes && <div>Notes: {selectedApproval.notes}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => {
                const reviewNotes = prompt('Add review notes (optional):');
                approveGameResult(selectedApproval.id, reviewNotes || undefined);
              }} style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                ✅ Approve
              </button>
              <button onClick={() => {
                const reason = prompt('Rejection reason:');
                if (reason) {
                  const changes = prompt('Proposed changes (optional):');
                  rejectGameResult(selectedApproval.id, reason, changes ? { notes: changes } : undefined);
                }
              }} style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                ❌ Reject
              </button>
              <button onClick={() => {
                setShowApprovalModal(false);
                setSelectedApproval(null);
              }} style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Game Modal */}
      {showCancelGameModal && selectedGameForCancel && (
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
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>Cancel Game</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Are you sure you want to cancel this game? This action cannot be undone.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#d1d5db', fontSize: '14px', marginBottom: '8px' }}>
                Reason for cancellation (optional):
              </label>
              <textarea
                id="cancelReason"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb',
                  resize: 'vertical'
                }}
                placeholder="Enter reason for cancellation..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCancelGameModal(false);
                  setSelectedGameForCancel(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Keep Game
              </button>
              <button
                onClick={() => {
                  const reason = (document.getElementById('cancelReason') as HTMLTextAreaElement)?.value;
                  cancelGame(selectedGameForCancel.id, reason);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
