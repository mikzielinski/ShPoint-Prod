import React, { useState } from 'react';

interface MissionCardsPreviewProps {
  mission: any;
}

const MissionCardsPreview: React.FC<MissionCardsPreviewProps> = ({ mission }) => {
  const [activeObjectives, setActiveObjectives] = useState<Set<string>>(new Set());
  const [selectedObjective, setSelectedObjective] = useState<any>(null);

  // Handle objective click
  const handleObjectiveClick = (objectiveKey: string) => {
    setActiveObjectives(prev => {
      const newActive = new Set(prev);
      if (newActive.has(objectiveKey)) {
        newActive.delete(objectiveKey);
      } else {
        newActive.add(objectiveKey);
      }
      return newActive;
    });

    // Show coordinates
    const objective = mission.objectives?.find((obj: any) => obj.key === objectiveKey);
    if (objective) {
      setSelectedObjective(objective);
    }
  };

  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '24px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#e0e7ff' }}>
        {mission.name}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column - Basic Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mission Info */}
          <div style={{ background: '#374151', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }}>Details</h3>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>ID:</strong> {mission.id}</p>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>Source:</strong> {mission.source}</p>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>Tags:</strong> {mission.tags?.join(', ')}</p>
            {mission.description && <p><strong style={{ color: '#9ca3af' }}>Description:</strong> {mission.description}</p>}
            {mission.notes && <p><strong style={{ color: '#9ca3af' }}>Notes:</strong> {mission.notes}</p>}
          </div>

          {/* Map Configuration */}
          <div style={{ background: '#374151', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }}>Map Configuration</h3>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>Size:</strong> {mission.map?.sizeInch}"</p>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>Origin:</strong> {mission.map?.origin}</p>
            <p style={{ marginBottom: '5px' }}><strong style={{ color: '#9ca3af' }}>Axis:</strong> {mission.map?.axis}</p>
            <p><strong style={{ color: '#9ca3af' }}>Point Diameter:</strong> {mission.rendering?.point?.diameterInch}"</p>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Initial Setup */}
          <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#e0e7ff', margin: 0 }}>
                Initial Setup
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveObjectives(new Set())}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Reset All
                </button>
                {selectedObjective && (
                  <button
                    onClick={() => setSelectedObjective(null)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#6b7280',
                      color: 'white',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
            
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#e0e7ff', 
              marginBottom: '12px',
              padding: '4px 8px',
              background: '#4b5563',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              All Objectives ({mission.objectives?.length || 0})
            </h4>
            
            {/* Full Map with All Objectives - 36x36 inch square */}
            <div style={{ 
              width: '360px', 
              height: '360px', 
              background: '#1f2937', 
              border: '2px solid #4b5563',
              borderRadius: '8px',
              position: 'relative',
              marginBottom: '10px'
            }}>
              <svg width="360" height="360" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Grid lines - 1 inch intervals (36 lines total: -18 to +18) */}
                {Array.from({ length: 37 }, (_, i) => i - 18).map(x => (
                  <line 
                    key={`v-${x}`} 
                    x1={180 + x * 10} 
                    y1="0" 
                    x2={180 + x * 10} 
                    y2="360" 
                    stroke={x === 0 ? "#4b5563" : "#374151"} 
                    strokeWidth={x === 0 ? "1" : "0.5"} 
                  />
                ))}
                {Array.from({ length: 37 }, (_, i) => i - 18).map(y => (
                  <line 
                    key={`h-${y}`} 
                    x1="0" 
                    y1={180 - y * 10} 
                    x2="360" 
                    y2={180 - y * 10} 
                    stroke={y === 0 ? "#4b5563" : "#374151"} 
                    strokeWidth={y === 0 ? "1" : "0.5"} 
                  />
                ))}
                
                {/* All Objectives */}
                {mission.objectives?.map((objective: any, index: number) => {
                  // Scale from -18 to +18 range to 0-360 pixel range
                  const x = 180 + (objective.x * 10); // 1 inch = 10 pixels
                  const y = 180 - (objective.y * 10); // 1 inch = 10 pixels, flip Y axis
                  const isActive = activeObjectives.has(objective.key);
                  
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill={isActive ? "#fbbf24" : "#6b7280"}
                        stroke="#1f2937"
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleObjectiveClick(objective.key)}
                      />
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#f3f4f6"
                        fontWeight="600"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleObjectiveClick(objective.key)}
                      >
                        {objective.key}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Objective Coordinates */}
            {selectedObjective && (
              <div style={{
                background: '#374151',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '10px',
                border: '1px solid #4b5563'
              }}>
                <h5 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#fbbf24',
                  marginBottom: '6px',
                  margin: '0 0 6px 0'
                }}>
                  Selected Objective: {selectedObjective.key}
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  fontSize: '11px'
                }}>
                  <div>
                    <span style={{ color: '#9ca3af' }}>X:</span>
                    <span style={{ color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }}>
                      {selectedObjective.x}"
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Y:</span>
                    <span style={{ color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }}>
                      {selectedObjective.y}"
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Radius:</span>
                    <span style={{ color: '#f3f4f6', fontWeight: '600', marginLeft: '4px' }}>
                      {selectedObjective.radius}"
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Objective Legend */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', 
              gap: '8px',
              maxWidth: '360px'
            }}>
              {mission.objectives?.map((objective: any, index: number) => {
                const isActive = activeObjectives.has(objective.key);
                return (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: isActive ? '#fbbf24' : '#9ca3af',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '3px',
                      transition: 'background 0.2s ease',
                      background: selectedObjective?.key === objective.key ? '#4b5563' : 'transparent'
                    }}
                    onClick={() => {
                      handleObjectiveClick(objective.key);
                      setSelectedObjective(objective);
                    }}
                    onMouseEnter={(e) => {
                      if (selectedObjective?.key !== objective.key) {
                        e.currentTarget.style.background = '#374151';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedObjective?.key !== objective.key) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isActive ? '#fbbf24' : '#6b7280',
                      border: '1px solid #1f2937'
                    }}></div>
                    <span style={{ fontWeight: isActive ? '600' : '400' }}>{objective.key}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mission Cards */}
          {mission.struggles && mission.struggles.length > 0 && (
            <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#e0e7ff' }}>
                Mission Cards ({mission.struggles.length} struggles)
              </h3>
              {mission.struggles.map((struggle: any, struggleIndex: number) => (
                <div key={struggleIndex} style={{ marginBottom: '20px' }}>
                  {/* Struggle Cards */}
                  {struggle.cards && struggle.cards.length > 0 && (
                    <div>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#e0e7ff', 
                        marginBottom: '8px',
                        padding: '4px 8px',
                        background: '#4b5563',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        Struggle {struggle.index}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        {struggle.cards.map((card: any, cardIndex: number) => (
                          <div
                            key={cardIndex}
                            style={{
                              background: '#2d3748',
                              padding: '12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              border: '1px solid #4a5568',
                              cursor: 'pointer',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#4a5568';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#2d3748';
                            }}
                          >
                            {/* Card Name */}
                            <div style={{ color: '#f3f4f6', fontWeight: '600', marginBottom: '10px', fontSize: '12px' }}>
                              {card.name}
                            </div>

                            {/* Two Column Layout: Maps + Description */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                              {/* Left Column - Maps */}
                              <div style={{ flex: '0 0 auto' }}>
                                {/* Map Options */}
                                {card.options && card.options.length > 0 ? (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }}>
                                      Map Options:
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      {card.options.map((option: any, optionIndex: number) => (
                                        <div key={optionIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                          <div style={{ color: '#fbbf24', fontSize: '9px', marginBottom: '4px', fontWeight: '500' }}>
                                            {option.name}
                                          </div>
                                          {/* Mini Map for each option - square 36x36 */}
                                          <div style={{ 
                                            width: '100px', 
                                            height: '100px', 
                                            background: '#1f2937', 
                                            border: '1px solid #4b5563',
                                            borderRadius: '4px',
                                            position: 'relative',
                                            marginBottom: '4px'
                                          }}>
                                            <svg width="100" height="100" style={{ position: 'absolute', top: 0, left: 0 }}>
                                              {/* Grid lines - 1 inch intervals scaled down */}
                                              {[-8, -4, 0, 4, 8].map(x => (
                                                <line 
                                                  key={`v-${x}`} 
                                                  x1={50 + x * 2.78} 
                                                  y1="0" 
                                                  x2={50 + x * 2.78} 
                                                  y2="100" 
                                                  stroke={x === 0 ? "#4b5563" : "#374151"} 
                                                  strokeWidth={x === 0 ? "0.8" : "0.3"} 
                                                />
                                              ))}
                                              {[-8, -4, 0, 4, 8].map(y => (
                                                <line 
                                                  key={`h-${y}`} 
                                                  x1="0" 
                                                  y1={50 - y * 2.78} 
                                                  x2="100" 
                                                  y2={50 - y * 2.78} 
                                                  stroke={y === 0 ? "#4b5563" : "#374151"} 
                                                  strokeWidth={y === 0 ? "0.8" : "0.3"} 
                                                />
                                              ))}
                                              {/* Active Objectives for this option */}
                                              {option.active.map((objectiveKey: string) => {
                                                const objective = mission.objectives?.find((obj: any) => obj.key === objectiveKey);
                                                if (!objective) return null;
                                                const x = 50 + (objective.x * 2.78); // Scale 1 inch = 2.78 pixels
                                                const y = 50 - (objective.y * 2.78); // Scale and flip Y axis
                                                return (
                                                  <circle
                                                    key={objectiveKey}
                                                    cx={x}
                                                    cy={y}
                                                    r="2.5"
                                                    fill="#fbbf24"
                                                    stroke="#1f2937"
                                                    strokeWidth="1"
                                                  />
                                                );
                                              })}
                                            </svg>
                                          </div>
                                          <div style={{ color: '#9ca3af', fontSize: '8px', textAlign: 'center' }}>
                                            Active: {option.active.join(', ')}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : card.active && card.active.length > 0 ? (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }}>
                                      Active Objectives:
                                    </div>
                                    {/* Mini Map for active objectives - square 36x36 */}
                                    <div style={{ 
                                      width: '120px', 
                                      height: '120px', 
                                      background: '#1f2937', 
                                      border: '1px solid #4b5563',
                                      borderRadius: '4px',
                                      position: 'relative',
                                      marginBottom: '4px'
                                    }}>
                                      <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0 }}>
                                        {/* Grid lines - 1 inch intervals scaled down */}
                                        {[-8, -4, 0, 4, 8].map(x => (
                                          <line 
                                            key={`v-${x}`} 
                                            x1={60 + x * 3.33} 
                                            y1="0" 
                                            x2={60 + x * 3.33} 
                                            y2="120" 
                                            stroke={x === 0 ? "#4b5563" : "#374151"} 
                                            strokeWidth={x === 0 ? "0.8" : "0.3"} 
                                          />
                                        ))}
                                        {[-8, -4, 0, 4, 8].map(y => (
                                          <line 
                                            key={`h-${y}`} 
                                            x1="0" 
                                            y1={60 - y * 3.33} 
                                            x2="120" 
                                            y2={60 - y * 3.33} 
                                            stroke={y === 0 ? "#4b5563" : "#374151"} 
                                            strokeWidth={y === 0 ? "0.8" : "0.3"} 
                                          />
                                        ))}
                                        {/* Active Objectives */}
                                        {card.active.map((objectiveKey: string) => {
                                          const objective = mission.objectives?.find((obj: any) => obj.key === objectiveKey);
                                          if (!objective) return null;
                                          const x = 60 + (objective.x * 3.33); // Scale 1 inch = 3.33 pixels
                                          const y = 60 - (objective.y * 3.33); // Scale and flip Y axis
                                          return (
                                            <circle
                                              key={objectiveKey}
                                              cx={x}
                                              cy={y}
                                              r="3"
                                              fill="#fbbf24"
                                              stroke="#1f2937"
                                              strokeWidth="1"
                                            />
                                          );
                                        })}
                                      </svg>
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '9px' }}>
                                      Active: {card.active.join(', ')}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Right Column - Card Description */}
                              <div style={{ flex: '1', minWidth: '200px' }}>
                                {/* Special Rules */}
                                {card.specialRules && card.specialRules !== 'N/A' && (
                                  <div>
                                    <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: '500' }}>
                                      Special Rules:
                                    </div>
                                    <div style={{ 
                                      color: '#fbbf24', 
                                      fontSize: '11px', 
                                      lineHeight: '1.4',
                                      padding: '8px',
                                      background: '#374151',
                                      borderRadius: '4px',
                                      border: '1px solid #4b5563'
                                    }}>
                                      {card.specialRules}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionCardsPreview;
