import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/env';

interface StrikeTeam {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  characters: StrikeTeamCharacter[];
  wins: number;
  losses: number;
  draws: number;
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
  characterName?: string;
}

interface Character {
  id: string;
  name: string;
  role?: string;
  faction?: string;
  portrait?: string;
  tags?: string[];
  sp?: number;
  pc?: number;
  era?: string;
}

const StrikeTeamVsStrikeTeamPage: React.FC = () => {
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam1, setSelectedTeam1] = useState<StrikeTeam | null>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<StrikeTeam | null>(null);
  const [showPublic, setShowPublic] = useState(false);
  const [showVSAnimation, setShowVSAnimation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCurrentUser(),
        loadStrikeTeams(),
        loadCharacters()
      ]);
    };
    loadData();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(api('/auth/status'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user?.id || null);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadStrikeTeams = async () => {
    try {
      let allTeams: StrikeTeam[] = [];
      
      // Load user's own teams (private + public)
      const userResponse = await fetch(api('/api/shatterpoint/strike-teams'), {
        credentials: 'include'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        allTeams = [...allTeams, ...(userData.strikeTeams || [])];
      }
      
      // Load all public teams (from all users)
      const publicResponse = await fetch(api('/api/shatterpoint/strike-teams/public'), {
        credentials: 'include'
      });
      
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        // Only add public teams that are not already in user's teams (avoid duplicates)
        const userTeamIds = new Set(allTeams.map(team => team.id));
        const newPublicTeams = (publicData.strikeTeams || []).filter((team: StrikeTeam) => !userTeamIds.has(team.id));
        allTeams = [...allTeams, ...newPublicTeams];
      }
      
      setStrikeTeams(allTeams);
    } catch (error) {
      console.error('Error loading strike teams:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await fetch(api('/api/characters'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCharacters(data.items || []);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
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
    console.log('handleStartBattle called:', { 
      selectedTeam1: selectedTeam1 ? { id: selectedTeam1.id, name: selectedTeam1.name } : null, 
      selectedTeam2: selectedTeam2 ? { id: selectedTeam2.id, name: selectedTeam2.name } : null 
    });
    
    if (selectedTeam1 && selectedTeam2) {
      console.log('Starting battle with teams:', { team1Id: selectedTeam1.id, team2Id: selectedTeam2.id });
      setShowVSAnimation(true);
      
      // Store team IDs to avoid closure issues
      const team1Id = selectedTeam1.id;
      const team2Id = selectedTeam2.id;
      
      // Navigate to battle page with selected teams after animation
      setTimeout(() => {
        const battleUrl = `/play/battle?team1=${team1Id}&team2=${team2Id}`;
        console.log('Navigating to:', battleUrl);
        navigate(battleUrl);
      }, 3000);
    } else {
      console.log('Cannot start battle - missing teams:', { 
        selectedTeam1: selectedTeam1 ? selectedTeam1.name : 'null', 
        selectedTeam2: selectedTeam2 ? selectedTeam2.name : 'null' 
      });
      alert('Proszę wybrać oba zespoły przed rozpoczęciem walki.');
    }
  };

  // Filter teams based on showPublic and security
  const filteredTeams = showPublic 
    ? strikeTeams.filter(team => team.isPublished) // Only published teams from all users
    : strikeTeams.filter(team => 
        !team.isPublished && team.user && currentUserId && team.user.id === currentUserId // Only current user's private teams
      );

  // Helper function to find character by ID
  const findCharacter = (characterId: string): Character | undefined => {
    return characters.find(char => char.id === characterId);
  };

  // Helper function to get characters for a team organized by role
  const getTeamCharacters = (team: StrikeTeam) => {
    const primaryChars = team.characters.filter(char => char.role === 'PRIMARY').map(char => findCharacter(char.characterId)).filter(Boolean);
    const secondaryChars = team.characters.filter(char => char.role === 'SECONDARY').map(char => findCharacter(char.characterId)).filter(Boolean);
    const supportChars = team.characters.filter(char => char.role === 'SUPPORT').map(char => findCharacter(char.characterId)).filter(Boolean);
    
    return { primaryChars, secondaryChars, supportChars };
  };

  // VS Animation Component
  const VSAnimation = () => {
    if (!showVSAnimation || !selectedTeam1 || !selectedTeam2) return null;

    const team1Chars = getTeamCharacters(selectedTeam1);
    const team2Chars = getTeamCharacters(selectedTeam2);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Team 1 - slides in from left */}
        <div style={{
          position: 'absolute',
          left: '-300px',
          animation: 'team1SlideIn 1.5s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Team 1 Characters */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}>
            {/* Primary Characters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {team1Chars.primaryChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/60/80"}
                  alt={char?.name}
                  style={{
                    width: '60px',
                    height: '80px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#4b5563',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                />
              ))}
            </div>
            {/* Secondary Characters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {team1Chars.secondaryChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/50/65"}
                  alt={char?.name}
                  style={{
                    width: '50px',
                    height: '65px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    background: '#4b5563',
                    boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)'
                  }}
                />
              ))}
            </div>
            {/* Support Characters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {team1Chars.supportChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/50/65"}
                  alt={char?.name}
                  style={{
                    width: '50px',
                    height: '65px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    background: '#4b5563',
                    boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)'
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {selectedTeam1.name}
          </div>
        </div>

        {/* Team 2 - slides in from right */}
        <div style={{
          position: 'absolute',
          right: '-300px',
          animation: 'team2SlideIn 1.5s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Team 2 Characters */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}>
            {/* Primary Characters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {team2Chars.primaryChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/60/80"}
                  alt={char?.name}
                  style={{
                    width: '60px',
                    height: '80px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#4b5563',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                  }}
                />
              ))}
            </div>
            {/* Secondary Characters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {team2Chars.secondaryChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/50/65"}
                  alt={char?.name}
                  style={{
                    width: '50px',
                    height: '65px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    background: '#4b5563',
                    boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)'
                  }}
                />
              ))}
            </div>
            {/* Support Characters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {team2Chars.supportChars.map((char, index) => (
                <img
                  key={index}
                  src={char?.portrait || "https://picsum.photos/seed/placeholder/50/65"}
                  alt={char?.name}
                  style={{
                    width: '50px',
                    height: '65px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    background: '#4b5563',
                    boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)'
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {selectedTeam2.name}
          </div>
        </div>

        {/* VS in center */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'vsAppear 2s ease-out forwards',
          opacity: 0,
          transform: 'translate(-50%, -50%) scale(0)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#0f172a',
            padding: '24px 48px',
            borderRadius: '20px',
            fontSize: '48px',
            fontWeight: '900',
            textAlign: 'center',
            boxShadow: '0 12px 48px rgba(251, 191, 36, 0.5)',
            border: '4px solid #f59e0b',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            minWidth: '120px',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            VS
          </div>
        </div>

        {/* Sparks effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'sparks 1s ease-out 1.5s forwards',
          opacity: 0
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, #fbbf24, transparent)',
            borderRadius: '50%',
            filter: 'blur(2px)'
          }} />
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes team1SlideIn {
              0% { left: -300px; opacity: 0; }
              50% { left: 15%; opacity: 1; }
              100% { left: 15%; opacity: 1; }
            }
            
            @keyframes team2SlideIn {
              0% { right: -300px; opacity: 0; }
              50% { right: 15%; opacity: 1; }
              100% { right: 15%; opacity: 1; }
            }
            
            @keyframes vsAppear {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes sparks {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
            }
          `
        }} />
      </div>
    );
  };

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
      {/* VS Animation */}
      <VSAnimation />
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
                {/* Character Portraits */}
                {(() => {
                  const teamChars = getTeamCharacters(selectedTeam1);
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      {/* Primary Characters */}
                      {teamChars.primaryChars.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                          {teamChars.primaryChars.map((char, index) => (
                            <img
                              key={index}
                              src={char?.portrait || "https://picsum.photos/seed/placeholder/40/50"}
                              alt={char?.name}
                              style={{
                                width: '40px',
                                height: '50px',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                background: '#1f2937',
                                border: '1px solid #3b82f6'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {/* Secondary & Support Characters */}
                      {(teamChars.secondaryChars.length > 0 || teamChars.supportChars.length > 0) && (
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                          {[...teamChars.secondaryChars, ...teamChars.supportChars].map((char, index) => (
                            <img
                              key={index}
                              src={char?.portrait || "https://picsum.photos/seed/placeholder/30/40"}
                              alt={char?.name}
                              style={{
                                width: '30px',
                                height: '40px',
                                objectFit: 'contain',
                                borderRadius: '3px',
                                background: '#1f2937',
                                border: '1px solid #8b5cf6'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
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
                {/* Character Portraits */}
                {(() => {
                  const teamChars = getTeamCharacters(selectedTeam2);
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      {/* Primary Characters */}
                      {teamChars.primaryChars.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                          {teamChars.primaryChars.map((char, index) => (
                            <img
                              key={index}
                              src={char?.portrait || "https://picsum.photos/seed/placeholder/40/50"}
                              alt={char?.name}
                              style={{
                                width: '40px',
                                height: '50px',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                background: '#1f2937',
                                border: '1px solid #ef4444'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {/* Secondary & Support Characters */}
                      {(teamChars.secondaryChars.length > 0 || teamChars.supportChars.length > 0) && (
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                          {[...teamChars.secondaryChars, ...teamChars.supportChars].map((char, index) => (
                            <img
                              key={index}
                              src={char?.portrait || "https://picsum.photos/seed/placeholder/30/40"}
                              alt={char?.name}
                              style={{
                                width: '30px',
                                height: '40px',
                                objectFit: 'contain',
                                borderRadius: '3px',
                                background: '#1f2937',
                                border: '1px solid #f59e0b'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
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
              
              {/* Character Portraits by Squad */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '8px'
              }}>
                {/* Squad 1 (Primary, Secondary, Support) */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  justifyContent: 'center'
                }}>
                  {team.characters.filter(char => char.role === 'PRIMARY').map((teamChar, index) => {
                    const character = findCharacter(teamChar.characterId);
                    return (
                      <img
                        key={`primary-${index}`}
                        src={character?.portrait || "https://picsum.photos/seed/placeholder/80/100"}
                        alt={character?.name || 'Unknown'}
                        style={{
                          width: '80px',
                          height: '100px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          background: '#374151',
                          border: '2px solid #3b82f6' // Blue border for Primary
                        }}
                        title={`Primary: ${character?.name || 'Unknown'}`}
                      />
                    );
                  })}
                </div>
                
                {/* Squad 2 (Secondary, Support) */}
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  justifyContent: 'center'
                }}>
                  {team.characters.filter(char => char.role === 'SECONDARY').map((teamChar, index) => {
                    const character = findCharacter(teamChar.characterId);
                    return (
                      <img
                        key={`secondary-${index}`}
                        src={character?.portrait || "https://picsum.photos/seed/placeholder/70/90"}
                        alt={character?.name || 'Unknown'}
                        style={{
                          width: '70px',
                          height: '90px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          background: '#374151',
                          border: '1px solid #8b5cf6' // Purple border for Secondary
                        }}
                        title={`Secondary: ${character?.name || 'Unknown'}`}
                      />
                    );
                  })}
                  {team.characters.filter(char => char.role === 'SUPPORT').map((teamChar, index) => {
                    const character = findCharacter(teamChar.characterId);
                    return (
                      <img
                        key={`support-${index}`}
                        src={character?.portrait || "https://picsum.photos/seed/placeholder/70/90"}
                        alt={character?.name || 'Unknown'}
                        style={{
                          width: '70px',
                          height: '90px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          background: '#374151',
                          border: '1px solid #10b981' // Green border for Support
                        }}
                        title={`Support: ${character?.name || 'Unknown'}`}
                      />
                    );
                  })}
                </div>
              </div>
              
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
                color: team.isPublished ? '#10b981' : '#f59e0b'
              }}>
                {team.isPublished ? '🌐 Public' : '🔒 Private'}
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
