import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import CharacterEditor from '../components/editors/CharacterEditor';
import SetEditor from '../components/editors/SetEditor';
import Modal from '../components/Modal';
import CharacterModal from '../components/CharacterModal';
import SetPreview from '../components/SetPreview';
import SetImageWithFallback from '../components/SetImageWithFallback';
import { Set, setsData } from '../data/sets';
import { missionsData } from '../data/missions';
import { api } from '../lib/env';
import MissionCardsEditor from '../components/editors/MissionCardsEditor';
import MissionCardsPreview from '../components/MissionCardsPreview';
import ShPointLogo from '../components/ShPointLogo';

interface Character {
  id: string;
  name: string;
  portrait?: string;
  squad_points: number;
  force: number;
  unit_type: 'Primary' | 'Secondary' | 'Support';
  stamina: number;
  durability: number;
  factions: string[];
  period: string[];
  abilities: any[];
  structuredAbilities: any[];
}

type EditorMode = 'characters' | 'mission-cards' | 'sets' | 'factions';

const ContentManagementPage: React.FC = () => {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const [activeMode, setActiveMode] = useState<EditorMode>('characters');
  const [showEditor, setShowEditor] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sets, setSets] = useState<Set[]>([]);
  const [showSetEditor, setShowSetEditor] = useState(false);
  const [editingSet, setEditingSet] = useState<Set | null>(null);
  const [showSetPreview, setShowSetPreview] = useState(false);
  const [previewSet, setPreviewSet] = useState<Set | null>(null);
  const [showMissionCardsEditor, setShowMissionCardsEditor] = useState(false);
  const [showMissionCardsPreview, setShowMissionCardsPreview] = useState(false);
  const [previewMissionCard, setPreviewMissionCard] = useState<any>(null);
  const [editingMissionCard, setEditingMissionCard] = useState<any>(null);
  const [missionCards, setMissionCards] = useState<any[]>([]);
  const [factions, setFactions] = useState<string[]>([]);
  const [newFaction, setNewFaction] = useState('');

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/characters'), { credentials: 'include' });
      const data = await response.json();
      setCharacters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Błąd ładowania postaci:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSets = async () => {
    try {
      // Use real sets data from setsData
      setSets(setsData);
    } catch (error) {
      console.error('Błąd ładowania zestawów:', error);
    }
  };


  const loadMissionCards = () => {
    setMissionCards(missionsData);
  };

  const loadFactions = async () => {
    try {
      const response = await fetch(api('/api/factions'), { credentials: 'include' });
      const data = await response.json();
      setFactions(data.factions || []);
    } catch (error) {
      console.error('Błąd ładowania factionów:', error);
    }
  };

  useEffect(() => {
    loadCharacters();
    loadSets();
    loadMissionCards();
    loadFactions();
  }, []);

  // Kontrola dostępu
  if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Brak dostępu</h1>
          <p className="text-gray-400">Nie masz uprawnień do zarządzania treścią</p>
        </div>
      </div>
    );
  }

  const handleSaveCharacter = async (character: Character) => {
    try {
      console.log('Zapisywanie postaci:', character);
      
      // Determine if this is a new character or editing existing one
      const isNewCharacter = !editingCharacter;
      const method = isNewCharacter ? 'POST' : 'PUT';
      const url = isNewCharacter ? api('/api/characters') : api(`/api/characters/${character.id}`);
      
      console.log('API call:', { method, url, isNewCharacter });
      
      // Call API to save character
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(character)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save character');
      }
      
      const result = await response.json();
      console.log('Character saved successfully:', result);
      
      // Update local list
      if (editingCharacter) {
        setCharacters(prev => 
          prev.map(c => c.id === character.id ? character : c)
        );
      } else {
        // For new characters, use the character data from the response
        const newCharacter = result.character || character;
        setCharacters(prev => [...prev, newCharacter]);
      }
      
      setShowEditor(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Błąd zapisywania postaci:', error);
      alert('Błąd podczas zapisywania postaci: ' + error.message);
    }
  };

  const handleDeleteCharacter = (characterId: string) => {
    setCharacterToDelete(characterId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!characterToDelete) return;
    
    try {
      const response = await fetch(api(`/api/characters/${characterToDelete}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setCharacters(prev => prev.filter(c => c.id !== characterToDelete));
        setShowEditor(false);
        setEditingCharacter(null);
        alert('Character has been successfully deleted');
        setShowDeleteConfirm(false);
        setCharacterToDelete(null);
      } else {
        throw new Error(data.error || 'Failed to delete character');
      }
    } catch (error) {
      console.error('Błąd usuwania postaci:', error);
      alert('Error deleting character: ' + error.message);
    } finally {
      setShowDeleteConfirm(false);
      setCharacterToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCharacterToDelete(null);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowEditor(true);
  };

  const handleNewCharacter = () => {
    setEditingCharacter(null);
    setShowEditor(true);
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingCharacter(null);
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterModal(true);
  };

  const handleCloseCharacterModal = () => {
    setShowCharacterModal(false);
    setSelectedCharacter(null);
  };

  const handleSaveSet = async (set: Set) => {
    try {
      console.log('Zapisywanie zestawu:', set);
      
      // For now, just update local state. Later this can be connected to an API
      if (editingSet) {
        setSets(prev => prev.map(s => s.id === set.id ? set : s));
      } else {
        setSets(prev => [...prev, set]);
      }
      
      setShowSetEditor(false);
      setEditingSet(null);
    } catch (error) {
      console.error('Błąd zapisywania zestawu:', error);
      alert('Błąd podczas zapisywania zestawu: ' + error.message);
    }
  };

  const handleEditSet = (set: Set) => {
    setEditingSet(set);
    setShowSetEditor(true);
  };

  const handleNewSet = () => {
    setEditingSet(null);
    setShowSetEditor(true);
  };

  const handleCancelSetEditor = () => {
    setShowSetEditor(false);
    setEditingSet(null);
  };

  const handlePreviewSet = (set: Set) => {
    setPreviewSet(set);
    setShowSetPreview(true);
  };

  const handleCloseSetPreview = () => {
    setShowSetPreview(false);
    setPreviewSet(null);
  };


  // Mission Cards handlers
  const handleNewMissionCard = () => {
    setEditingMissionCard(null);
    setShowMissionCardsEditor(true);
  };

  const handleEditMissionCard = (missionCard: any) => {
    setEditingMissionCard(missionCard);
    setShowMissionCardsEditor(true);
  };

  const handleSaveMissionCard = (missionCard: any) => {
    console.log('Saving mission card:', missionCard);
    setShowMissionCardsEditor(false);
    setEditingMissionCard(null);
  };

  const handleCancelMissionCardsEditor = () => {
    setShowMissionCardsEditor(false);
    setEditingMissionCard(null);
  };

  const handlePreviewMissionCard = (missionCard: any) => {
    setPreviewMissionCard(missionCard);
    setShowMissionCardsPreview(true);
  };

  const handleCloseMissionCardsPreview = () => {
    setShowMissionCardsPreview(false);
    setPreviewMissionCard(null);
  };

  // Faction management handlers
  const handleAddFaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaction.trim()) return;

    try {
      const response = await fetch(api('/api/factions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ faction: newFaction.trim() })
      });

      if (response.ok) {
        setNewFaction('');
        loadFactions(); // Reload factions
      } else {
        const error = await response.json();
        alert(`Błąd: ${error.error}`);
      }
    } catch (error) {
      console.error('Błąd dodawania faction:', error);
      alert('Błąd dodawania faction');
    }
  };

  const handleDeleteFaction = async (faction: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć faction "${faction}"?`)) return;

    try {
      const response = await fetch(api(`/api/factions/${encodeURIComponent(faction)}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadFactions(); // Reload factions
      } else {
        const error = await response.json();
        alert(`Błąd: ${error.error}`);
      }
    } catch (error) {
      console.error('Błąd usuwania faction:', error);
      alert('Błąd usuwania faction');
    }
  };


  const renderSetsList = () => (
    <div>
      <div style={{maxWidth: 1100, margin: "18px auto 0", padding: "0 16px"}}>
        <div className="flex justify-between items-center mb-4">
          <h1>Sets/Boxes ({sets.length})</h1>
          <button
            onClick={handleNewSet}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Add New Set
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>Loading sets...</p>
      ) : null}
      {!loading && sets.length === 0 ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>No sets found.</p>
      ) : null}

      <div className="grid">
        {sets.map((set) => (
          <div key={set.id} className="card relative group" role="article">
            <SetImageWithFallback set={set} size={200} />
            <div className="title">{set.name}</div>
            <div className="meta">{set.code} • {set.type}</div>
            {set.description && (
              <div style={{fontSize: '12px', color: '#9ca3af', marginTop: '4px', padding: '0 12px'}}>
                {set.description.length > 100 ? set.description.substring(0, 100) + '...' : set.description}
              </div>
            )}
            
            {/* Action buttons */}
            <div style={{
              marginTop: "12px",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              padding: "0 12px 12px 12px"
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSet(set);
                }}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flex: "1",
                  minWidth: "60px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                }}
                title="Edit set"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewSet(set);
                }}
                style={{
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flex: "1",
                  minWidth: "60px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#7c3aed";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#8b5cf6";
                }}
                title="Preview set"
              >
                Preview
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (set.product_url) {
                    window.open(set.product_url, '_blank');
                  }
                }}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flex: "1",
                  minWidth: "60px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#059669";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#10b981";
                }}
                title="View product page"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMissionCardsList = () => (
    <div>
      <div style={{maxWidth: 1100, margin: "18px auto 0", padding: "0 16px"}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 style={{fontSize: '24px', fontWeight: '600', color: '#e0e7ff'}}>Mission Cards</h2>
          <button
            onClick={handleNewMissionCard}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Mission Card
          </button>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
          {missionCards.map((missionCard) => (
            <div key={missionCard.id} style={{
              background: '#374151',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #4b5563'
            }}>
              <div style={{display: 'flex', gap: '16px', alignItems: 'start'}}>
                <div style={{
                  aspectRatio: '3/4',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 120,
                  height: 'auto'
                }}>
                  {missionCard.thumbnail ? (
                    <img
                      src={missionCard.thumbnail}
                      alt={missionCard.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: '#6b7280',
                      textAlign: 'center',
                      padding: '10px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{marginBottom: '4px'}}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <div style={{fontSize: '10px', fontWeight: '500'}}>
                        {missionCard.id}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  <h3 style={{fontSize: '16px', fontWeight: '600', color: '#f3f4f6', margin: 0}}>
                    {missionCard.name}
                  </h3>
                  <p style={{fontSize: '11px', color: '#9ca3af', margin: 0}}>
                    {missionCard.id} • {missionCard.source}
                  </p>
                  {missionCard.description && (
                    <p style={{fontSize: '10px', color: '#d1d5db', margin: 0, lineHeight: '1.4'}}>
                      {missionCard.description.length > 80 
                        ? `${missionCard.description.substring(0, 80)}...` 
                        : missionCard.description}
                    </p>
                  )}
                  {missionCard.objectives && (
                    <p style={{fontSize: '10px', color: '#9ca3af', margin: 0}}>
                      Objectives: {missionCard.objectives.length} • Struggles: {missionCard.struggles?.length || 0}
                    </p>
                  )}
                  {missionCard.tags && (
                    <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px'}}>
                      {missionCard.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span key={index} style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#4b5563',
                          color: '#e0e7ff',
                          fontSize: '9px'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{display: 'flex', gap: '6px', marginTop: '12px'}}>
                <button
                  onClick={() => handleEditMissionCard(missionCard)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#6b7280',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handlePreviewMissionCard(missionCard)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#10b981',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  const renderCharactersList = () => (
    <div>
      <div style={{maxWidth: 1100, margin: "18px auto 0", padding: "0 16px"}}>
        <div className="flex justify-between items-center mb-4">
          <h1>Characters ({characters.length})</h1>
          <button
            onClick={handleNewCharacter}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Add New Character
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>Loading characters...</p>
      ) : null}
      {!loading && characters.length === 0 ? (
        <p style={{maxWidth: 1100, margin: "0 auto", padding: "0 16px"}}>No characters found.</p>
      ) : null}

      <div className="grid">
        {characters.map((character) => (
          <div key={character.id} className="card relative group" role="article">
            <img 
              src={character.portrait ?? "https://picsum.photos/seed/placeholder/400/520"} 
              alt={character.name} 
              style={{objectFit: 'contain', cursor: 'pointer'}}
              onClick={() => handleCharacterClick(character)}
              title="Click to view character details"
            />
            <div className="title">{character.name}</div>
            <div className="meta">{character.unit_type}</div>
            
            {/* Action buttons */}
            <div style={{
              marginTop: "12px",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              padding: "0 12px 12px 12px"
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCharacter(character);
                }}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flex: "1",
                  minWidth: "80px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                }}
                title="Edit character"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCharacter(character.id);
                }}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flex: "1",
                  minWidth: "80px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                }}
                title="Delete character"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMode) {
      case 'characters':
        return renderCharactersList();
      case 'mission-cards':
        return renderMissionCardsList();
      case 'sets':
        return renderSetsList();
      case 'factions':
        return null; // Factions content is rendered separately
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with navigation tabs aligned to NavBar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '10px 16px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShPointLogo size={32} showText={false} />
          <h1 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#e5e7eb',
            margin: 0,
            letterSpacing: '0.3px'
          }}>
            Content Management
          </h1>
        </div>
        
        {/* Tabs aligned with NavBar links */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginLeft: '20px'
        }}>
          {[
            { id: 'characters', label: 'Characters', count: characters.length },
            { id: 'mission-cards', label: 'Mission Cards', count: missionCards.length },
            { id: 'sets', label: 'Sets/Boxes', count: sets.length },
            { id: 'factions', label: 'Factions', count: factions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as EditorMode)}
              style={{
                color: activeMode === tab.id ? '#fff' : '#cbd5e1',
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: activeMode === tab.id ? 'rgba(99,102,241,0.22)' : 'transparent',
                boxShadow: activeMode === tab.id ? 'inset 0 0 0 1px rgba(99,102,241,0.35)' : 'none',
                textDecoration: 'none',
                transition: 'background .15s ease',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                if (activeMode !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMode !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {showEditor ? (
          <CharacterEditor
            character={editingCharacter}
            onSave={handleSaveCharacter}
            onCancel={handleCancelEditor}
            onDelete={handleDeleteCharacter}
          />
        ) : (
          renderContent()
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>
              Confirm Deletion
            </h3>
            <p style={{ marginBottom: '24px', color: 'black' }}>
              Are you sure you want to delete this character? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  background: '#d1d5db',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Set Editor Modal */}
      {showSetEditor && (
        <Modal
          open={showSetEditor}
          onClose={handleCancelSetEditor}
          maxWidth={800}
        >
          <SetEditor
            set={editingSet}
            onSave={handleSaveSet}
            onCancel={handleCancelSetEditor}
            onPreview={handlePreviewSet}
          />
        </Modal>
      )}

      {/* Set Preview Modal */}
      {showSetPreview && previewSet && (
        <Modal
          open={showSetPreview}
          onClose={handleCloseSetPreview}
          maxWidth={1000}
        >
          <SetPreview set={previewSet} />
        </Modal>
      )}


      {/* Mission Cards Editor Modal */}
      {showMissionCardsEditor && (
        <Modal
          open={showMissionCardsEditor}
          onClose={handleCancelMissionCardsEditor}
          maxWidth={1200}
        >
          <MissionCardsEditor
            mission={editingMissionCard}
            onSave={handleSaveMissionCard}
            onCancel={handleCancelMissionCardsEditor}
            onPreview={handlePreviewMissionCard}
          />
        </Modal>
      )}

      {/* Mission Cards Preview Modal */}
      {showMissionCardsPreview && previewMissionCard && (
        <Modal
          open={showMissionCardsPreview}
          onClose={handleCloseMissionCardsPreview}
          maxWidth={1000}
        >
          <MissionCardsPreview mission={previewMissionCard} />
        </Modal>
      )}

      {/* Factions Management */}
      {activeMode === 'factions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Zarządzanie Factionami</h2>
          </div>

          {/* Add New Faction */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Dodaj nowy faction</h3>
            <form onSubmit={handleAddFaction} className="flex gap-4">
              <input
                type="text"
                value={newFaction}
                onChange={(e) => setNewFaction(e.target.value)}
                placeholder="Nazwa faction"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dodaj
              </button>
            </form>
          </div>

          {/* Factions List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Dostępne factiony</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {factions.map((faction) => (
                <div
                  key={faction}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <span className="text-white font-medium">{faction}</span>
                  {me?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteFaction(faction)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Usuń
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;
