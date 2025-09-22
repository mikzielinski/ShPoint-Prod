import React from 'react';
import { Set } from '../data/sets';
import SetImageWithFallback from './SetImageWithFallback';
import CharacterModal from './CharacterModal';

interface SetPreviewProps {
  set: Set;
}

const CharacterPortrait: React.FC<{ characterName: string; size: number }> = ({ characterName, size }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Map character names from sets to their actual IDs in the system
  const getCharacterId = (name: string): string => {
    // Direct mapping for known characters
    const nameToIdMap: { [key: string]: string } = {
      'Count Dooku, Separatist Leader': 'count-dooku-separatist-leader',
      'Jango Fett, Bounty Hunter': 'jango-fett-bounty-hunter',
      'MagnaGuard': 'magnaguard',
      'General Anakin Skywalker': 'general-anakin-skywalker',
      'Captain Rex (CC-7567)': 'cc-7567-captain-rex',
      '501st Clone Troopers': '501st-clone-troopers',
      'Ahsoka Tano, Jedi no more': 'ahsoka-tano-jedi-no-more',
      'Bo-Katan Kryze': 'bo-katan-kryze',
      'Clan Kryze Mandalorians': 'clan-kryze-mandalorians',
      'Asajj Ventress, Sith Assassin': 'asajj-ventress-sith-assassin',
      'Kalani (Super Tactical Droid)': 'kalani-super-tactical-droid',
      'B1 Battle Droids': 'b1-battle-droids',
      'Darth Maul (Lord Maul)': 'lord-maul',
      'Gar Saxon': 'gar-saxon-merciless-commander',
      'Shadow Collective Commandos': 'mandalorian-super-commandos'
    };

    // Check direct mapping first
    if (nameToIdMap[name]) {
      return nameToIdMap[name];
    }

    // Fallback: generate ID from name
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const characterId = getCharacterId(characterName);
  const portraitUrl = `/characters_assets/${characterId}/portrait.png`;

  return (
    <div style={{
      width: `${size}px`,
      height: `${size * 1.2}px`, // Zwiększamy wysokość o 20%
      borderRadius: '6px',
      background: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {!imageError ? (
        <img
          src={portraitUrl}
          alt={characterName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Zmieniamy z 'cover' na 'contain' żeby nie obcinać
            objectPosition: 'center bottom' // Pozycjonujemy od dołu żeby głowy były widoczne
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#6b7280' }}>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )}
    </div>
  );
};


const SetPreview: React.FC<SetPreviewProps> = ({ set }) => {
  const [showCharacterModal, setShowCharacterModal] = React.useState(false);
  const [selectedCharacter, setSelectedCharacter] = React.useState<{
    id: string;
    name: string;
    unit_type: string;
    squad_points: number;
    portrait: string;
  } | null>(null);

  const handleCharacterClick = (characterName: string) => {
    // Map character names to their IDs and basic info
    const getCharacterInfo = (name: string) => {
      const nameToIdMap: { [key: string]: string } = {
        'Count Dooku, Separatist Leader': 'count-dooku-separatist-leader',
        'Jango Fett, Bounty Hunter': 'jango-fett-bounty-hunter',
        'MagnaGuard': 'magnaguard',
        'General Anakin Skywalker': 'general-anakin-skywalker',
        'Captain Rex (CC-7567)': 'cc-7567-captain-rex',
        '501st Clone Troopers': '501st-clone-troopers',
        'Ahsoka Tano, Jedi no more': 'ahsoka-tano-jedi-no-more',
        'Bo-Katan Kryze': 'bo-katan-kryze',
        'Clan Kryze Mandalorians': 'clan-kryze-mandalorians',
        'Asajj Ventress, Sith Assassin': 'asajj-ventress-sith-assassin',
        'Kalani (Super Tactical Droid)': 'kalani-super-tactical-droid',
        'B1 Battle Droids': 'b1-battle-droids',
        'Darth Maul (Lord Maul)': 'lord-maul',
        'Gar Saxon': 'gar-saxon-merciless-commander',
        'Shadow Collective Commandos': 'mandalorian-super-commandos'
      };

      const id = nameToIdMap[name] || name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      // Determine unit type from character name patterns
      let unit_type = 'Primary';
      if (name.includes('Troopers') || name.includes('Droids') || name.includes('Commandos') || name.includes('Mandalorians')) {
        unit_type = 'Support';
      } else if (name.includes('Captain') || name.includes('Commander') || name.includes('Bounty Hunter') || name.includes('Tactical Droid')) {
        unit_type = 'Secondary';
      }

      // Default squad points based on unit type
      let squad_points = 7;
      if (unit_type === 'Secondary') squad_points = 4;
      if (unit_type === 'Support') squad_points = 3;

      return {
        id,
        name,
        unit_type,
        squad_points,
        portrait: `/characters_assets/${id}/portrait.png`
      };
    };

    const characterInfo = getCharacterInfo(characterName);
    setSelectedCharacter(characterInfo);
    setShowCharacterModal(true);
  };

  const handleCloseCharacterModal = () => {
    setShowCharacterModal(false);
    setSelectedCharacter(null);
  };


  return (
    <div style={{
      background: '#1f2937',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #374151',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#f9fafb',
            lineHeight: 1.2
          }}>
            {set.name}
          </h2>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#374151',
              color: '#d1d5db',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {set.code}
            </span>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#1e40af',
              color: '#dbeafe',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {set.type}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column - Image and Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Set Image */}
            <SetImageWithFallback set={set} />

            {/* Product Link */}
            {set.product_url && (
              <a
                href={set.product_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                }}
              >
                <span>View Product Page</span>
                <span>↗</span>
              </a>
            )}
          </div>

          {/* Right Column - Description and Characters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Description */}
            {set.description && (
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f3f4f6'
                }}>
                  Description
                </h3>
                <p style={{
                  margin: 0,
                  color: '#d1d5db',
                  lineHeight: 1.6,
                  fontSize: '14px'
                }}>
                  {set.description}
                </p>
              </div>
            )}

            {/* Characters */}
            {set.characters && set.characters.length > 0 && (
              <div>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f3f4f6'
                }}>
                  Characters ({set.characters.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  {set.characters.map((character, index) => (
                    <div
                      key={index}
                      onClick={() => handleCharacterClick(character.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: '#374151',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        border: '1px solid #4b5563'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4b5563';
                        e.currentTarget.style.borderColor = '#6b7280';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#374151';
                        e.currentTarget.style.borderColor = '#4b5563';
                      }}
                    >
                      {/* Character Image */}
                      <CharacterPortrait 
                        characterName={character.name}
                        size={48}
                      />
                      
                      {/* Character Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: '#f3f4f6',
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          lineHeight: 1.2
                        }}>
                          {character.name}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: character.role === 'Primary' ? '#dc2626' : 
                                       character.role === 'Secondary' ? '#d97706' : '#059669',
                            color: 'white'
                          }}>
                            {character.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Modal */}
      {showCharacterModal && selectedCharacter && (
        <CharacterModal
          open={showCharacterModal}
          onClose={handleCloseCharacterModal}
          id={selectedCharacter.id}
          character={{
            id: selectedCharacter.id,
            name: selectedCharacter.name,
            unit_type: selectedCharacter.unit_type,
            squad_points: selectedCharacter.squad_points,
            portrait: selectedCharacter.portrait
          }}
        />
      )}
    </div>
  );
};

export default SetPreview;
