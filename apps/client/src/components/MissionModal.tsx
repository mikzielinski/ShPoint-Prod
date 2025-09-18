import React, { useState, useMemo } from 'react';
import { Mission, MissionObjective, StruggleCard } from '../data/missions';

interface MissionModalProps {
  mission: Mission;
  onClose: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({ mission, onClose }) => {
  const [selectedCard, setSelectedCard] = useState<StruggleCard | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [cardName: string]: number }>({});
  const [zoom, setZoom] = useState(1);

  const activeObjectives = useMemo(() => {
    if (!selectedCard) return [];
    
    if (selectedCard.active) {
      return selectedCard.active;
    }
    
    // Use the selected option for the current card, or option 0 if none selected
    const optionIndex = selectedOptions[selectedCard.name] || 0;
    if (selectedCard.options && selectedCard.options[optionIndex]) {
      return selectedCard.options[optionIndex].active;
    }
    
    return [];
  }, [selectedCard, selectedOptions]);

  const getObjectiveColor = (objectiveKey: string) => {
    if (activeObjectives.includes(objectiveKey)) {
      return mission.rendering.point.colorActive;
    }
    return mission.rendering.point.colorInactive;
  };

  const handleCardClick = (card: StruggleCard) => {
    setSelectedCard(card);
    // Initialize option 0 for this card if not set
    if (card.options && !(card.name in selectedOptions)) {
      setSelectedOptions(prev => ({ ...prev, [card.name]: 0 }));
    }
  };

  const handleOptionClick = (card: StruggleCard, optionIndex: number) => {
    setSelectedCard(card);
    setSelectedOptions(prev => ({ ...prev, [card.name]: optionIndex }));
  };

  // Calculate map dimensions and scaling
  const baseMapSize = 400; // Fixed size for the modal
  const mapSize = baseMapSize * zoom;
  const scale = mapSize / mission.map.sizeInch;
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;
  
  // Map range: -18 to 18 (36 inches total)
  const mapRange = mission.map.sizeInch;
  const scaleToPixels = mapSize / mapRange;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '2px solid #444',
        borderRadius: '12px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Mission Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#ffd700', margin: '0 0 10px 0' }}>
            {mission.name}
          </h2>
          {mission.description && (
            <p style={{ color: '#ccc', margin: '0 0 10px 0' }}>
              {mission.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Map */}
          <div style={{ flex: '1', minWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0 }}>
                Game Map
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  style={{
                    background: '#444',
                    color: '#fff',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  -
                </button>
                <span style={{ color: '#fff', fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  style={{
                    background: '#444',
                    color: '#fff',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{
              maxWidth: '400px',
              maxHeight: '400px',
              overflow: 'auto',
              border: '2px solid #444',
              borderRadius: '8px',
              margin: '0 auto'
            }}>
              <div style={{
                position: 'relative',
                width: mapSize,
                height: mapSize,
                backgroundColor: '#2a2a3e',
                minWidth: '400px',
                minHeight: '400px'
              }}>
              {/* Grid lines for dynamic map size */}
              <svg width={mapSize} height={mapSize} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Vertical lines every 2 inches */}
                {Array.from({ length: Math.floor(mapRange/2) + 1 }, (_, i) => {
                  const x = centerX + ((i - mapRange/4) * 2 * scaleToPixels);
                  return (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={mapSize}
                      stroke="#666"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Horizontal lines every 2 inches */}
                {Array.from({ length: Math.floor(mapRange/2) + 1 }, (_, i) => {
                  const y = centerY - ((i - mapRange/4) * 2 * scaleToPixels);
                  return (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={y}
                      x2={mapSize}
                      y2={y}
                      stroke="#666"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>

              {/* Coordinate labels */}
              <svg width={mapSize} height={mapSize} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* X-axis labels every 2 units */}
                {Array.from({ length: Math.floor(mapRange/2) + 1 }, (_, i) => {
                  const x = centerX + ((i - mapRange/4) * 2 * scaleToPixels);
                  const value = (i - mapRange/4) * 2;
                  return (
                    <text
                      key={`x-label-${i}`}
                      x={x}
                      y={mapSize - 5}
                      textAnchor="middle"
                      fill="#888"
                      fontSize="10"
                    >
                      {value}
                    </text>
                  );
                })}
                {/* Y-axis labels every 2 units */}
                {Array.from({ length: Math.floor(mapRange/2) + 1 }, (_, i) => {
                  const y = centerY - ((i - mapRange/4) * 2 * scaleToPixels);
                  const value = (i - mapRange/4) * 2;
                  return (
                    <text
                      key={`y-label-${i}`}
                      x={5}
                      y={y + 3}
                      textAnchor="start"
                      fill="#888"
                      fontSize="10"
                    >
                      {value}
                    </text>
                  );
                })}
              </svg>

              {/* Objectives */}
              <svg width={mapSize} height={mapSize} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                {mission.objectives.map((objective) => {
                  // Convert from coordinate range to pixel coordinates
                  const x = centerX + (objective.x * scaleToPixels);
                  const y = centerY - (objective.y * scaleToPixels); // Flip Y axis
                  const radius = objective.radius * scaleToPixels;
                  const color = getObjectiveColor(objective.key);

                  return (
                    <circle
                      key={objective.key}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={color}
                      stroke="#fff"
                      strokeWidth="2"
                      style={{
                        cursor: 'pointer',
                        filter: color === '#ffd700' ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' : 'none'
                      }}
                    />
                  );
                })}
              </svg>
              </div>
            </div>
            
            {/* Active Special Rules Container */}
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#333',
              borderRadius: '6px',
              border: '1px solid #555',
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '60px'
            }}>
              {selectedCard && selectedCard.specialRules && selectedCard.specialRules !== "N/A" ? (
                <>
                  <div style={{
                    fontSize: '14px',
                    color: '#ffd700',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    Active Special Rule:
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#eee',
                    lineHeight: '1.4'
                  }}>
                    {selectedCard.specialRules}
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: '13px',
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  Click on a card to see special rules
                </div>
              )}
            </div>
          </div>

          {/* Struggles */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h3 style={{ color: '#fff', marginBottom: '15px' }}>
              Struggles
            </h3>
            {mission.struggles.map((struggle) => (
              <div key={struggle.index} style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  color: '#ffd700', 
                  marginBottom: '10px',
                  fontSize: '16px'
                }}>
                  Struggle {struggle.index}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {struggle.cards.map((card, cardIndex) => (
                    <div
                      key={cardIndex}
                      onClick={() => handleCardClick(card)}
                      style={{
                        backgroundColor: selectedCard === card ? '#444' : '#333',
                        border: selectedCard === card ? '2px solid #ffd700' : '1px solid #555',
                        borderRadius: '6px',
                        padding: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        color: '#fff', 
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {card.name}
                      </div>
                      
                      {card.options && (
                        <div style={{ marginTop: '8px' }}>
                          {card.options.map((option, optionIndex) => {
                            // Show the saved option for this card, or 0 if none saved
                            const currentOption = selectedOptions[card.name] || 0;
                            return (
                              <button
                                key={optionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOptionClick(card, optionIndex);
                                }}
                                style={{
                                  backgroundColor: currentOption === optionIndex ? '#ffd700' : '#555',
                                  color: currentOption === optionIndex ? '#000' : '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  margin: '2px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                {option.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
