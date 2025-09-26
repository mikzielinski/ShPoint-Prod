import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CharacterEditor } from './editors/CharacterEditor';
import { api } from '../lib/env';

interface CustomMadeCard {
  id: string;
  name: string;
  description?: string;
  faction: string;
  unitType: 'Primary' | 'Secondary' | 'Support';
  squadPoints: number;
  stamina: number;
  durability: number;
  force?: number;
  hanker?: number;
  abilities?: any[];
  stances?: any[];
  portrait?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SHARED';
  isPublic: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomCardGeneratorProps {
  onClose: () => void;
  onSave?: (card: CustomMadeCard) => void;
}

export default function CustomCardGenerator({ onClose, onSave }: CustomCardGeneratorProps) {
  console.log('CustomCardGenerator component rendering...');
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const [showEditor, setShowEditor] = useState(false);
  const [customCards, setCustomCards] = useState<CustomMadeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomMadeCard | null>(null);

  // Load user's custom cards
  useEffect(() => {
    if (me) {
      loadCustomCards();
    }
  }, [me]);

  const loadCustomCards = async () => {
    if (!me) return;
    
    setLoading(true);
    try {
      const response = await fetch(api('/api/custom-cards'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const cards = await response.json();
        setCustomCards(cards);
      }
    } catch (error) {
      console.error('Error loading custom cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingCard(null);
    setShowEditor(true);
  };

  const handleEditCard = (card: CustomMadeCard) => {
    setEditingCard(card);
    setShowEditor(true);
  };

  const handleSaveCard = async (characterData: any) => {
    if (!me) return;

    try {
      const customCard: CustomMadeCard = {
        id: characterData.id || `custom-${Date.now()}`,
        name: characterData.name,
        description: characterData.characterNames || '',
        faction: characterData.factions?.[0] || 'Custom',
        unitType: characterData.unit_type,
        squadPoints: characterData.squad_points || characterData.point_cost || 0,
        stamina: characterData.stamina || 0,
        durability: characterData.durability || 0,
        force: characterData.force || 0,
        hanker: 0, // Default value
        abilities: characterData.structuredAbilities || [],
        stances: [], // Will be handled separately
        portrait: characterData.portrait || '',
        status: 'DRAFT',
        isPublic: false,
        authorId: me.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(api('/api/custom-cards'), {
        method: editingCard ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(customCard)
      });

      if (response.ok) {
        const savedCard = await response.json();
        setCustomCards(prev => {
          if (editingCard) {
            return prev.map(card => card.id === editingCard.id ? savedCard : card);
          } else {
            return [...prev, savedCard];
          }
        });
        setShowEditor(false);
        setEditingCard(null);
        if (onSave) {
          onSave(savedCard);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to save custom card: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving custom card:', error);
      alert(`Failed to save custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom card?')) {
      return;
    }

    try {
      const response = await fetch(api(`/api/custom-cards/${cardId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setCustomCards(prev => prev.filter(card => card.id !== cardId));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete custom card: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting custom card:', error);
      alert(`Failed to delete custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePublishCard = async (card: CustomMadeCard) => {
    try {
      const response = await fetch(api(`/api/custom-cards/${card.id}/publish`), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const updatedCard = await response.json();
        setCustomCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
      } else {
        const errorData = await response.json();
        alert(`Failed to publish custom card: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing custom card:', error);
      alert(`Failed to publish custom card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!me) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Please log in to create custom cards</p>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10000,
        overflow: 'auto'
      }}>
        <div style={{
          position: 'relative',
          background: '#111827',
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            background: '#111827',
            borderBottom: '1px solid #374151',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10001
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#f9fafb',
              margin: 0
            }}>
              {editingCard ? 'Edit Custom Card' : 'Create Custom Card'}
            </h2>
            <button
              onClick={() => {
                setShowEditor(false);
                setEditingCard(null);
              }}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '16px' }}>×</span>
              Close
            </button>
          </div>

          {/* Editor */}
          <CharacterEditor
            character={editingCard ? {
              id: editingCard.id,
              name: editingCard.name,
              characterNames: editingCard.description,
              boxSetCode: '',
              portrait: editingCard.portrait,
              squad_points: editingCard.squadPoints,
              point_cost: editingCard.unitType !== 'Primary' ? editingCard.squadPoints : 0,
              force: editingCard.force || 0,
              unit_type: editingCard.unitType,
              stamina: editingCard.stamina,
              durability: editingCard.durability,
              number_of_characters: 1,
              factions: [editingCard.faction],
              period: [],
              abilities: editingCard.abilities || [],
              structuredAbilities: editingCard.abilities || []
            } : null}
            onSave={handleSaveCard}
            onCancel={() => {
              setShowEditor(false);
              setEditingCard(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      background: '#111827',
      color: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f9fafb',
            margin: '0 0 8px 0'
          }}>
            Custom Made Cards
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            margin: 0
          }}>
            Create and manage your own custom character cards
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            Create New Card
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 114, 128, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Custom Cards List */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          color: '#9ca3af'
        }}>
          Loading your custom cards...
        </div>
      ) : customCards.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: '#1f2937',
          borderRadius: '12px',
          border: '2px dashed #374151'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#6b7280'
          }}>
            🎨
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '8px'
          }}>
            No Custom Cards Yet
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            marginBottom: '24px'
          }}>
            Create your first custom character card to get started
          </p>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Create Your First Card
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {customCards.map((card) => (
            <div
              key={card.id}
              style={{
                background: '#1f2937',
                borderRadius: '12px',
                border: '1px solid #374151',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Card Header */}
              <div style={{
                background: 'linear-gradient(135deg, #374151, #1f2937)',
                padding: '16px',
                borderBottom: '1px solid #374151'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#f9fafb',
                    margin: 0,
                    flex: 1
                  }}>
                    {card.name}
                  </h3>
                  <div style={{
                    padding: '4px 8px',
                    background: card.status === 'PUBLISHED' ? '#10b981' : 
                               card.status === 'SHARED' ? '#3b82f6' : '#6b7280',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {card.status}
                  </div>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: 0
                }}>
                  {card.description || 'No description'}
                </p>
              </div>

              {/* Card Content */}
              <div style={{ padding: '16px' }}>
                {/* Portrait */}
                {card.portrait && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <img
                      src={card.portrait}
                      alt={card.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid #374151'
                      }}
                    />
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    background: '#374151',
                    padding: '8px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '2px'
                    }}>
                      {card.unitType === 'Primary' ? 'SP' : 'PC'}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#f9fafb'
                    }}>
                      {card.squadPoints}
                    </div>
                  </div>
                  <div style={{
                    background: '#374151',
                    padding: '8px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '2px'
                    }}>
                      Force
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#fbbf24'
                    }}>
                      {card.force || 0}
                    </div>
                  </div>
                  <div style={{
                    background: '#374151',
                    padding: '8px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '2px'
                    }}>
                      Stamina
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#f9fafb'
                    }}>
                      {card.stamina}
                    </div>
                  </div>
                  <div style={{
                    background: '#374151',
                    padding: '8px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '2px'
                    }}>
                      Durability
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#f9fafb'
                    }}>
                      {card.durability}
                    </div>
                  </div>
                </div>

                {/* Faction & Type */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    background: '#3b82f6',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white'
                  }}>
                    {card.faction}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: card.unitType === 'Primary' ? '#dc2626' :
                               card.unitType === 'Secondary' ? '#f59e0b' : '#10b981',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white'
                  }}>
                    {card.unitType}
                  </span>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleEditCard(card)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                    }}
                  >
                    Edit
                  </button>
                  {card.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishCard(card)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#10b981';
                      }}
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
