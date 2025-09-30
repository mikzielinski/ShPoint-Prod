import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface User {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}

interface StrikeTeam {
  id: string;
  name: string;
  description?: string;
}

interface Mission {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

interface Character {
  id: string;
  name: string;
  portraitUrl?: string;
}

interface GameResultLoggerProps {
  onClose?: () => void;
  initialPlayer1Id?: string;
  initialPlayer2Id?: string;
  initialPlayer1StrikeTeamId?: string;
  initialPlayer2StrikeTeamId?: string;
  initialMissionId?: string;
}

export default function GameResultLogger({
  onClose,
  initialPlayer1Id,
  initialPlayer2Id,
  initialPlayer1StrikeTeamId,
  initialPlayer2StrikeTeamId,
  initialMissionId
}: GameResultLoggerProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [player1Id, setPlayer1Id] = useState(initialPlayer1Id || '');
  const [player2Id, setPlayer2Id] = useState(initialPlayer2Id || '');
  const [winnerId, setWinnerId] = useState('');
  const [result, setResult] = useState<'WIN' | 'LOSS' | 'DRAW'>('WIN');
  const [mode, setMode] = useState<'CASUAL' | 'RANKED' | 'TOURNAMENT' | 'FRIENDLY'>('CASUAL');
  const [missionId, setMissionId] = useState(initialMissionId || '');
  const [player1StrikeTeamId, setPlayer1StrikeTeamId] = useState(initialPlayer1StrikeTeamId || '');
  const [player2StrikeTeamId, setPlayer2StrikeTeamId] = useState(initialPlayer2StrikeTeamId || '');
  const [roundsPlayed, setRoundsPlayed] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // Data for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [player1StrikeTeams, setPlayer1StrikeTeams] = useState<StrikeTeam[]>([]);
  const [player2StrikeTeams, setPlayer2StrikeTeams] = useState<StrikeTeam[]>([]);

  const loadData = async () => {
    if (!me) return;

    try {
      setLoading(true);
      
      // Load users, missions, and user's strike teams
      const [usersRes, missionsRes, strikeTeamsRes] = await Promise.all([
        fetch(`${api}/api/v2/players/available`, {
          headers: { 'Authorization': `Bearer ${me.token}` }
        }),
        fetch(`${api}/api/v2/missions`),
        fetch(`${api}/api/strike-teams`, {
          headers: { 'Authorization': `Bearer ${me.token}` }
        })
      ]);

      const [usersData, missionsData, strikeTeamsData] = await Promise.all([
        usersRes.json(),
        missionsRes.json(),
        strikeTeamsRes.json()
      ]);

      if (usersData.ok) {
        setUsers(usersData.players || []);
      }
      
      if (missionsData.ok) {
        setMissions(missionsData.missions || []);
      }
      
      if (strikeTeamsData.ok) {
        setStrikeTeams(strikeTeamsData.strikeTeams || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [me]);

  // Load strike teams for selected players
  useEffect(() => {
    if (player1Id) {
      const player1Teams = strikeTeams.filter(team => team.userId === player1Id);
      setPlayer1StrikeTeams(player1Teams);
    } else {
      setPlayer1StrikeTeams([]);
    }
  }, [player1Id, strikeTeams]);

  useEffect(() => {
    if (player2Id) {
      const player2Teams = strikeTeams.filter(team => team.userId === player2Id);
      setPlayer2StrikeTeams(player2Teams);
    } else {
      setPlayer2StrikeTeams([]);
    }
  }, [player2Id, strikeTeams]);

  // Update winner when result changes
  useEffect(() => {
    if (result === 'DRAW') {
      setWinnerId('');
    } else if (result === 'WIN' && player1Id && player2Id) {
      setWinnerId(player1Id);
    } else if (result === 'LOSS' && player1Id && player2Id) {
      setWinnerId(player2Id);
    }
  }, [result, player1Id, player2Id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!me) return;

    if (!player1Id || !player2Id) {
      setError('Please select both players');
      return;
    }

    if (result !== 'DRAW' && !winnerId) {
      setError('Please select a winner');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${api}/api/v2/game-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${me.token}`
        },
        body: JSON.stringify({
          player1Id,
          player2Id,
          winnerId: result === 'DRAW' ? null : winnerId,
          result,
          mode,
          missionId: missionId || null,
          player1StrikeTeamId: player1StrikeTeamId || null,
          player2StrikeTeamId: player2StrikeTeamId || null,
          roundsPlayed,
          durationMinutes: durationMinutes || null,
          location: location || null,
          notes: notes || null
        })
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to save game result');
      }
    } catch (err) {
      setError('Failed to save game result');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        color: '#155724'
      }}>
        <h3>✅ Game Result Saved Successfully!</h3>
        <p>Closing in 2 seconds...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Log Game Result</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        )}
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

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Player 1 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Player 1 *
            </label>
            <select
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Player 1</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Player 2 *
            </label>
            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Player 2</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Result *
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['WIN', 'LOSS', 'DRAW'] as const).map(resultOption => (
              <label key={resultOption} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="result"
                  value={resultOption}
                  checked={result === resultOption}
                  onChange={(e) => setResult(e.target.value as any)}
                />
                {resultOption}
              </label>
            ))}
          </div>
        </div>

        {/* Winner (if not draw) */}
        {result !== 'DRAW' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Winner *
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Winner</option>
              {player1Id && (
                <option value={player1Id}>
                  Player 1: {users.find(u => u.id === player1Id)?.name || users.find(u => u.id === player1Id)?.username || 'Unknown'}
                </option>
              )}
              {player2Id && (
                <option value={player2Id}>
                  Player 2: {users.find(u => u.id === player2Id)?.name || users.find(u => u.id === player2Id)?.username || 'Unknown'}
                </option>
              )}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Mode */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Game Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="CASUAL">Casual</option>
              <option value="RANKED">Ranked</option>
              <option value="TOURNAMENT">Tournament</option>
              <option value="FRIENDLY">Friendly</option>
            </select>
          </div>

          {/* Mission */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Mission
            </label>
            <select
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Mission (Optional)</option>
              {missions.map(mission => (
                <option key={mission.id} value={mission.id}>
                  {mission.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Player 1 Strike Team */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Player 1 Strike Team
            </label>
            <select
              value={player1StrikeTeamId}
              onChange={(e) => setPlayer1StrikeTeamId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Strike Team (Optional)</option>
              {player1StrikeTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 Strike Team */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Player 2 Strike Team
            </label>
            <select
              value={player2StrikeTeamId}
              onChange={(e) => setPlayer2StrikeTeamId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Strike Team (Optional)</option>
              {player2StrikeTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Rounds Played */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Rounds Played
            </label>
            <input
              type="number"
              min="1"
              value={roundsPlayed}
              onChange={(e) => setRoundsPlayed(parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Duration */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where was the game played?"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about the game..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Game Result'}
          </button>
        </div>
      </form>
    </div>
  );
}
