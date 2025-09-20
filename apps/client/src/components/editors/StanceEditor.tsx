import * as React from 'react';
import { useState, useEffect } from 'react';
import { GLYPHS, IconName, Icon, iconToCode, iconFromCode } from '../../lib/icons';

// Komponent do wyświetlania glifów jako symboli w polu input
const GlyphInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFocus: (inputRef: HTMLInputElement, onChange: (value: string) => void, currentValue: string) => void;
  onBlur: () => void;
  placeholder: string;
  style: React.CSSProperties;
}> = ({ value, onChange, onFocus, onBlur, placeholder, style }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    onFocus(e.target, onChange, value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={style}
        autoFocus
      />
    );
  }

  // Wyświetl glify jako symbole
  const effects = value.split(',').map(s => s.trim()).filter(s => s);
  
  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'text',
        minHeight: '32px',
        padding: '4px 8px',
        backgroundColor: '#374151',
        border: '1px solid #4b5563',
        borderRadius: '4px',
        color: '#f9fafb',
        fontSize: '12px'
      }}
    >
      {effects.length > 0 ? (
        effects.map((effect, index) => {
          const iconName = iconFromCode(effect);
          return iconName ? (
            <Icon key={index} name={iconName} size={16} />
          ) : (
            <span key={index} style={{ color: '#ef4444' }}>{effect}</span>
          );
        })
      ) : (
        <span style={{ color: '#6b7280' }}>{placeholder}</span>
      )}
    </div>
  );
};

interface Expertise {
  value: string;
  effects: string[];
}

interface Attack {
  dice?: number;
  range?: number;
  defense?: number;
  expertise?: Expertise[];
}

interface Defense {
  expertise?: Expertise[];
}

interface TreeLayout {
  rows: number;
  cols: number;
}

interface TreeNode {
  row: number;
  col: number;
  effects: string[];
}

interface Tree {
  layout?: TreeLayout;
  nodes?: Record<string, TreeNode>;
  edges?: Array<[string, string]>;
}

interface StanceSide {
  id: "A" | "B";
  name: string;
  attack?: {
    melee?: Attack;
    ranged?: Attack;
  };
  defense?: Defense;
  tree?: Tree;
}

interface StanceData {
  sides?: StanceSide[];
}

interface StanceEditorProps {
  stance?: StanceData | null;
  onSave: (stance: StanceData) => void;
  onCancel: () => void;
}

export const StanceEditor: React.FC<StanceEditorProps> = ({
  stance,
  onSave,
  onCancel
}: StanceEditorProps) => {
  const [formData, setFormData] = useState<StanceData>({
    sides: [
      {
        id: "A",
        name: "Side A",
        attack: {
          melee: { dice: 0, range: 0, defense: 0, expertise: [] },
          ranged: { dice: 0, range: 0, defense: 0, expertise: [] }
        },
        defense: { expertise: [] },
        tree: { layout: { rows: 3, cols: 6 }, nodes: {}, edges: [] }
      },
      {
        id: "B",
        name: "Side B",
        attack: {
          melee: { dice: 0, range: 0, defense: 0, expertise: [] },
          ranged: { dice: 0, range: 0, defense: 0, expertise: [] }
        },
        defense: { expertise: [] },
        tree: { layout: { rows: 3, cols: 6 }, nodes: {}, edges: [] }
      }
    ]
  });

  const [showGlyphPanel, setShowGlyphPanel] = useState(false);
  const [activeInputRef, setActiveInputRef] = useState<HTMLInputElement | null>(null);
  const [activeOnChange, setActiveOnChange] = useState<((value: string) => void) | null>(null);
  const [activeCurrentValue, setActiveCurrentValue] = useState<string>('');

  // Load stance data when component mounts or stance prop changes
  useEffect(() => {
    if (stance) {
      setFormData(stance);
    }
  }, [stance]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleGlyphClick = (glyphName: string) => {
    console.log('🔍 handleGlyphClick called with:', glyphName);
    if (activeOnChange && activeCurrentValue !== undefined) {
      console.log('🔍 Current input value:', activeCurrentValue);
      // Konwertuj nazwę glifu na kod (np. "strike" -> "a", "crit_to_strike" -> "b→a")
      const glyphCode = iconToCode(glyphName as IconName);
      console.log('🔍 Converted glyph code:', glyphCode);
      // Automatycznie rozdzielaj przecinkami
      const newValue = activeCurrentValue ? `${activeCurrentValue}, ${glyphCode}` : glyphCode;
      console.log('🔍 New value:', newValue);
      
      // Wywołaj callback onChange
      activeOnChange(newValue);
    } else {
      console.log('❌ No active onChange callback');
    }
    setShowGlyphPanel(false);
    setActiveInputRef(null);
    setActiveOnChange(null);
    setActiveCurrentValue('');
  };

  // Funkcja do formatowania nazw glifów dla wyświetlania
  const formatGlyphName = (name: string): string => {
    const nameMap: Record<string, string> = {
      crit_to_strike: "Crit → Strike",
      strike_to_fail: "Strike → Fail",
      strike_to_crit: "Strike → Crit",
      fail_to_strike: "Fail → Strike",
      fail_to_crit: "Fail → Crit",
    };
    return nameMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleInputFocus = (inputRef: HTMLInputElement, onChange: (value: string) => void, currentValue: string) => {
    setActiveInputRef(inputRef);
    setActiveOnChange(() => onChange);
    setActiveCurrentValue(currentValue);
    setShowGlyphPanel(true);
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicking on glyphs
    setTimeout(() => {
      setShowGlyphPanel(false);
      setActiveInputRef(null);
      setActiveOnChange(null);
      setActiveCurrentValue('');
    }, 200);
  };

  const updateSide = (sideId: "A" | "B", updates: Partial<StanceSide>) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId ? { ...side, ...updates } : side
      )
    }));
  };

  const updateAttack = (sideId: "A" | "B", attackType: "melee" | "ranged", updates: Partial<Attack>) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              attack: {
                ...side.attack,
                [attackType]: { ...side.attack?.[attackType], ...updates }
              }
            }
          : side
      )
    }));
  };

  const updateDefense = (sideId: "A" | "B", updates: Partial<Defense>) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              defense: { ...side.defense, ...updates }
            }
          : side
      )
    }));
  };

  const addExpertise = (sideId: "A" | "B", attackType: "melee" | "ranged" | "defense", expertise: Expertise) => {
    if (attackType === "defense") {
      updateDefense(sideId, {
        expertise: [...(formData.sides?.find(s => s.id === sideId)?.defense?.expertise || []), expertise]
      });
    } else {
      updateAttack(sideId, attackType, {
        expertise: [...(formData.sides?.find(s => s.id === sideId)?.attack?.[attackType]?.expertise || []), expertise]
      });
    }
  };

  const removeExpertise = (sideId: "A" | "B", attackType: "melee" | "ranged" | "defense", index: number) => {
    if (attackType === "defense") {
      const newExpertise = formData.sides?.find(s => s.id === sideId)?.defense?.expertise?.filter((_, i) => i !== index) || [];
      updateDefense(sideId, { expertise: newExpertise });
    } else {
      const newExpertise = formData.sides?.find(s => s.id === sideId)?.attack?.[attackType]?.expertise?.filter((_, i) => i !== index) || [];
      updateAttack(sideId, attackType, { expertise: newExpertise });
    }
  };

  const addTreeNode = (sideId: "A" | "B", nodeId: string, node: TreeNode) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              tree: {
                ...side.tree,
                nodes: { ...side.tree?.nodes, [nodeId]: node }
              }
            }
          : side
      )
    }));
  };

  const removeTreeNode = (sideId: "A" | "B", nodeId: string) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              tree: {
                ...side.tree,
                nodes: Object.fromEntries(
                  Object.entries(side.tree?.nodes || {}).filter(([id]) => id !== nodeId)
                ),
                edges: side.tree?.edges?.filter(([from, to]) => from !== nodeId && to !== nodeId) || []
              }
            }
          : side
      )
    }));
  };

  const addTreeEdge = (sideId: "A" | "B", from: string, to: string) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              tree: {
                ...side.tree,
                edges: [...(side.tree?.edges || []), [from, to]]
              }
            }
          : side
      )
    }));
  };

  const removeTreeEdge = (sideId: "A" | "B", index: number) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides?.map(side => 
        side.id === sideId 
          ? {
              ...side,
              tree: {
                ...side.tree,
                edges: side.tree?.edges?.filter((_, i) => i !== index) || []
              }
            }
          : side
      )
    }));
  };

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
        backgroundColor: '#1f2937',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #374151'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid #374151',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#f9fafb',
            margin: 0
          }}>
            Stance Editor
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save Stance
            </button>
          </div>
        </div>

        {/* Stance Sides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {formData.sides?.map((side, sideIndex) => (
            <div key={side.id} style={{
              backgroundColor: '#111827',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #374151'
            }}>
              {/* Side Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#f9fafb',
                  margin: 0
                }}>
                  Side {side.id}
                </h3>
                <input
                  type="text"
                  value={side.name}
                  onChange={(e) => updateSide(side.id, { name: e.target.value })}
                  placeholder="Side name"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#f9fafb',
                    fontSize: '14px',
                    flex: 1,
                    maxWidth: '300px'
                  }}
                />
              </div>

              {/* Attack and Defense Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#f9fafb',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #3b82f6'
                }}>
                  ⚔️ Attack and Defense
                </h4>
                
                {/* Melee Attack */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Melee Attack
                  </h5>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Dice
                      </label>
                      <input
                        type="number"
                        value={side.attack?.melee?.dice || 0}
                        onChange={(e) => updateAttack(side.id, 'melee', { dice: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Range
                      </label>
                      <input
                        type="number"
                        value={side.attack?.melee?.range || 0}
                        onChange={(e) => updateAttack(side.id, 'melee', { range: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Defense
                      </label>
                      <input
                        type="number"
                        value={side.attack?.melee?.defense || 0}
                        onChange={(e) => updateAttack(side.id, 'melee', { defense: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>
                  
                </div>

                {/* Ranged Attack */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Ranged Attack
                  </h5>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Dice
                      </label>
                      <input
                        type="number"
                        value={side.attack?.ranged?.dice || 0}
                        onChange={(e) => updateAttack(side.id, 'ranged', { dice: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Range
                      </label>
                      <input
                        type="number"
                        value={side.attack?.ranged?.range || 0}
                        onChange={(e) => updateAttack(side.id, 'ranged', { range: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Defense
                      </label>
                      <input
                        type="number"
                        value={side.attack?.ranged?.defense || 0}
                        onChange={(e) => updateAttack(side.id, 'ranged', { defense: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>
                  
                </div>

                {/* Defense */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px',
                  marginTop: '12px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Defense
                  </h5>
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    Defense stats are configured in the Expertises section below.
                  </p>
                </div>
              </div>


              {/* Expertises Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#f9fafb',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #f59e0b'
                }}>
                  🎯 Expertises
                </h4>
                
                {/* Melee Expertise */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <h6 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Melee Expertise
                  </h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Add expertise values and effects for melee attacks
                    </span>
                    <button
                      onClick={() => addExpertise(side.id, 'melee', { value: '', effects: [] })}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {side.attack?.melee?.expertise?.map((exp, expIndex) => (
                    <div key={expIndex} style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <input
                        type="text"
                        value={exp.value}
                        onChange={(e) => {
                          const newExpertise = [...(side.attack?.melee?.expertise || [])];
                          newExpertise[expIndex] = { ...exp, value: e.target.value };
                          updateAttack(side.id, 'melee', { expertise: newExpertise });
                        }}
                        placeholder="Value (e.g., 1-2)"
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                        <GlyphInput
                          value={exp.effects.join(', ')}
                          onChange={(value) => {
                            const newExpertise = [...(side.attack?.melee?.expertise || [])];
                            newExpertise[expIndex] = { ...exp, effects: value.split(',').map(s => s.trim()).filter(s => s) };
                            updateAttack(side.id, 'melee', { expertise: newExpertise });
                          }}
                          onFocus={(inputRef, onChange, currentValue) => handleInputFocus(inputRef, onChange, currentValue)}
                          onBlur={handleInputBlur}
                          placeholder="Effects (e.g., b, a) - Click to select glyphs"
                          style={{
                            flex: 1
                          }}
                        />
                      <button
                        onClick={() => removeExpertise(side.id, 'melee', expIndex)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ranged Expertise */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <h6 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Ranged Expertise
                  </h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Add expertise values and effects for ranged attacks
                    </span>
                    <button
                      onClick={() => addExpertise(side.id, 'ranged', { value: '', effects: [] })}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {side.attack?.ranged?.expertise?.map((exp, expIndex) => (
                    <div key={expIndex} style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <input
                        type="text"
                        value={exp.value}
                        onChange={(e) => {
                          const newExpertise = [...(side.attack?.ranged?.expertise || [])];
                          newExpertise[expIndex] = { ...exp, value: e.target.value };
                          updateAttack(side.id, 'ranged', { expertise: newExpertise });
                        }}
                        placeholder="Value (e.g., 1-2)"
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                        <GlyphInput
                          value={exp.effects.join(', ')}
                          onChange={(value) => {
                            const newExpertise = [...(side.attack?.ranged?.expertise || [])];
                            newExpertise[expIndex] = { ...exp, effects: value.split(',').map(s => s.trim()).filter(s => s) };
                            updateAttack(side.id, 'ranged', { expertise: newExpertise });
                          }}
                          onFocus={(inputRef, onChange, currentValue) => handleInputFocus(inputRef, onChange, currentValue)}
                          onBlur={handleInputBlur}
                          placeholder="Effects (e.g., b, a) - Click to select glyphs"
                          style={{
                            flex: 1
                          }}
                        />
                      <button
                        onClick={() => removeExpertise(side.id, 'ranged', expIndex)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Defense Expertise */}
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  <h6 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Defense Expertise
                  </h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Add expertise values and effects for defense
                    </span>
                    <button
                      onClick={() => addExpertise(side.id, 'defense', { value: '', effects: [] })}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {side.defense?.expertise?.map((exp, expIndex) => (
                    <div key={expIndex} style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <input
                        type="text"
                        value={exp.value}
                        onChange={(e) => {
                          const newExpertise = [...(side.defense?.expertise || [])];
                          newExpertise[expIndex] = { ...exp, value: e.target.value };
                          updateDefense(side.id, { expertise: newExpertise });
                        }}
                        placeholder="Value (e.g., 1-2)"
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          color: '#f9fafb',
                          fontSize: '12px'
                        }}
                      />
                        <GlyphInput
                          value={exp.effects.join(', ')}
                          onChange={(value) => {
                            const newExpertise = [...(side.defense?.expertise || [])];
                            newExpertise[expIndex] = { ...exp, effects: value.split(',').map(s => s.trim()).filter(s => s) };
                            updateDefense(side.id, { expertise: newExpertise });
                          }}
                          onFocus={(inputRef, onChange, currentValue) => handleInputFocus(inputRef, onChange, currentValue)}
                          onBlur={handleInputBlur}
                          placeholder="Effects (e.g., e, f) - Click to select glyphs"
                          style={{
                            flex: 1
                          }}
                        />
                      <button
                        onClick={() => removeExpertise(side.id, 'defense', expIndex)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attack Tree Section */}
              <div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#f9fafb',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #8b5cf6'
                }}>
                  🌳 Attack Tree
                </h4>
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  {/* Tree Layout */}
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#9ca3af',
                      marginBottom: '8px'
                    }}>
                      Layout
                    </h5>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Rows
                        </label>
                        <input
                          type="number"
                          value={side.tree?.layout?.rows || 3}
                          onChange={(e) => {
                            const newLayout = { ...side.tree?.layout, rows: parseInt(e.target.value) || 3 };
                            setFormData(prev => ({
                              ...prev,
                              sides: prev.sides?.map(s => 
                                s.id === side.id 
                                  ? { ...s, tree: { ...s.tree, layout: newLayout } }
                                  : s
                              )
                            }));
                          }}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            backgroundColor: '#374151',
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#f9fafb',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Cols
                        </label>
                        <input
                          type="number"
                          value={side.tree?.layout?.cols || 6}
                          onChange={(e) => {
                            const newLayout = { ...side.tree?.layout, cols: parseInt(e.target.value) || 6 };
                            setFormData(prev => ({
                              ...prev,
                              sides: prev.sides?.map(s => 
                                s.id === side.id 
                                  ? { ...s, tree: { ...s.tree, layout: newLayout } }
                                  : s
                              )
                            }));
                          }}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            backgroundColor: '#374151',
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#f9fafb',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tree Nodes */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        margin: 0
                      }}>
                        Nodes
                      </h5>
                      <button
                        onClick={() => {
                          const nodeId = `N${Object.keys(side.tree?.nodes || {}).length + 1}`;
                          addTreeNode(side.id, nodeId, { row: 1, col: 1, effects: [] });
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Add Node
                      </button>
                    </div>
                    {Object.entries(side.tree?.nodes || {}).map(([nodeId, node]) => (
                      <div key={nodeId} style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#374151',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '40px' }}>
                          {nodeId}
                        </span>
                        <input
                          type="number"
                          value={node.row}
                          onChange={(e) => {
                            const newNode = { ...node, row: parseInt(e.target.value) || 1 };
                            addTreeNode(side.id, nodeId, newNode);
                          }}
                          placeholder="Row"
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            backgroundColor: '#1f2937',
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#f9fafb',
                            fontSize: '12px'
                          }}
                        />
                        <input
                          type="number"
                          value={node.col}
                          onChange={(e) => {
                            const newNode = { ...node, col: parseInt(e.target.value) || 1 };
                            addTreeNode(side.id, nodeId, newNode);
                          }}
                          placeholder="Col"
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            backgroundColor: '#1f2937',
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#f9fafb',
                            fontSize: '12px'
                          }}
                        />
                        <GlyphInput
                          value={node.effects.join(', ')}
                          onChange={(value) => {
                            const newNode = { ...node, effects: value.split(',').map(s => s.trim()).filter(s => s) };
                            addTreeNode(side.id, nodeId, newNode);
                          }}
                          onFocus={(inputRef, onChange, currentValue) => handleInputFocus(inputRef, onChange, currentValue)}
                          onBlur={handleInputBlur}
                          placeholder="Effects (e.g., q, q) - Click to select glyphs"
                          style={{
                            flex: 1,
                            backgroundColor: '#1f2937'
                          }}
                        />
                        <button
                          onClick={() => removeTreeNode(side.id, nodeId)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Tree Edges */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        margin: 0
                      }}>
                        Edges
                      </h5>
                      <button
                        onClick={() => {
                          const from = prompt('From node ID:');
                          const to = prompt('To node ID:');
                          if (from && to) {
                            addTreeEdge(side.id, from, to);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Add Edge
                      </button>
                    </div>
                    {side.tree?.edges?.map((edge, edgeIndex) => (
                      <div key={edgeIndex} style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#374151',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {edge[0]} → {edge[1]}
                        </span>
                        <button
                          onClick={() => removeTreeEdge(side.id, edgeIndex)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glyph Panel */}
      {showGlyphPanel && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#1f2937',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          zIndex: 1001,
          maxWidth: '600px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#f9fafb',
              margin: 0
            }}>
              🎯 Select Glyph
            </h3>
            <button
              onClick={() => setShowGlyphPanel(false)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '8px'
          }}>
            {Object.entries(GLYPHS).map(([name, glyph]) => (
              <button
                key={name}
                onClick={() => handleGlyphClick(name)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '60px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.borderColor = '#4b5563';
                }}
              >
                <Icon
                  name={name as IconName}
                  size={24}
                  style={{
                    color: '#f9fafb',
                    marginBottom: '4px'
                  }}
                />
               <span style={{
                 fontSize: '10px',
                 color: '#9ca3af',
                 textAlign: 'center',
                 lineHeight: 1.2
               }}>
                 {formatGlyphName(name)}
               </span>
                <span style={{
                  fontSize: '8px',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  {glyph}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StanceEditor;
