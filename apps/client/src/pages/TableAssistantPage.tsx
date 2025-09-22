import React, { useState } from 'react';
import Modal from '../components/Modal';

const TableAssistantPage: React.FC = () => {
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'hero-vs-hero' | 'strike-team-vs-strike-team' | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [rollHistory, setRollHistory] = useState<Array<{ table: string; result: number; timestamp: Date }>>([]);

  // Define available tables
  const tables = [
    { id: 'd4', name: 'D4', max: 4 },
    { id: 'd6', name: 'D6', max: 6 },
    { id: 'd8', name: 'D8', max: 8 },
    { id: 'd10', name: 'D10', max: 10 },
    { id: 'd12', name: 'D12', max: 12 },
    { id: 'd20', name: 'D20', max: 20 },
    { id: 'd100', name: 'D100', max: 100 }
  ];

  const rollDice = (max: number) => {
    const result = Math.floor(Math.random() * max) + 1;
    setRollResult(result);
    
    const tableName = tables.find(t => t.max === max)?.name || `D${max}`;
    setRollHistory(prev => [
      { table: tableName, result, timestamp: new Date() },
      ...prev.slice(0, 9) // Keep only last 10 rolls
    ]);
  };

  const clearHistory = () => {
    setRollHistory([]);
  };

  return (
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
        marginBottom: '24px',
        border: '1px solid #4b5563'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#f9fafb',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          🎲 Table Assistant
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          Roll dice and manage your table results
        </p>

        {/* Dice Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => rollDice(table.max)}
              style={{
                padding: '16px',
                background: selectedTable === table.id ? '#3b82f6' : '#374151',
                border: '2px solid',
                borderColor: selectedTable === table.id ? '#3b82f6' : '#4b5563',
                borderRadius: '8px',
                color: '#f9fafb',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                if (selectedTable !== table.id) {
                  e.currentTarget.style.background = '#4b5563';
                  e.currentTarget.style.borderColor = '#6b7280';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTable !== table.id) {
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>🎲</span>
              <span>{table.name}</span>
            </button>
          ))}
        </div>

        {/* Roll Result */}
        {rollResult !== null && (
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '8px'
            }}>
              {rollResult}
            </div>
            <div style={{
              fontSize: '18px',
              color: '#9ca3af'
            }}>
              Latest Roll Result
            </div>
          </div>
        )}

        {/* Roll History */}
        {rollHistory.length > 0 && (
          <div style={{
            background: '#111827',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #374151'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#f9fafb',
                margin: '0'
              }}>
                📊 Roll History
              </h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: '6px 12px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                Clear
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gap: '8px'
            }}>
              {rollHistory.map((roll, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#1f2937',
                    borderRadius: '6px',
                    border: '1px solid #374151'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#10b981',
                      minWidth: '30px'
                    }}>
                      {roll.result}
                    </span>
                    <span style={{
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}>
                      on {roll.table}
                    </span>
                  </div>
                  <span style={{
                    color: '#9ca3af',
                    fontSize: '12px'
                  }}>
                    {roll.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #374151'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f9fafb',
            margin: '0 0 12px 0'
          }}>
            🎯 Quick Actions
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => rollDice(6)}
              style={{
                padding: '12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#374151';
              }}
            >
              🎲 Roll D6 (Standard)
            </button>
            <button
              onClick={() => rollDice(20)}
              style={{
                padding: '12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#374151';
              }}
            >
              🎲 Roll D20 (D&D Style)
            </button>
          </div>
        </div>

        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #374151'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f9fafb',
            margin: '0 0 12px 0'
          }}>
            📈 Statistics
          </h3>
          <div style={{
            color: '#9ca3af',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div>Total Rolls: {rollHistory.length}</div>
            <div>Average: {rollHistory.length > 0 ? (rollHistory.reduce((sum, roll) => sum + roll.result, 0) / rollHistory.length).toFixed(2) : '0'}</div>
            <div>Highest: {rollHistory.length > 0 ? Math.max(...rollHistory.map(r => r.result)) : '0'}</div>
            <div>Lowest: {rollHistory.length > 0 ? Math.min(...rollHistory.map(r => r.result)) : '0'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableAssistantPage;
