import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/env';

interface Character {
  id: string;
  name: string;
  role?: string;
  faction?: string;
  portrait?: string;
  sp?: number;
  pc?: number;
  force?: number;
  stamina?: number;
  durability?: number;
  era?: string;
}

const HeroVsHeroPage: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHero1, setSelectedHero1] = useState<Character | null>(null);
  const [selectedHero2, setSelectedHero2] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [showVSAnimation, setShowVSAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCharacters();
  }, []);

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

  const handleHeroSelect = (character: Character, heroNumber: 1 | 2) => {
    if (heroNumber === 1) {
      setSelectedHero1(character);
    } else {
      setSelectedHero2(character);
    }
  };

  const handleStartBattle = () => {
    if (selectedHero1 && selectedHero2) {
      // Uruchom animację VS
      setShowVSAnimation(true);
      
      // Po 3 sekundach przejdź do battle page
      setTimeout(() => {
        navigate(`/play/battle?hero1=${selectedHero1.id}&hero2=${selectedHero2.id}`);
      }, 3000);
    }
  };

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         char.faction?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaction = !selectedFaction || char.faction === selectedFaction;
    return matchesSearch && matchesFaction;
  });

  const factions = [...new Set(characters.map(c => c.faction).filter(Boolean))];

  // Komponent animacji VS
  const VSAnimation = () => {
    if (!showVSAnimation || !selectedHero1 || !selectedHero2) return null;

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
        {/* Hero 1 - pojawia się z lewej */}
        <div style={{
          position: 'absolute',
          left: '-200px',
          animation: 'hero1SlideIn 1.5s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <img
            src={selectedHero1.portrait || "https://picsum.photos/seed/placeholder/100/130"}
            alt={selectedHero1.name}
            style={{
              width: '200px',
              height: '260px',
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: '12px',
              background: '#4b5563',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
            }}
          />
          <div style={{
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {selectedHero1.name}
          </div>
        </div>

        {/* Hero 2 - pojawia się z prawej */}
        <div style={{
          position: 'absolute',
          right: '-200px',
          animation: 'hero2SlideIn 1.5s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <img
            src={selectedHero2.portrait || "https://picsum.photos/seed/placeholder/100/130"}
            alt={selectedHero2.name}
            style={{
              width: '200px',
              height: '260px',
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: '12px',
              background: '#4b5563',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
            }}
          />
          <div style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {selectedHero2.name}
          </div>
        </div>

        {/* VS w środku */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0)',
          animation: 'vsAppear 2s ease-out forwards',
          opacity: 0
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

        {/* Efekt iskier */}
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
            @keyframes hero1SlideIn {
              0% { left: -200px; opacity: 0; }
              50% { left: 20%; opacity: 1; }
              100% { left: 20%; opacity: 1; }
            }
            
            @keyframes hero2SlideIn {
              0% { right: -200px; opacity: 0; }
              50% { right: 20%; opacity: 1; }
              100% { right: 20%; opacity: 1; }
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
        Loading characters...
      </div>
    );
  }

  return (
    <>
      {/* Animacja VS */}
      <VSAnimation />
      
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
          <span className="sp sp-melee" style={{ fontSize: '32px', color: '#f97316' }}>o</span> Hero vs Hero
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          Select two characters to battle
        </p>

        {/* Hero Selection */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {/* Hero 1 Selection */}
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            border: selectedHero1 ? '2px solid #3b82f6' : '2px solid #374151',
            minWidth: '320px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f9fafb',
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              {selectedHero1 ? selectedHero1.name : 'Hero 1'}
            </h3>
            {selectedHero1 ? (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <img
                  src={selectedHero1.portrait || "https://picsum.photos/seed/placeholder/100/130"}
                  alt={selectedHero1.name}
                  style={{
                    width: '132px',
                    height: '172px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    borderRadius: '6px',
                    margin: '0 auto 8px auto',
                    display: 'block',
                    background: '#4b5563'
                  }}
                />
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 6px 0' }}>
                  {selectedHero1.role} • {selectedHero1.faction}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  {selectedHero1.sp && <span>SP: {selectedHero1.sp}</span>}
                  {selectedHero1.pc && <span>PC: {selectedHero1.pc}</span>}
                  {selectedHero1.force && <span>Force: {selectedHero1.force}</span>}
                </div>
                <button
                  onClick={() => setSelectedHero1(null)}
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
                Select a hero
              </div>
            )}
          </div>

          {/* Hero 2 Selection */}
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            border: selectedHero2 ? '2px solid #ef4444' : '2px solid #374151',
            minWidth: '320px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f9fafb',
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              {selectedHero2 ? selectedHero2.name : 'Hero 2'}
            </h3>
            {selectedHero2 ? (
              <div style={{
                background: '#374151',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <img
                  src={selectedHero2.portrait || "https://picsum.photos/seed/placeholder/100/130"}
                  alt={selectedHero2.name}
                  style={{
                    width: '132px',
                    height: '172px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    borderRadius: '6px',
                    margin: '0 auto 8px auto',
                    display: 'block',
                    background: '#4b5563'
                  }}
                />
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 6px 0' }}>
                  {selectedHero2.role} • {selectedHero2.faction}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  {selectedHero2.sp && <span>SP: {selectedHero2.sp}</span>}
                  {selectedHero2.pc && <span>PC: {selectedHero2.pc}</span>}
                  {selectedHero2.force && <span>Force: {selectedHero2.force}</span>}
                </div>
                <button
                  onClick={() => setSelectedHero2(null)}
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
                Select a hero
              </div>
            )}
          </div>
        </div>

        {/* Start Battle Button */}
        {selectedHero1 && selectedHero2 && (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={handleStartBattle}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <span className="sp sp-melee" style={{ fontSize: '16px', color: '#ffffff' }}>o</span> Start Battle
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#374151',
              color: '#f9fafb',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '280px'
            }}
          />
          <select
            value={selectedFaction}
            onChange={(e) => setSelectedFaction(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#374151',
              color: '#f9fafb',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">All Factions</option>
            {factions.map(faction => (
              <option key={faction} value={faction}>{faction}</option>
            ))}
          </select>
        </div>

        {/* Available Characters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {filteredCharacters.map((character) => (
            <div
              key={character.id}
              onClick={() => {
                if (!selectedHero1) {
                  handleHeroSelect(character, 1);
                } else if (!selectedHero2) {
                  handleHeroSelect(character, 2);
                }
              }}
              style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '12px',
                border: '2px solid #374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: (selectedHero1 && selectedHero2) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!selectedHero1 || !selectedHero2) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.background = '#1f2937';
              }}
            >
              <img
                src={character.portrait || "https://picsum.photos/seed/placeholder/150/195"}
                alt={character.name}
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: '#374151'
                }}
              />
              <h4 style={{
                color: '#f9fafb',
                margin: '0 0 4px 0',
                fontSize: '14px',
                lineHeight: '1.3'
              }}>
                {character.name}
              </h4>
              <p style={{
                color: '#9ca3af',
                fontSize: '12px',
                margin: '0 0 4px 0'
              }}>
                {character.role} • {character.faction}
              </p>
              <div style={{
                fontSize: '11px',
                color: '#6b7280'
              }}>
                {character.sp && `SP: ${character.sp}`}
                {character.pc && `PC: ${character.pc}`}
                {character.force && `Force: ${character.force}`}
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
    </>
  );
};

export default HeroVsHeroPage;
