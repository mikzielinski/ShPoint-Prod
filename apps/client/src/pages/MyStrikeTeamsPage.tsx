import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import CharacterModal from '../components/CharacterModal';

// Types
interface StrikeTeam {
  id: string;
  name: string;
  type: 'MY_TEAMS' | 'DREAM_TEAMS';
  description?: string;
  createdAt: string;
  updatedAt: string;
  characters: StrikeTeamCharacter[];
}

interface StrikeTeamCharacter {
  id: string;
  characterId: string;
  role: 'PRIMARY' | 'SECONDARY' | 'SUPPORT';
  order: number;
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

interface CharacterCollection {
  id: string;
  characterId: string;
  status: 'OWNED' | 'PAINTED' | 'WISHLIST' | 'SOLD' | 'FAVORITE';
}

const api = (path: string) => `http://localhost:3001${path}`;

export default function MyStrikeTeamsPage() {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;

  // State
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [characterCollections, setCharacterCollections] = useState<CharacterCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_TEAMS' | 'DREAM_TEAMS'>('MY_TEAMS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<{characterId: string, role: 'PRIMARY' | 'SECONDARY' | 'SUPPORT'}[]>([]);
  const [editingTeam, setEditingTeam] = useState<StrikeTeam | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [eraFilter, setEraFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [squadNames, setSquadNames] = useState<{squad1: string, squad2: string}>({squad1: 'Squad 1', squad2: 'Squad 2'});
  const [expandedSquads, setExpandedSquads] = useState<{[teamId: string]: {[squadIndex: number]: boolean}}>({});

  // Load data
  useEffect(() => {
    if (user) {
      loadStrikeTeams();
    }
  }, [user]);

  const loadStrikeTeams = async () => {
    try {
      setLoading(true);
      
      // Load all characters
      const charactersResponse = await fetch(api('/api/characters'));
      if (!charactersResponse.ok) throw new Error('Failed to load characters');
      const charactersData = await charactersResponse.json();
      setAllCharacters(charactersData.items || []);

      // Load user's character collections
      const collectionsResponse = await fetch(api('/api/shatterpoint/characters'), {
        credentials: 'include',
      });
      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        setCharacterCollections(collectionsData.collections || []);
      }

      // Load strike teams
      const teamsResponse = await fetch(api('/api/shatterpoint/strike-teams'), {
        credentials: 'include',
      });
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setStrikeTeams(teamsData.strikeTeams || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCharacterById = (id: string): Character | undefined => {
    return allCharacters.find(c => c.id === id);
  };

  const getCharacterCollection = (characterId: string): CharacterCollection | undefined => {
    return characterCollections.find(c => c.characterId === characterId);
  };

  const getFilteredTeams = (): StrikeTeam[] => {
    return strikeTeams.filter(team => team.type === activeTab);
  };

  const getSquadCharacters = (team: StrikeTeam, squadIndex: number): StrikeTeamCharacter[] => {
    const startIndex = squadIndex * 3;
    return team.characters.slice(startIndex, startIndex + 3);
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'PRIMARY': return '#dc2626'; // Red
      case 'SECONDARY': return '#2563eb'; // Blue
      case 'SUPPORT': return '#16a34a'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'PRIMARY': return 'Primary';
      case 'SECONDARY': return 'Secondary';
      case 'SUPPORT': return 'Support';
      default: return role;
    }
  };

  // Create team functions
  const handleCreateTeam = () => {
    setNewTeamName('');
    setNewTeamDescription('');
    setSelectedCharacters([]);
    setEditingTeam(null);
    setSearchFilter('');
    setEraFilter('');
    setRoleFilter('');
    setSquadNames({squad1: 'Squad 1', squad2: 'Squad 2'});
    setShowCreateModal(true);
  };

  const handleEditTeam = (team: StrikeTeam) => {
    setEditingTeam(team);
    setNewTeamName(team.name);
    setNewTeamDescription(team.description || '');
    setSelectedCharacters(team.characters.map(tc => ({
      characterId: tc.characterId,
      role: tc.role
    })));
    setSearchFilter('');
    setEraFilter('');
    setRoleFilter('');
    setSquadNames({squad1: 'Squad 1', squad2: 'Squad 2'});
    setShowCreateModal(true);
  };

  const handleAddCharacter = (characterId: string, role: 'PRIMARY' | 'SECONDARY' | 'SUPPORT') => {
    // Check if character is already selected
    if (selectedCharacters.some(c => c.characterId === characterId)) {
      return;
    }

    // Check if role is already taken in current squad
    const currentSquadIndex = Math.floor(selectedCharacters.length / 3);
    const currentSquad = selectedCharacters.slice(currentSquadIndex * 3, (currentSquadIndex + 1) * 3);
    if (currentSquad.some(c => c.role === role)) {
      alert(`Role ${role} is already taken in Squad ${currentSquadIndex + 1}`);
      return;
    }

    setSelectedCharacters(prev => [...prev, { characterId, role }]);
  };

  const handleRemoveCharacter = (index: number) => {
    setSelectedCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const validateStrikeTeam = (characters: {characterId: string, role: 'PRIMARY' | 'SECONDARY' | 'SUPPORT'}[]): string[] => {
    const errors: string[] = [];
    
    if (characters.length !== 6) {
      errors.push('Strike team must have exactly 6 characters (2 squads of 3 each)');
      return errors;
    }

    // Split into squads
    const squad1 = characters.slice(0, 3);
    const squad2 = characters.slice(3, 6);

    // Validate each squad
    [squad1, squad2].forEach((squad, squadIndex) => {
      const squadNum = squadIndex + 1;
      
      // Check roles: exactly 1 Primary, 1 Secondary, 1 Support
      const roles = squad.map(c => c.role);
      const primaryCount = roles.filter(r => r === 'PRIMARY').length;
      const secondaryCount = roles.filter(r => r === 'SECONDARY').length;
      const supportCount = roles.filter(r => r === 'SUPPORT').length;
      
      if (primaryCount !== 1) {
        errors.push(`Squad ${squadNum} must have exactly 1 Primary character (found ${primaryCount})`);
      }
      if (secondaryCount !== 1) {
        errors.push(`Squad ${squadNum} must have exactly 1 Secondary character (found ${secondaryCount})`);
      }
      if (supportCount !== 1) {
        errors.push(`Squad ${squadNum} must have exactly 1 Support character (found ${supportCount})`);
      }

      // Check for duplicate characters within squad
      const characterIds = squad.map(c => c.characterId);
      const uniqueIds = new Set(characterIds);
      if (uniqueIds.size !== characterIds.length) {
        errors.push(`Squad ${squadNum} cannot have duplicate characters`);
      }

      // Validate squad composition with character data
      squad.forEach((char, index) => {
        const character = getCharacterById(char.characterId);
        if (!character) {
          errors.push(`Character ${char.characterId} not found in database`);
          return;
        }

        // Check if character's actual role matches assigned role
        const actualRole = (character.role || character.unit_type)?.toUpperCase();
        const assignedRole = char.role;
        
        if (actualRole !== assignedRole) {
          errors.push(`Squad ${squadNum}: ${character.name} is a ${actualRole} but assigned as ${assignedRole}`);
        }

        // Check era consistency within squad
        const characterEra = character.era || character.period;
        if (characterEra) {
          // Handle both single era and multiple eras
          const eras = Array.isArray(characterEra) ? characterEra : [characterEra];
          const otherEras = squad
            .filter((_, i) => i !== index)
            .map(c => {
              const otherChar = getCharacterById(c.characterId);
              if (!otherChar) return null;
              const otherEra = otherChar.era || otherChar.period;
              if (!otherEra) return null;
              return Array.isArray(otherEra) ? otherEra : [otherEra];
            })
            .filter(Boolean);
          
          // Check if there's any common era between this character and others in the squad
          if (otherEras.length > 0) {
            const hasCommonEra = eras.some(era => 
              otherEras.some(otherEraArray => otherEraArray.includes(era))
            );
            
            if (!hasCommonEra) {
              const eraStr = eras.join(', ');
              const otherEraStr = otherEras.map(e => e.join(', ')).join('; ');
              errors.push(`Squad ${squadNum}: ${character.name} (${eraStr}) has no common era with other characters (${otherEraStr})`);
            }
          }
        }
      });

      // Check squad points: Secondary + Support <= Primary
      const primaryChar = squad.find(c => c.role === 'PRIMARY');
      const secondaryChar = squad.find(c => c.role === 'SECONDARY');
      const supportChar = squad.find(c => c.role === 'SUPPORT');
      
      if (primaryChar && secondaryChar && supportChar) {
        const primary = getCharacterById(primaryChar.characterId);
        const secondary = getCharacterById(secondaryChar.characterId);
        const support = getCharacterById(supportChar.characterId);
        
        if (primary && secondary && support) {
          const primaryCost = primary.sp || primary.squad_points || 0;
          const secondaryCost = secondary.sp || secondary.squad_points || 0;
          const supportCost = support.sp || support.squad_points || 0;
          const totalSecondarySupport = secondaryCost + supportCost;
          
          if (totalSecondarySupport > primaryCost) {
            errors.push(`Squad ${squadNum}: Secondary (${secondaryCost}pts) + Support (${supportCost}pts) = ${totalSecondarySupport}pts cannot exceed Primary (${primaryCost}pts)`);
          }
        }
      }
    });

    // Check for duplicate characters across entire strike team
    const allCharacterIds = characters.map(c => c.characterId);
    const uniqueTeamIds = new Set(allCharacterIds);
    if (uniqueTeamIds.size !== allCharacterIds.length) {
      errors.push('Strike team cannot have duplicate characters across squads');
    }

    // Check era consistency across entire strike team
    const allEras = characters.map(c => {
      const character = getCharacterById(c.characterId);
      if (!character) return null;
      const era = character.era || character.period;
      if (!era) return null;
      return Array.isArray(era) ? era : [era];
    }).filter(Boolean);
    
    if (allEras.length > 0) {
      // Find common eras across all characters
      const commonEras = allEras.reduce((common, characterEras) => {
        if (common.length === 0) return characterEras;
        return common.filter(era => characterEras.includes(era));
      }, []);
      
      if (commonEras.length === 0) {
        const eraStr = allEras.map(e => e.join(', ')).join('; ');
        errors.push(`All characters in the strike team must share at least one common era. Current eras: ${eraStr}`);
      }
    }

    return errors;
  };

  const handleSaveTeam = async () => {
    if (!newTeamName.trim()) {
      alert('Team name is required');
      return;
    }

    // Validate the team composition
    const validationErrors = validateStrikeTeam(selectedCharacters);
    if (validationErrors.length > 0) {
      alert('❌ Team validation failed:\n\n' + validationErrors.join('\n'));
      return;
    }

    try {
      const url = editingTeam 
        ? api(`/api/shatterpoint/strike-teams/${editingTeam.id}`)
        : api('/api/shatterpoint/strike-teams');
      
      const method = editingTeam ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newTeamName,
          type: activeTab,
          description: newTeamDescription || null,
          characters: selectedCharacters
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      // Refresh teams
      await loadStrikeTeams();
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      setSelectedCharacters([]);
      setEditingTeam(null);
      setSearchFilter('');
      setEraFilter('');
      setRoleFilter('');
      setSquadNames({squad1: 'Squad 1', squad2: 'Squad 2'});
      
      alert(`✅ ${newTeamName} ${editingTeam ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create team'}`);
    }
  };

  const getAvailableCharacters = (): Character[] => {
    if (!allCharacters || !Array.isArray(allCharacters)) {
      return [];
    }
    
    let filteredCharacters: Character[] = [];
    
    if (activeTab === 'MY_TEAMS') {
      // Only show characters that are owned or painted
      filteredCharacters = allCharacters.filter(char => {
        const collection = getCharacterCollection(char.id);
        return collection && (collection.status === 'OWNED' || collection.status === 'PAINTED');
      });
    } else {
      // Show characters that are in wishlist or favorites
      filteredCharacters = allCharacters.filter(char => {
        const collection = getCharacterCollection(char.id);
        return collection && (collection.status === 'WISHLIST' || collection.status === 'FAVORITE');
      });
    }

    // Apply search filter
    if (searchFilter.trim()) {
      filteredCharacters = filteredCharacters.filter(char => 
        char.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply era filter
    if (eraFilter) {
      filteredCharacters = filteredCharacters.filter(char => {
        const era = char.era || char.period;
        if (!era) return false;
        const eras = Array.isArray(era) ? era : [era];
        return eras.includes(eraFilter);
      });
    }

    // Apply role filter
    if (roleFilter) {
      filteredCharacters = filteredCharacters.filter(char => {
        const role = char.role || char.unit_type;
        return role && role.toLowerCase() === roleFilter.toLowerCase();
      });
    }
    
    return filteredCharacters;
  };

  // Get unique eras from all characters
  const getUniqueEras = () => {
    if (!allCharacters || !Array.isArray(allCharacters)) return [];
    const eras = new Set<string>();
    allCharacters.forEach(char => {
      const era = char.era || char.period;
      if (era) {
        if (Array.isArray(era)) {
          era.forEach(e => eras.add(e));
        } else {
          eras.add(era);
        }
      }
    });
    return Array.from(eras).sort();
  };

  // Get unique roles from all characters
  const getUniqueRoles = () => {
    if (!allCharacters || !Array.isArray(allCharacters)) return [];
    const roles = new Set<string>();
    allCharacters.forEach(char => {
      const role = char.role || char.unit_type;
      if (role) {
        roles.add(role);
      }
    });
    return Array.from(roles).sort();
  };

  const toggleSquad = (teamId: string, squadIndex: number) => {
    setExpandedSquads(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [squadIndex]: !prev[teamId]?.[squadIndex]
      }
    }));
  };

  const isSquadExpanded = (teamId: string, squadIndex: number) => {
    return expandedSquads[teamId]?.[squadIndex] || false;
  };

  // Loading state
  if (auth.status === 'loading' || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#f9fafb'
      }}>
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#f9fafb'
      }}>
        Please log in to view your strike teams.
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#ef4444'
      }}>
        Error: {error}
      </div>
    );
  }

  const filteredTeams = getFilteredTeams();

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '12px auto', 
      padding: '0 16px',
      color: '#f9fafb'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#f9fafb'
        }}>
          My Strike Teams
        </h1>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '16px',
          marginBottom: '24px'
        }}>
          Build and manage your Star Wars: Shatterpoint strike teams. Each team consists of 2 squads with 3 characters each.
        </p>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('MY_TEAMS')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'MY_TEAMS' ? '#2563eb' : '#374151',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'MY_TEAMS') {
                e.currentTarget.style.background = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'MY_TEAMS') {
                e.currentTarget.style.background = '#374151';
              }
            }}
          >
            My Teams ({strikeTeams.filter(t => t.type === 'MY_TEAMS').length})
          </button>
          <button
            onClick={() => setActiveTab('DREAM_TEAMS')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'DREAM_TEAMS' ? '#2563eb' : '#374151',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'DREAM_TEAMS') {
                e.currentTarget.style.background = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'DREAM_TEAMS') {
                e.currentTarget.style.background = '#374151';
              }
            }}
          >
            Dream Teams ({strikeTeams.filter(t => t.type === 'DREAM_TEAMS').length})
          </button>
        </div>

        {/* Create New Team Button */}
        <button
          onClick={handleCreateTeam}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#16a34a',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            marginBottom: '24px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#16a34a';
          }}
        >
          + Create New {activeTab === 'MY_TEAMS' ? 'Team' : 'Dream Team'}
        </button>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#9ca3af',
          fontSize: '18px'
        }}>
          No {activeTab === 'MY_TEAMS' ? 'teams' : 'dream teams'} yet. Create your first one!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #374151',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Team Header */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  color: '#f9fafb'
                }}>
                  {team.name}
                </h3>
                {team.description && (
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    {team.description}
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: team.type === 'MY_TEAMS' ? '#16a34a' : '#f59e0b',
                    color: 'white'
                  }}>
                    {team.type === 'MY_TEAMS' ? 'My Team' : 'Dream Team'}
                  </span>
                </div>
                
                {/* Team Statistics */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <div>
                    <strong style={{ color: '#d1d5db' }}>Units:</strong> {team.characters.length}
                  </div>
                  <div>
                    <strong style={{ color: '#d1d5db' }}>Force:</strong> {team.characters.reduce((total, teamChar) => {
                      const character = getCharacterById(teamChar.characterId);
                      return total + (character?.force || 0);
                    }, 0)}
                  </div>
                  <div>
                    <strong style={{ color: '#d1d5db' }}>Points:</strong> {(() => {
                      const squad1 = team.characters.slice(0, 3);
                      const squad2 = team.characters.slice(3, 6);
                      
                      const calculateSquadPoints = (squad: any[]) => {
                        const primary = squad.find(c => c.role === 'PRIMARY');
                        const secondary = squad.find(c => c.role === 'SECONDARY');
                        const support = squad.find(c => c.role === 'SUPPORT');
                        
                        if (!primary) return 0;
                        
                        const primaryChar = getCharacterById(primary.characterId);
                        const secondaryChar = getCharacterById(secondary?.characterId);
                        const supportChar = getCharacterById(support?.characterId);
                        
                        const primarySP = primaryChar?.sp || 0;
                        const secondaryPC = secondaryChar?.pc || 0;
                        const supportPC = supportChar?.pc || 0;
                        
                        return primarySP - secondaryPC - supportPC;
                      };
                      
                      return calculateSquadPoints(squad1) + calculateSquadPoints(squad2);
                    })()}
                  </div>
                </div>
                
                {/* Popular Tags */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                  flexWrap: 'wrap'
                }}>
                  {(() => {
                    const allTags = team.characters.flatMap(teamChar => {
                      const character = getCharacterById(teamChar.characterId);
                      return character?.tags || [];
                    });
                    const tagCounts = allTags.reduce((acc, tag) => {
                      acc[tag] = (acc[tag] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const sortedTags = Object.entries(tagCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5);
                    
                    return sortedTags.map(([tag, count]) => (
                      <span key={tag} style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: count > 1 ? '#16a34a' : '#374151',
                        color: 'white'
                      }}>
                        {tag} {count > 1 && `(${count})`}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Squads */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[0, 1].map((squadIndex) => (
                  <div key={`squad-${squadIndex}`} style={{ width: '100%' }}>
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => toggleSquad(team.id, squadIndex)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#d1d5db',
                        margin: 0
                      }}>
                        Squad {squadIndex + 1} {isSquadExpanded(team.id, squadIndex) ? '▼' : '▶'}
                      </h4>
                      <span style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                      ({(() => {
                        const squadChars = getSquadCharacters(team, squadIndex);
                        const primary = squadChars.find(c => c.role === 'PRIMARY');
                        const secondary = squadChars.find(c => c.role === 'SECONDARY');
                        const support = squadChars.find(c => c.role === 'SUPPORT');
                        
                        if (!primary) return 0;
                        
                        const primaryChar = getCharacterById(primary.characterId);
                        const secondaryChar = getCharacterById(secondary?.characterId);
                        const supportChar = getCharacterById(support?.characterId);
                        
                        const primarySP = primaryChar?.sp || 0;
                        const secondaryPC = secondaryChar?.pc || 0;
                        const supportPC = supportChar?.pc || 0;
                        
                        return primarySP - secondaryPC - supportPC;
                      })()} pts)
                      </span>
                    </div>
                    {isSquadExpanded(team.id, squadIndex) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {getSquadCharacters(team, squadIndex).map((teamChar) => {
                      const character = getCharacterById(teamChar.characterId);
                      if (!character) return null;
                      
                      const collection = getCharacterCollection(teamChar.characterId);
                      
                      return (
                        <div
                          key={teamChar.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            background: '#111827',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onClick={() => setSelectedCharacter(character)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1f2937';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#111827';
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundImage: character.portrait ? `url(/characters/${character.id}/portrait.png)` : undefined,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center'
                          }}>
                            {!character.portrait && character.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#f9fafb',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {character.name}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#9ca3af'
                            }}>
                              {character.faction && character.faction !== 'Unknown' ? character.faction : 
                               (character.tags && character.tags.length > 0 ? character.tags[0] : 
                                (character.role || character.unit_type || 'Unit'))}
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: getRoleColor(teamChar.role),
                            color: 'white'
                          }}>
                            {getRoleLabel(teamChar.role)}
                          </span>
                          {collection && (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: collection.status === 'OWNED' ? '#16a34a' :
                                        collection.status === 'PAINTED' ? '#2563eb' :
                                        collection.status === 'WISHLIST' ? '#ea580c' :
                                        collection.status === 'FAVORITE' ? '#f59e0b' :
                                        '#6b7280',
                              color: 'white'
                            }}>
                              {collection.status}
                            </span>
                          )}
                        </div>
                      );
                      })}
                    </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Team Actions */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #374151'
              }}>
                <button
                  onClick={() => handleEditTeam(team)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#374151',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#374151';
                  }}
                >
                  Edit
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '12px',
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
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #374151'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#f9fafb'
            }}>
              {editingTeam ? 'Edit Team' : `Create New ${activeTab === 'MY_TEAMS' ? 'Team' : 'Dream Team'}`}
            </h2>

            {/* Team Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Team Name *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Team Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Description (optional)
              </label>
              <textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Enter team description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Squad Names */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#f9fafb',
                marginBottom: '12px'
              }}>
                Squad Names
              </h3>
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#d1d5db',
                    marginBottom: '4px'
                  }}>
                    Squad 1 Name
                  </label>
                  <input
                    type="text"
                    value={squadNames.squad1}
                    onChange={(e) => setSquadNames(prev => ({...prev, squad1: e.target.value}))}
                    placeholder="Squad 1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      background: '#111827',
                      color: '#f9fafb',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#d1d5db',
                    marginBottom: '4px'
                  }}>
                    Squad 2 Name
                  </label>
                  <input
                    type="text"
                    value={squadNames.squad2}
                    onChange={(e) => setSquadNames(prev => ({...prev, squad2: e.target.value}))}
                    placeholder="Squad 2"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      background: '#111827',
                      color: '#f9fafb',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Selected Characters */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#f9fafb',
                marginBottom: '12px'
              }}>
                Selected Characters ({selectedCharacters.length}/6)
              </h3>
              
              {selectedCharacters.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  background: '#111827',
                  borderRadius: '6px',
                  border: '1px solid #374151'
                }}>
                  No characters selected yet
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {selectedCharacters.map((char, index) => {
                    const character = getCharacterById(char.characterId);
                    if (!character) return null;
                    
                    const squadIndex = Math.floor(index / 3) + 1;
                    const positionInSquad = (index % 3) + 1;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: '#111827',
                          borderRadius: '6px',
                          border: '1px solid #374151'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          background: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundImage: character.portrait ? `url(/characters/${character.id}/portrait.png)` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'top',
                          backgroundRepeat: 'no-repeat'
                        }}>
                          {!character.portrait && character.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#f9fafb',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {character.name}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#9ca3af'
                          }}>
                            {squadIndex === 0 ? squadNames.squad1 : squadNames.squad2} - {getRoleLabel(char.role)} • {character.sp || character.squad_points}pts
                          </div>
                          {(character.era || character.period) && (
                            <div style={{
                              fontSize: '9px',
                              color: '#6b7280'
                            }}>
                              {character.era || (Array.isArray(character.period) ? character.period[0] : character.period)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCharacter(index)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Characters */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#f9fafb',
                marginBottom: '12px'
              }}>
                Available Characters ({getAvailableCharacters().length})
              </h3>

              {/* Filters */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                {/* Search Filter */}
                <input
                  type="text"
                  placeholder="Search characters..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f9fafb',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                />

                {/* Era Filter */}
                <select
                  value={eraFilter}
                  onChange={(e) => setEraFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f9fafb',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="">All Eras</option>
                  {getUniqueEras().map(era => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f9fafb',
                    fontSize: '14px',
                    minWidth: '120px'
                  }}
                >
                  <option value="">All Roles</option>
                  {getUniqueRoles().map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(searchFilter || eraFilter || roleFilter) && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setEraFilter('');
                      setRoleFilter('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                maxHeight: '300px',
                overflow: 'auto',
                padding: '8px',
                background: '#111827',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}>
                {getAvailableCharacters().map((character) => {
                  const isSelected = selectedCharacters.some(c => c.characterId === character.id);
                  const collection = getCharacterCollection(character.id);
                  
                  return (
                    <div
                      key={character.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '12px',
                        background: isSelected ? '#374151' : '#1f2937',
                        borderRadius: '6px',
                        border: '1px solid #374151',
                        cursor: isSelected ? 'not-allowed' : 'pointer',
                        opacity: isSelected ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#374151';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }
                      }}
                      onClick={() => {
                        if (!isSelected) {
                          // Automatically assign role based on character's role (from API) or unit_type (from local data)
                          const characterRole = (character.role || character.unit_type)?.toUpperCase();
                          if (characterRole === 'PRIMARY' || characterRole === 'SECONDARY' || characterRole === 'SUPPORT') {
                            handleAddCharacter(character.id, characterRole as 'PRIMARY' | 'SECONDARY' | 'SUPPORT');
                          } else {
                            alert(`Character ${character.name} has invalid role: ${character.role || character.unit_type}`);
                          }
                        }
                      }}
                    >
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '4px',
                        background: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundImage: character.portrait ? `url(/characters/${character.id}/portrait.png)` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'top',
                        backgroundRepeat: 'no-repeat',
                        marginBottom: '4px'
                      }}>
                        {!character.portrait && character.name.charAt(0)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#f9fafb',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        marginBottom: '4px'
                      }}>
                        {character.name}
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        marginBottom: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: (character.role || character.unit_type) === 'Primary' ? '#dc2626' :
                                          (character.role || character.unit_type) === 'Secondary' ? '#2563eb' :
                                          (character.role || character.unit_type) === 'Support' ? '#16a34a' : '#6b7280',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '8px'
                        }}>
                          {character.role || character.unit_type}
                        </span>
                        <span style={{ fontSize: '8px' }}>
                          {character.sp || character.squad_points}pts
                        </span>
                      </div>
                      {(character.era || character.period) && (
                        <div style={{
                          fontSize: '7px',
                          color: '#6b7280',
                          textAlign: 'center',
                          marginBottom: '2px'
                        }}>
                          {character.era || (Array.isArray(character.period) ? character.period[0] : character.period)}
                        </div>
                      )}
                      {collection && (
                        <div style={{
                          fontSize: '8px',
                          color: collection.status === 'OWNED' ? '#16a34a' :
                                collection.status === 'PAINTED' ? '#2563eb' :
                                collection.status === 'WISHLIST' ? '#ea580c' :
                                collection.status === 'FAVORITE' ? '#f59e0b' :
                                '#6b7280',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {collection.status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  background: '#374151',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#374151';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={selectedCharacters.length !== 6 || !newTeamName.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedCharacters.length === 6 && newTeamName.trim() ? '#16a34a' : '#6b7280',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedCharacters.length === 6 && newTeamName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedCharacters.length === 6 && newTeamName.trim()) {
                    e.currentTarget.style.background = '#15803d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCharacters.length === 6 && newTeamName.trim()) {
                    e.currentTarget.style.background = '#16a34a';
                  }
                }}
              >
                {editingTeam ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Modal */}
      {selectedCharacter && (
        <CharacterModal
          open={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          id={selectedCharacter.id}
          character={{
            id: selectedCharacter.id,
            name: selectedCharacter.name,
            unit_type: (selectedCharacter.role || selectedCharacter.unit_type) as "Primary" | "Secondary" | "Support",
            squad_points: selectedCharacter.sp || selectedCharacter.squad_points || 0,
            portrait: selectedCharacter.portrait
          }}
        />
      )}
    </div>
  );
}
