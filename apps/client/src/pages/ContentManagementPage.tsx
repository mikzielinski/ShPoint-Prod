import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import CharacterEditor from '../components/editors/CharacterEditor';
import Modal from '../components/Modal';

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

type EditorMode = 'characters' | 'stances' | 'missions' | 'mission-sets' | 'sets';

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

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/characters', { credentials: 'include' });
      const data = await response.json();
      setCharacters(data.items || []);
    } catch (error) {
      console.error('Błąd ładowania postaci:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
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
      
      // Call API to save character
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
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
        setCharacters(prev => [...prev, character]);
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
      const response = await fetch(`/api/characters/${characterToDelete}`, {
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
              style={{objectFit: 'contain'}}
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
      case 'stances':
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Stance Editor - Coming Soon</p>
          </div>
        );
      case 'missions':
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Mission Editor - Coming Soon</p>
          </div>
        );
      case 'mission-sets':
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Mission Sets Editor - Coming Soon</p>
          </div>
        );
      case 'sets':
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Sets/Boxes Editor - Coming Soon</p>
          </div>
        );
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
        <h1 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#e5e7eb',
          margin: 0,
          letterSpacing: '0.3px'
        }}>
          Content Management
        </h1>
        
        {/* Tabs aligned with NavBar links */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginLeft: '20px'
        }}>
          {[
            { id: 'characters', label: 'Characters', count: characters.length },
            { id: 'stances', label: 'Stance', count: 0 },
            { id: 'missions', label: 'Missions', count: 0 },
            { id: 'mission-sets', label: 'Mission Sets', count: 0 },
            { id: 'sets', label: 'Sets/Boxes', count: 0 }
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
    </div>
  );
};

export default ContentManagementPage;
