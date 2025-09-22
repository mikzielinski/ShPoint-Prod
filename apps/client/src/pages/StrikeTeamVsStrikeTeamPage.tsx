import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface StrikeTeam {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    portrait?: string;
  }>;
  wins: number;
  losses: number;
  draws: number;
}

const StrikeTeamVsStrikeTeamPage: React.FC = () => {
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam1, setSelectedTeam1] = useState<StrikeTeam | null>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<StrikeTeam | null>(null);
  const [showPublic, setShowPublic] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStrikeTeams();
  }, []);

  const loadStrikeTeams = async () => {
    try {
      const response = await fetch('/api/shatterpoint/strike-teams', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStrikeTeams(data.strikeTeams || []);
      }
    } catch (error) {
      console.error('Error loading strike teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (team: StrikeTeam, teamNumber: 1 | 2) => {
    if (teamNumber === 1) {
      setSelectedTeam1(team);
    } else {
      setSelectedTeam2(team);
    }
  };

  const handleStartBattle = () => {
    if (selectedTeam1 && selectedTeam2) {
      // Navigate to battle page with selected teams
      navigate(`/play/battle?team1=${selectedTeam1.id}&team2=${selectedTeam2.id}`);
    }
  };

  const filteredTeams = strikeTeams.filter(team => 
    showPublic ? team.isPublic : !team.isPublic
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: '#f9fafb'
      }}>
        Loading strike teams...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      color: '#f9fafb'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #4b5563'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#f9fafb',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          🎯 Strike Team vs Strike Team
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          Select two strike teams to battle
        </p>

        {/* Team Selection */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {/* Team 1 Selection */}
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            border: selectedTeam1 ? '2px solid #3b82f6' : '2px solid #374151',
            minWidth: '320px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f9fafb',
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              {selectedTeam1 ? selectedTeam1.name : 'Team 1'}
            </h3>
            {selectedTeam1 ? (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }}>
                  {selectedTeam1.characters.length} characters
                </p>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  <span>W: {selectedTeam1.wins}</span>
                  <span>L: {selectedTeam1.losses}</span>
                  <span>D: {selectedTeam1.draws}</span>
                </div>
                <button
                  onClick={() => setSelectedTeam1(null)}
                  style={{
                    padding: '4px 8px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                Select a team
              </div>
            )}
          </div>

          {/* Team 2 Selection */}
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            border: selectedTeam2 ? '2px solid #ef4444' : '2px solid #374151',
            minWidth: '320px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f9fafb',
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              {selectedTeam2 ? selectedTeam2.name : 'Team 2'}
            </h3>
            {selectedTeam2 ? (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }}>
                  {selectedTeam2.characters.length} characters
                </p>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  <span>W: {selectedTeam2.wins}</span>
                  <span>L: {selectedTeam2.losses}</span>
                  <span>D: {selectedTeam2.draws}</span>
                </div>
                <button
                  onClick={() => setSelectedTeam2(null)}
                  style={{
                    padding: '4px 8px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                Select a team
              </div>
            )}
          </div>
        </div>

        {/* Start Battle Button */}
        {selectedTeam1 && selectedTeam2 && (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={handleStartBattle}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              🎯 Start Battle
            </button>
          </div>
        )}

        {/* Team Filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setShowPublic(true)}
            style={{
              padding: '8px 16px',
              background: showPublic ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Public Teams
          </button>
          <button
            onClick={() => setShowPublic(false)}
            style={{
              padding: '8px 16px',
              background: !showPublic ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            My Teams
          </button>
        </div>

        {/* Available Teams */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => {
                if (!selectedTeam1) {
                  handleTeamSelect(team, 1);
                } else if (!selectedTeam2) {
                  handleTeamSelect(team, 2);
                }
              }}
              style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: (selectedTeam1 && selectedTeam2) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!selectedTeam1 || !selectedTeam2) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.background = '#1f2937';
              }}
            >
              <h4 style={{
                color: '#f9fafb',
                margin: '0 0 8px 0',
                fontSize: '16px'
              }}>
                {team.name}
              </h4>
              <p style={{
                color: '#9ca3af',
                fontSize: '14px',
                margin: '0 0 12px 0'
              }}>
                {team.characters.length} characters
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                <span>W: {team.wins}</span>
                <span>L: {team.losses}</span>
                <span>D: {team.draws}</span>
              </div>
              <div style={{
                fontSize: '12px',
                color: team.isPublic ? '#10b981' : '#f59e0b'
              }}>
                {team.isPublic ? '🌐 Public' : '🔒 Private'}
              </div>
            </div>
          ))}
        </div>


        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/play')}
            style={{
              padding: '8px 16px',
              background: '#374151',
              color: '#f9fafb',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrikeTeamVsStrikeTeamPage;
