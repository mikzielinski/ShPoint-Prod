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
      // TODO: Implement API call to save character
      console.log('Zapisywanie postaci:', character);
      
      // Tymczasowo dodaj do lokalnej listy
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
      alert('Błąd podczas zapisywania postaci');
    }
  };

  const handleDeleteCharacter = (characterId: string) => {
    try {
      console.log('Usuwanie postaci:', characterId);
      console.log('Setting characterToDelete to:', characterId);
      console.log('Setting showDeleteConfirm to true');
      setCharacterToDelete(characterId);
      setShowDeleteConfirm(true);
      console.log('State updated, showDeleteConfirm should be true now');
    } catch (error) {
      console.error('Error in handleDeleteCharacter:', error);
    }
  };

  const confirmDelete = async () => {
    if (!characterToDelete) return;
    
    try {
      console.log('Starting delete process for character:', characterToDelete);
      console.log('Making DELETE request to:', `/api/characters/${characterToDelete}`);
      
      const response = await fetch(`/api/characters/${characterToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.ok) {
        // Remove from local state
        setCharacters(prev => prev.filter(c => c.id !== characterToDelete));
        setShowEditor(false);
        setEditingCharacter(null);
        alert('Postać została usunięta pomyślnie');
        console.log('Character deleted successfully from local state');
        setShowDeleteConfirm(false);
        setCharacterToDelete(null);
      } else {
        throw new Error(data.error || 'Failed to delete character');
      }
    } catch (error) {
      console.error('Błąd usuwania postaci:', error);
      alert('Błąd podczas usuwania postaci: ' + error.message);
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

  const renderModeSelector = () => (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <h2 className="text-lg font-semibold mb-4">Content Management</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveMode('characters')}
          className={`px-4 py-2 rounded ${
            activeMode === 'characters'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Characters
        </button>
        <button
          onClick={() => setActiveMode('stances')}
          className={`px-4 py-2 rounded ${
            activeMode === 'stances'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Stance
        </button>
        <button
          onClick={() => setActiveMode('missions')}
          className={`px-4 py-2 rounded ${
            activeMode === 'missions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Missions
        </button>
        <button
          onClick={() => setActiveMode('mission-sets')}
          className={`px-4 py-2 rounded ${
            activeMode === 'mission-sets'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Mission Sets
        </button>
        <button
          onClick={() => setActiveMode('sets')}
          className={`px-4 py-2 rounded ${
            activeMode === 'sets'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sets/Boxes
        </button>
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
              style={{objectFit: 'contain'}}
            />
            <div className="title">{character.name}</div>
            <div className="meta">{character.unit_type}</div>
            
            {/* Action buttons stacked vertically */}
            <div className="px-3 pb-2 pt-1">
              <div className="flex flex-col gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCharacter(character);
                  }}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium border border-blue-500"
                  title="Edit character"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for character:', character.id, character.name);
                    handleDeleteCharacter(character.id);
                  }}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium border border-red-500"
                  title="Delete character"
                >
                  Delete
                </button>
              </div>
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

  console.log('ContentManagementPage render - showDeleteConfirm:', showDeleteConfirm, 'characterToDelete:', characterToDelete);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* SIMPLE TEST - should always be visible */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 99999,
        borderRadius: '4px'
      }}>
        TEST - ZAWSZE WIDOCZNY
      </div>
      <div className="max-w-7xl mx-auto p-6">
        {renderModeSelector()}
        
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
      {console.log('Rendering modal, showDeleteConfirm:', showDeleteConfirm, 'characterToDelete:', characterToDelete)}
      
      {/* Simple test - always show modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'red',
        color: 'white',
        padding: '20px',
        zIndex: 99999,
        borderRadius: '8px'
      }}>
        TEST MODAL - ZAWSZE WIDOCZNY
        <br />
        showDeleteConfirm: {showDeleteConfirm.toString()}
        <br />
        characterToDelete: {characterToDelete || 'null'}
      </div>
      
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
              Potwierdzenie usunięcia
            </h3>
            <p style={{ marginBottom: '24px', color: 'black' }}>
              Czy na pewno chcesz usunąć tę postać? Ta operacja jest nieodwracalna.
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
                Anuluj
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
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;
