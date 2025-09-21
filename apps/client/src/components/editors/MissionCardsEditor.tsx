import React, { useState, useEffect } from 'react';
import { missionsData } from '../../data/missions';

interface MissionCardsEditorProps {
  mission?: any;
  onSave: (mission: any) => void;
  onCancel: () => void;
  onPreview?: (mission: any) => void;
}

const MissionCardsEditor: React.FC<MissionCardsEditorProps> = ({ mission, onSave, onCancel, onPreview }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    source: 'official',
    setCode: '',
    tags: ['mission', 'setup'],
    thumbnail: '',
    map: { sizeInch: 36, unit: 'inch', origin: 'center', axis: 'x-right_y-up' },
    rendering: { point: { diameterInch: 1, colorActive: 'gold', colorInactive: 'gray' } },
    objectives: [],
    struggles: [],
    notes: ''
  });

  const [newObjectiveKey, setNewObjectiveKey] = useState('');
  const [newObjectiveX, setNewObjectiveX] = useState('');
  const [newObjectiveY, setNewObjectiveY] = useState('');
  const [newObjectiveRadius, setNewObjectiveRadius] = useState('0.5');

  const [newStruggleIndex, setNewStruggleIndex] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardType, setNewCardType] = useState('active'); // 'active' or 'options'
  const [newCardActive, setNewCardActive] = useState('');
  const [newCardSpecialRules, setNewCardSpecialRules] = useState('N/A');
  const [activeSection, setActiveSection] = useState<'initial-setup' | 'mission-cards'>('initial-setup');
  const [editingCard, setEditingCard] = useState<{struggleIndex: number, cardIndex: number} | null>(null);

  // Initialize form data when mission prop changes
  useEffect(() => {
    if (mission) {
      setFormData({
        id: mission.id || '',
        name: mission.name || '',
        description: mission.description || '',
        source: mission.source || 'official',
        setCode: mission.setCode || '',
        tags: mission.tags || ['mission', 'setup'],
        thumbnail: mission.thumbnail || '',
        map: mission.map || { sizeInch: 36, unit: 'inch', origin: 'center', axis: 'x-right_y-up' },
        rendering: mission.rendering || { point: { diameterInch: 1, colorActive: 'gold', colorInactive: 'gray' } },
        objectives: mission.objectives || [],
        struggles: mission.struggles || [],
        notes: mission.notes || ''
      });
    }
  }, [mission]);

  // Helper function to get full mission data
  const getFullMissionData = (missionId: string) => {
    return (missionsData as any[]).find(mission => mission.id === missionId);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle objective changes
  const handleObjectiveChange = (index: number, field: string, value: any) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = { ...newObjectives[index], [field]: value };
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  // Add new objective
  const handleAddObjective = () => {
    if (newObjectiveKey.trim() && newObjectiveX && newObjectiveY) {
      const newObjective = {
        key: newObjectiveKey.trim().toUpperCase(),
        x: parseFloat(newObjectiveX),
        y: parseFloat(newObjectiveY),
        radius: parseFloat(newObjectiveRadius)
      };
      
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective]
      }));
      
      setNewObjectiveKey('');
      setNewObjectiveX('');
      setNewObjectiveY('');
      setNewObjectiveRadius('0.5');
    }
  };

  // Remove objective
  const handleRemoveObjective = (index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  // Add new struggle
  const handleAddStruggle = () => {
    if (newStruggleIndex) {
      const newStruggle = {
        index: parseInt(newStruggleIndex),
        cards: []
      };
      
      setFormData(prev => ({
        ...prev,
        struggles: [...prev.struggles, newStruggle]
      }));
      
      setNewStruggleIndex('');
    }
  };

  // Add new card to struggle
  const handleAddCard = (struggleIndex: number) => {
    if (newCardName.trim()) {
      let newCard;
      
      if (newCardType === 'active') {
        newCard = {
          name: newCardName.trim(),
          active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [],
          specialRules: newCardSpecialRules.trim()
        };
      } else {
        // For options type, create a simple structure
        newCard = {
          name: newCardName.trim(),
          options: [
            { name: "Option 1", active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [] }
          ],
          specialRules: newCardSpecialRules.trim()
        };
      }
      
      const newStruggles = [...formData.struggles];
      newStruggles[struggleIndex].cards.push(newCard);
      
      setFormData(prev => ({ ...prev, struggles: newStruggles }));
      
      setNewCardName('');
      setNewCardActive('');
      setNewCardSpecialRules('N/A');
    }
  };

  // Remove card
  const handleRemoveCard = (struggleIndex: number, cardIndex: number) => {
    const newStruggles = [...formData.struggles];
    newStruggles[struggleIndex].cards.splice(cardIndex, 1);
    setFormData(prev => ({ ...prev, struggles: newStruggles }));
  };

  // Remove struggle
  const handleRemoveStruggle = (struggleIndex: number) => {
    const newStruggles = formData.struggles.filter((_, i) => i !== struggleIndex);
    setFormData(prev => ({ ...prev, struggles: newStruggles }));
  };

  // Edit card
  const handleEditCard = (struggleIndex: number, cardIndex: number) => {
    const card = formData.struggles[struggleIndex].cards[cardIndex];
    setEditingCard({ struggleIndex, cardIndex });
    
    // Populate form with card data
    setNewCardName(card.name);
    setNewCardSpecialRules(card.specialRules);
    
    if (card.active) {
      setNewCardType('active');
      setNewCardActive(card.active.join(', '));
    } else if (card.options) {
      setNewCardType('options');
      // For options, we'll edit the first option for simplicity
      setNewCardActive(card.options[0]?.active?.join(', ') || '');
    }
  };

  // Save edited card
  const handleSaveEditedCard = () => {
    if (!editingCard) return;
    
    const { struggleIndex, cardIndex } = editingCard;
    const newStruggles = [...formData.struggles];
    
    let updatedCard;
    if (newCardType === 'active') {
      updatedCard = {
        name: newCardName.trim(),
        active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [],
        specialRules: newCardSpecialRules.trim()
      };
    } else {
      // For options type, create a simple structure
      updatedCard = {
        name: newCardName.trim(),
        options: [
          { name: "Option 1", active: newCardActive ? newCardActive.split(',').map(s => s.trim().toUpperCase()) : [] }
        ],
        specialRules: newCardSpecialRules.trim()
      };
    }
    
    newStruggles[struggleIndex].cards[cardIndex] = updatedCard;
    setFormData(prev => ({ ...prev, struggles: newStruggles }));
    
    // Reset form and editing state
    setEditingCard(null);
    setNewCardName('');
    setNewCardActive('');
    setNewCardSpecialRules('N/A');
    setNewCardType('active');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCard(null);
    setNewCardName('');
    setNewCardActive('');
    setNewCardSpecialRules('N/A');
    setNewCardType('active');
  };

  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '24px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e0e7ff', margin: 0 }}>
          Mission Cards Editor
        </h2>
        
        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveSection('initial-setup')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSection === 'initial-setup' ? '#3b82f6' : '#374151',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            Initial Setup
          </button>
          <button
            onClick={() => setActiveSection('mission-cards')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSection === 'mission-cards' ? '#3b82f6' : '#374151',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            Mission Cards
          </button>
        </div>
      </div>

      {/* Mission Basic Info - Always visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Mission ID *</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '14px'
              }}
              placeholder="e.g., dont-tell-me-odds"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Set Code</label>
            <input
              type="text"
              value={formData.setCode}
              onChange={(e) => handleInputChange('setCode', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '14px'
              }}
              placeholder="e.g., SWP001"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 2 }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Mission Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '14px'
              }}
              placeholder="e.g., Don't Tell me odds"
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#9ca3af' }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '14px',
              minHeight: '60px',
              resize: 'vertical'
            }}
            placeholder="A high-stakes mission where players must control strategic positions..."
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Tags</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()))}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '14px'
              }}
              placeholder="mission, setup"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Thumbnail URL</label>
            <input
              type="text"
              value={formData.thumbnail}
              onChange={(e) => handleInputChange('thumbnail', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '14px'
              }}
              placeholder="/missions/dont-tell-me-odds/thumbnail.png"
            />
          </div>
        </div>
      </div>

      {/* Initial Setup Section */}
      {activeSection === 'initial-setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }}>
          Initial Setup
        </h3>

        {/* Map Configuration */}
        <div style={{ 
          background: '#374151', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #4b5563'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e7ff', marginBottom: '12px' }}>
            Map Configuration
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>
                Map Size (inches)
              </label>
              <div style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#9ca3af',
                fontSize: '12px',
                width: '100%',
                textAlign: 'center'
              }}>
                36"
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>
                Origin
              </label>
              <div className="role-select-wrap">
                <select
                  className="role-select"
                  value={formData.map.origin}
                  onChange={(e) => handleInputChange('map', { ...formData.map, origin: e.target.value })}
                >
                  <option value="center">Center</option>
                  <option value="corner">Corner</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div style={{ 
          background: '#374151', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #4b5563'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e7ff', marginBottom: '12px' }}>
            Objectives ({formData.objectives.length})
          </h4>

          {/* Add Objective Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                Key
              </label>
              <input
                type="text"
                value={newObjectiveKey}
                onChange={(e) => setNewObjectiveKey(e.target.value)}
                style={{
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: '1px solid #4b5563',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  fontSize: '10px',
                  width: '100%'
                }}
                placeholder="A"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                X
              </label>
              <input
                type="number"
                value={newObjectiveX}
                onChange={(e) => setNewObjectiveX(e.target.value)}
                style={{
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: '1px solid #4b5563',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  fontSize: '10px',
                  width: '100%'
                }}
                placeholder="-10"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                Y
              </label>
              <input
                type="number"
                value={newObjectiveY}
                onChange={(e) => setNewObjectiveY(e.target.value)}
                style={{
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: '1px solid #4b5563',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  fontSize: '10px',
                  width: '100%'
                }}
                placeholder="8"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                Radius
              </label>
              <div style={{
                padding: '4px 6px',
                borderRadius: '3px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#9ca3af',
                fontSize: '10px',
                width: '100%',
                textAlign: 'center'
              }}>
                0.5"
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddObjective}
              style={{
                padding: '4px 8px',
                borderRadius: '3px',
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                height: 'fit-content'
              }}
            >
              Add
            </button>
          </div>

          {/* Objectives List */}
          {formData.objectives.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {formData.objectives.map((objective, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '8px',
                  background: '#2d3748',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <input
                    type="text"
                    value={objective.key}
                    onChange={(e) => handleObjectiveChange(index, 'key', e.target.value.toUpperCase())}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: '#f3f4f6',
                      fontSize: '10px'
                    }}
                  />
                  <input
                    type="number"
                    value={objective.x}
                    onChange={(e) => handleObjectiveChange(index, 'x', parseFloat(e.target.value))}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: '#f3f4f6',
                      fontSize: '10px'
                    }}
                  />
                  <input
                    type="number"
                    value={objective.y}
                    onChange={(e) => handleObjectiveChange(index, 'y', parseFloat(e.target.value))}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: '#f3f4f6',
                      fontSize: '10px'
                    }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={objective.radius}
                    onChange={(e) => handleObjectiveChange(index, 'radius', parseFloat(e.target.value))}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: '#f3f4f6',
                      fontSize: '10px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: 'none',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Map Preview */}
          {formData.objectives.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }}>
                Map Preview
              </h5>
              <div style={{ 
                width: '300px', 
                height: '200px', 
                background: '#1f2937', 
                border: '2px solid #4b5563',
                borderRadius: '8px',
                position: 'relative'
              }}>
                <svg width="300" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                  {/* Grid lines */}
                  {[-16, -12, -8, -4, 0, 4, 8, 12, 16].map(x => (
                    <line key={`v-${x}`} x1={150 + x * 4.5} y1="0" x2={150 + x * 4.5} y2="200" stroke="#374151" strokeWidth="0.5" />
                  ))}
                  {[-12, -8, -4, 0, 4, 8, 12].map(y => (
                    <line key={`h-${y}`} x1="0" y1={100 - y * 4.5} x2="300" y2={100 - y * 4.5} stroke="#374151" strokeWidth="0.5" />
                  ))}
                  
                  {/* Objectives */}
                  {formData.objectives.map((objective, index) => {
                    const x = 150 + (objective.x / 18) * 150;
                    const y = 100 - (objective.y / 18) * 100;
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#6b7280"
                          stroke="#1f2937"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={y + 2}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#f3f4f6"
                          fontWeight="600"
                        >
                          {objective.key}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Mission Cards Section */}
      {activeSection === 'mission-cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#e0e7ff', marginBottom: '8px' }}>
          Mission Cards
        </h3>

        {/* Add Struggle Form */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'end', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Struggle Index</label>
            <input
              type="number"
              value={newStruggleIndex}
              onChange={(e) => setNewStruggleIndex(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#f3f4f6',
                fontSize: '12px'
              }}
              placeholder="1"
            />
          </div>
          <button
            type="button"
            onClick={handleAddStruggle}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add Struggle
          </button>
        </div>

        {/* Struggles List */}
        {formData.struggles.map((struggle, struggleIndex) => (
          <div key={struggleIndex} style={{ 
            background: '#374151', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #4b5563'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e7ff' }}>
                Struggle {struggle.index} ({struggle.cards.length} cards)
              </h4>
              <button
                type="button"
                onClick={() => handleRemoveStruggle(struggleIndex)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Remove Struggle
              </button>
            </div>

            {/* Add/Edit Card Form */}
            <div style={{ 
              background: editingCard ? '#2d3748' : 'transparent', 
              padding: editingCard ? '12px' : '0', 
              borderRadius: editingCard ? '6px' : '0',
              border: editingCard ? '1px solid #4b5563' : 'none',
              marginBottom: '12px'
            }}>
              {editingCard && (
                <div style={{ 
                  color: '#fbbf24', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  Editing Card
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto auto', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                  Card Name
                </label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '3px',
                    border: '1px solid #4b5563',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    fontSize: '10px',
                    width: '100%'
                  }}
                  placeholder="Desperackie Kroki"
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                  Card Type
                </label>
                <div className="role-select-wrap">
                  <select
                    className="role-select"
                    value={newCardType}
                    onChange={(e) => setNewCardType(e.target.value)}
                    style={{ fontSize: '10px', height: '28px' }}
                  >
                    <option value="active">Active</option>
                    <option value="options">Options</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                  {newCardType === 'active' ? 'Active Objectives' : 'Option 1 Objectives'}
                </label>
                <input
                  type="text"
                  value={newCardActive}
                  onChange={(e) => setNewCardActive(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '3px',
                    border: '1px solid #4b5563',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    fontSize: '10px',
                    width: '100%'
                  }}
                  placeholder="A,B,F,H,C"
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'block' }}>
                  Special Rules
                </label>
                <input
                  type="text"
                  value={newCardSpecialRules}
                  onChange={(e) => setNewCardSpecialRules(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '3px',
                    border: '1px solid #4b5563',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    fontSize: '10px',
                    width: '100%'
                  }}
                  placeholder="N/A"
                />
              </div>
              <button
                type="button"
                onClick={() => editingCard ? handleSaveEditedCard() : handleAddCard(struggleIndex)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingCard ? 'Save' : 'Add Card'}
              </button>
              {editingCard && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '3px',
                    border: 'none',
                    background: '#6b7280',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
              </div>
            </div>

            {/* Cards List */}
            {struggle.cards.map((card, cardIndex) => (
              <div key={cardIndex} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#2d3748',
                borderRadius: '4px',
                fontSize: '11px',
                marginBottom: '6px'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ color: '#f3f4f6', fontWeight: '500' }}>{card.name}</span>
                  {card.active && card.active.length > 0 && (
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                      Active: {card.active.join(', ')}
                    </span>
                  )}
                  {card.options && card.options.length > 0 && (
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                      Options: {card.options.length}
                    </span>
                  )}
                  {card.specialRules && card.specialRules !== 'N/A' && (
                    <span style={{ color: '#fbbf24', fontSize: '10px' }}>
                      Rules: {card.specialRules}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleEditCard(struggleIndex, cardIndex)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: 'none',
                      background: '#3b82f6',
                      color: 'white',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(struggleIndex, cardIndex)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: 'none',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#374151',
            color: '#f3f4f6',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(formData)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Preview
          </button>
        )}
        <button
          type="button"
          onClick={() => onSave(formData)}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Save Mission Card
        </button>
      </div>
    </div>
  );
};

export default MissionCardsEditor;
