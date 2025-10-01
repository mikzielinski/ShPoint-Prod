import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

interface Challenge {
  id: string;
  challenger: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  challengee?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  mission: string;
  location: string;
  description?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  scheduledFor?: string;
}

const ChallengeSystem: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    challengeeId: '',
    mission: '',
    location: '',
    description: '',
    challengerStrikeTeamId: ''
  });
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }>>([]);
  const [strikeTeams, setStrikeTeams] = useState<Array<{
    id: string;
    name: string;
    description?: string;
  }>>([]);
  const [missions, setMissions] = useState<Array<{
    id: string;
    name: string;
    description?: string;
  }>>([]);

  const loadChallenges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(api('/api/v2/challenges'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setChallenges(data.challenges || []);
        }
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(api('/api/v2/players/available'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setAvailableUsers(data.players || []);
        }
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const loadStrikeTeams = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(api('/api/shatterpoint/strike-teams'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setStrikeTeams(data.strikeTeams || []);
        }
      }
    } catch (error) {
      console.error('Error loading strike teams:', error);
    }
  };

  const loadMissions = async () => {
    console.log('🔄 ChallengeSystem: Loading missions...');
    try {
      const url = api('/api/missions');
      console.log('🔄 ChallengeSystem: API URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('🔄 ChallengeSystem: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 ChallengeSystem: Response data:', data);
        if (data.ok) {
          setMissions(data.missions || []);
          console.log('✅ ChallengeSystem: Loaded missions:', data.missions);
        } else {
          console.error('❌ ChallengeSystem: Failed to load missions:', data);
        }
      } else {
        console.error('❌ ChallengeSystem: Missions API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ ChallengeSystem: Error loading missions:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 ChallengeSystem: useEffect triggered, user:', user ? user.email : 'null');
    if (user) {
      console.log('🔄 ChallengeSystem: User authenticated, loading data...');
      loadChallenges();
      loadAvailableUsers();
      loadStrikeTeams();
      loadMissions();
    } else {
      console.log('🔄 ChallengeSystem: No user, skipping API calls');
    }
  }, [user]);

  const createChallenge = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(api('/api/v2/challenges'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newChallenge)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setShowCreateForm(false);
          setNewChallenge({
            challengeeId: '',
            mission: '',
            location: '',
            description: ''
          });
          loadChallenges();
        }
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const respondToChallenge = async (challengeId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch(api(`/api/v2/challenges/${challengeId}/respond`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        loadChallenges();
      }
    } catch (error) {
      console.error('Error responding to challenge:', error);
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
          You need to be logged in to use the challenge system.
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
          ⚔️ Challenge System
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
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
          + Create Challenge
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
          <h3 style={{ color: '#f9fafb', marginBottom: '16px' }}>Create New Challenge</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Challenge Player *
            </label>
            <select
              value={newChallenge.challengeeId}
              onChange={(e) => setNewChallenge({...newChallenge, challengeeId: e.target.value})}
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
              <option value="">Select Player to Challenge</option>
              {availableUsers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name || player.username || 'Unknown User'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Mission
            </label>
            <select
              value={newChallenge.mission}
              onChange={(e) => setNewChallenge({...newChallenge, mission: e.target.value})}
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
                <option key={mission.id} value={mission.name}>
                  {mission.name}
                </option>
              ))}
            </select>
          </div>


          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Location
            </label>
            <input
              type="text"
              value={newChallenge.location}
              onChange={(e) => setNewChallenge({...newChallenge, location: e.target.value})}
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
              placeholder="Any additional details..."
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
              onClick={createChallenge}
              disabled={!newChallenge.challengeeId || !newChallenge.mission || !newChallenge.location}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: (!newChallenge.challengeeId || !newChallenge.mission || !newChallenge.location) ? 0.5 : 1
              }}
            >
              Send Challenge
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
          <p style={{ color: '#9ca3af' }}>Loading challenges...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af' }}>No challenges yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {challenges.map((challenge) => (
            <div key={challenge.id} style={{
              background: '#374151',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #4b5563'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: '16px' }}>
                    Challenge: {challenge.mission}
                  </h4>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
                    From: {challenge.challenger.name} • Location: {challenge.location}
                  </p>
                </div>
                <span style={{
                  background: challenge.status === 'PENDING' ? '#f59e0b' : 
                             challenge.status === 'ACCEPTED' ? '#10b981' : '#ef4444',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {challenge.status}
                </span>
              </div>
              
              {challenge.description && (
                <p style={{ color: '#d1d5db', margin: '0 0 12px 0', fontSize: '14px' }}>
                  {challenge.description}
                </p>
              )}
              
              {challenge.status === 'PENDING' && challenge.challengee?.id === user.id && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => respondToChallenge(challenge.id, 'ACCEPTED')}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToChallenge(challenge.id, 'REJECTED')}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeSystem;
