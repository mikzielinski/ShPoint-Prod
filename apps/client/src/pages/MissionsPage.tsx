import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

interface Mission {
  id: string;
  name: string;
  code: string; // MXX
  type: 'Campaign' | 'Skirmish' | 'Tournament' | 'Special';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  description?: string;
  objectives?: string[];
  rewards?: string[];
  era?: string;
  faction?: string;
}

interface MissionCollection {
  id: string;
  missionId: string;
  status: 'OWNED' | 'COMPLETED' | 'WISHLIST' | 'LOCKED';
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const MissionsPage: React.FC = () => {
  const { auth } = useAuth();
  const me = auth.user;
  const [allMissions, setAllMissions] = useState<Mission[]>([]);
  const [missionCollections, setMissionCollections] = useState<MissionCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OWNED' | 'COMPLETED' | 'WISHLIST' | 'LOCKED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Campaign' | 'Skirmish' | 'Tournament' | 'Special'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'Easy' | 'Medium' | 'Hard' | 'Expert'>('ALL');

  // Mock data for missions
  const mockMissions: Mission[] = [
    {
      id: 'm01',
      name: 'The Clone Wars Begins',
      code: 'M01',
      type: 'Campaign',
      difficulty: 'Easy',
      description: 'The opening mission of the Clone Wars campaign',
      objectives: ['Secure the landing zone', 'Eliminate enemy forces', 'Protect the command post'],
      rewards: ['Clone Trooper unit', 'Experience points'],
      era: 'Clone Wars',
      faction: 'Galactic Republic'
    },
    {
      id: 'm02',
      name: 'Battle of Geonosis',
      code: 'M02',
      type: 'Campaign',
      difficulty: 'Medium',
      description: 'The epic battle that started the Clone Wars',
      objectives: ['Capture the droid factory', 'Rescue the Jedi', 'Escape the planet'],
      rewards: ['Jedi Master unit', 'Advanced equipment'],
      era: 'Clone Wars',
      faction: 'Galactic Republic'
    },
    {
      id: 'm03',
      name: 'The Empire Strikes',
      code: 'M03',
      type: 'Campaign',
      difficulty: 'Hard',
      description: 'The Empire launches its assault on the Rebel base',
      objectives: ['Defend the base', 'Evacuate personnel', 'Destroy Imperial walkers'],
      rewards: ['Rebel Alliance unit', 'Imperial technology'],
      era: 'Galactic Civil War',
      faction: 'Rebel Alliance'
    },
    {
      id: 'm04',
      name: 'Hoth Defense',
      code: 'M04',
      type: 'Skirmish',
      difficulty: 'Medium',
      description: 'Defend Echo Base from Imperial forces',
      objectives: ['Protect the shield generator', 'Hold the perimeter', 'Buy time for evacuation'],
      rewards: ['Snowspeeder unit', 'Defensive equipment'],
      era: 'Galactic Civil War',
      faction: 'Rebel Alliance'
    },
    {
      id: 'm05',
      name: 'The Mandalorian Way',
      code: 'M05',
      type: 'Campaign',
      difficulty: 'Medium',
      description: 'Follow the path of the Mandalorian',
      objectives: ['Find the target', 'Complete the bounty', 'Escape with the prize'],
      rewards: ['Mandalorian unit', 'Beskar equipment'],
      era: 'The New Republic',
      faction: 'Mandalorian'
    },
    {
      id: 'm06',
      name: 'Jedi Temple Assault',
      code: 'M06',
      type: 'Campaign',
      difficulty: 'Expert',
      description: 'The dark side attacks the Jedi Temple',
      objectives: ['Defend the temple', 'Protect the younglings', 'Face the Sith'],
      rewards: ['Jedi Knight unit', 'Lightsaber crystals'],
      era: 'Clone Wars',
      faction: 'Galactic Republic'
    },
    {
      id: 'm07',
      name: 'Death Star Assault',
      code: 'M07',
      type: 'Campaign',
      difficulty: 'Expert',
      description: 'The ultimate mission to destroy the Death Star',
      objectives: ['Navigate the trench', 'Destroy the reactor', 'Escape the explosion'],
      rewards: ['X-wing unit', 'Death Star plans'],
      era: 'Galactic Civil War',
      faction: 'Rebel Alliance'
    },
    {
      id: 'm08',
      name: 'Tournament Championship',
      code: 'M08',
      type: 'Tournament',
      difficulty: 'Hard',
      description: 'Compete in the galactic tournament',
      objectives: ['Win the tournament', 'Defeat all opponents', 'Claim the championship'],
      rewards: ['Championship trophy', 'Exclusive unit'],
      era: 'Multiple',
      faction: 'Any'
    },
    {
      id: 'm09',
      name: 'The Force Awakens',
      code: 'M09',
      type: 'Campaign',
      difficulty: 'Medium',
      description: 'The First Order rises to power',
      objectives: ['Resist the First Order', 'Find the map', 'Awaken the Force'],
      rewards: ['Resistance unit', 'Force artifacts'],
      era: 'The New Republic',
      faction: 'Resistance'
    },
    {
      id: 'm10',
      name: 'Special Operations',
      code: 'M10',
      type: 'Special',
      difficulty: 'Hard',
      description: 'A special mission with unique challenges',
      objectives: ['Complete the objective', 'Survive the mission', 'Extract safely'],
      rewards: ['Special unit', 'Unique equipment'],
      era: 'Multiple',
      faction: 'Any'
    }
  ];

  useEffect(() => {
    setAllMissions(mockMissions);
    setLoading(false);
  }, []);

  // Load user's mission collections
  useEffect(() => {
    const loadMissionCollections = async () => {
      if (auth.status !== 'authenticated' || !me) {
        setMissionCollections([]);
        return;
      }
      
      try {
        const response = await fetch(api('/api/shatterpoint/missions'), {
          credentials: 'include'
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const collections = responseData.collections || responseData || [];
          setMissionCollections(collections);
        } else if (response.status === 401) {
          setMissionCollections([]);
        } else {
          console.error('Error loading mission collections:', response.status);
          setMissionCollections([]);
        }
      } catch (error) {
        console.error('Error loading mission collections:', error);
        setMissionCollections([]);
      }
    };

    loadMissionCollections();
  }, [auth.status, me]);

  const getCollectedMissions = () => {
    return allMissions.map(mission => ({
      ...mission,
      collection: missionCollections.find(c => c.missionId === mission.id) || null
    }));
  };

  const getFilteredMissions = () => {
    let filtered = getCollectedMissions();
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(m => m.collection?.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'ALL') {
      filtered = filtered.filter(m => m.difficulty === difficultyFilter);
    }
    
    return filtered;
  };

  const handleAddToCollection = async (missionId: string, status: 'OWNED' | 'WISHLIST') => {
    if (!me) return;

    try {
      const response = await fetch(api('/api/shatterpoint/missions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          missionId,
          status
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newCollection = responseData.collection;
        setMissionCollections(prev => [...prev, newCollection]);
        alert(`Mission added to ${status.toLowerCase()}!`);
      } else {
        console.error('Failed to add mission to collection');
        alert('Failed to add mission to collection');
      }
    } catch (error) {
      console.error('Error adding mission to collection:', error);
      alert('Error adding mission to collection');
    }
  };

  const handleUpdateStatus = async (missionId: string, newStatus: 'OWNED' | 'COMPLETED' | 'WISHLIST' | 'LOCKED') => {
    if (!me) return;

    try {
      const response = await fetch(api(`/api/shatterpoint/missions/${missionId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        setMissionCollections(prev => 
          prev.map(c => c.missionId === missionId ? { ...c, status: newStatus } : c)
        );
        alert(`Mission status updated to ${newStatus.toLowerCase()}!`);
      } else {
        console.error('Failed to update mission status');
        alert('Failed to update mission status');
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      alert('Error updating mission status');
    }
  };

  const handleRemoveFromCollection = async (missionId: string) => {
    if (!me) return;

    try {
      const response = await fetch(api(`/api/shatterpoint/missions/${missionId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMissionCollections(prev => prev.filter(c => c.missionId !== missionId));
        alert('Mission removed from collection!');
      } else {
        console.error('Failed to remove mission from collection');
        alert('Failed to remove mission from collection');
      }
    } catch (error) {
      console.error('Error removing mission from collection:', error);
      alert('Error removing mission from collection');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OWNED': return '#16a34a';
      case 'COMPLETED': return '#3b82f6';
      case 'WISHLIST': return '#f59e0b';
      case 'LOCKED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#16a34a';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#dc2626';
      case 'Expert': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Campaign': return '#3b82f6';
      case 'Skirmish': return '#16a34a';
      case 'Tournament': return '#f59e0b';
      case 'Special': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#9ca3af'
      }}>
        Loading missions...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#ef4444'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#f9fafb',
            marginBottom: '16px'
          }}>
            Missions Collection
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Track your completed missions and campaign progress
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="OWNED">Owned</option>
            <option value="COMPLETED">Completed</option>
            <option value="WISHLIST">Wishlist</option>
            <option value="LOCKED">Locked</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="Campaign">Campaign</option>
            <option value="Skirmish">Skirmish</option>
            <option value="Tournament">Tournament</option>
            <option value="Special">Special</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px'
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        {/* Missions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {getFilteredMissions().map((mission) => (
            <div
              key={mission.id}
              style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #374151',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Status Badge */}
              {mission.collection && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  background: getStatusColor(mission.collection.status)
                }}>
                  {mission.collection.status}
                </div>
              )}

              {/* Type Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                background: getTypeColor(mission.type)
              }}>
                {mission.type}
              </div>

              {/* Content */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#f9fafb',
                  marginBottom: '8px'
                }}>
                  {mission.name}
                </h3>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#3b82f6',
                    fontWeight: '600'
                  }}>
                    {mission.code}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: getDifficultyColor(mission.difficulty),
                    fontWeight: '600'
                  }}>
                    {mission.difficulty}
                  </div>
                </div>
                
                {mission.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {mission.description}
                  </p>
                )}

                {mission.objectives && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#d1d5db',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      Objectives:
                    </div>
                    <ul style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: 0,
                      paddingLeft: '16px'
                    }}>
                      {mission.objectives.slice(0, 2).map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                      {mission.objectives.length > 2 && (
                        <li>+{mission.objectives.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                )}

                {mission.rewards && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#d1d5db',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      Rewards:
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#16a34a'
                    }}>
                      {mission.rewards.join(', ')}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {me && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {!mission.collection ? (
                      <>
                        <button
                          onClick={() => handleAddToCollection(mission.id, 'OWNED')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#16a34a',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#15803d';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#16a34a';
                          }}
                        >
                          Add to Collection
                        </button>
                        <button
                          onClick={() => handleAddToCollection(mission.id, 'WISHLIST')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#f59e0b',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#d97706';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f59e0b';
                          }}
                        >
                          ⭐ Wishlist
                        </button>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        flexWrap: 'wrap'
                      }}>
                        {['OWNED', 'COMPLETED', 'WISHLIST', 'LOCKED'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(mission.id, status as any)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              background: mission.collection?.status === status ? getStatusColor(status) : '#374151',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (mission.collection?.status !== status) {
                                e.currentTarget.style.background = '#4b5563';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (mission.collection?.status !== status) {
                                e.currentTarget.style.background = '#374151';
                              }
                            }}
                          >
                            {status}
                          </button>
                        ))}
                        <button
                          onClick={() => handleRemoveFromCollection(mission.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {getFilteredMissions().length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🎯
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#d1d5db',
              marginBottom: '8px'
            }}>
              No missions found
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#9ca3af'
            }}>
              Try adjusting your filters or add some missions to your collection
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionsPage;
