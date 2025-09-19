import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface Ability {
  id: string;
  type: 'Active' | 'Reactive' | 'Innate' | 'Tactic' | 'Identity';
  symbol: string;
  name: string;
  description: string;
  forceCost: number;
  trigger: string;
  isAction: boolean;
  tags: string[];
}

interface Character {
  id: string;
  name: string;
  characterNames?: string;
  boxSetCode?: string;
  portrait?: string;
  squad_points: number;
  point_cost?: number;
  force: number;
  unit_type: 'Primary' | 'Secondary' | 'Support';
  stamina: number;
  durability: number;
  number_of_characters?: number;
  factions: string[];
  period: string[];
  abilities: any[];
  structuredAbilities: Ability[];
}

interface CharacterEditorProps {
  character?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
  onDelete?: (characterId: string) => void;
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  character,
  onSave,
  onCancel,
  onDelete
}) => {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const [formData, setFormData] = useState<Character>({
    id: '',
    name: '',
    characterNames: '',
    boxSetCode: '',
    portrait: '',
    squad_points: 0,
    point_cost: 0,
    force: 0,
    unit_type: 'Primary',
    stamina: 0,
    durability: 0,
    number_of_characters: 1,
    factions: [],
    period: [],
    abilities: [],
    structuredAbilities: []
  });

  const [newAbility, setNewAbility] = useState<Ability>({
    id: '',
    type: 'Active',
    symbol: 'j',
    name: '',
    description: '',
    forceCost: 0,
    trigger: 'on_activation',
    isAction: false,
    tags: []
  });

  const [newFaction, setNewFaction] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [showGameSymbols, setShowGameSymbols] = useState(false);

  const availableFactions = [
    'Galactic Republic',
    'Separatist', 
    'Galactic Empire',
    'Rebel Alliance',
    'Mandalorian',
    'Jedi',
    'Sith',
    'Force User',
    'Clone Trooper',
    'Droid',
    'Scoundrel',
    'Bounty Hunter',
    'Inquisitorius',
    'Nightsister',
    'Nightbrother'
  ];

  const availablePeriods = [
    'The fall of the Jedi',
    'The reign of the Empire', 
    'The Age of Rebellion',
    'The New Republic'
  ];

  const availableTriggers = [
    { value: 'on_activation', label: 'On activation' },
    { value: 'on_attack', label: 'On attack' },
    { value: 'on_defend', label: 'On defend' },
    { value: 'on_damage', label: 'On damage' },
    { value: 'on_death', label: 'On death' },
    { value: 'on_force_spend', label: 'On force spend' },
    { value: 'on_move', label: 'On move' },
    { value: 'on_ability_use', label: 'On ability use' },
    { value: 'passive', label: 'Passive' },
    { value: 'constant', label: 'Constant' }
  ];

  // Mapowanie symboli zgodnie z StanceCard.tsx
  const ICON: Record<string, string> = {
    "1": "\u0031", // pinned
    "3": "\u0033", // hunker
    "4": "\u0034", // exposed
    "5": "\u0035", // strained
    "8": "\u0038", // unit
    "9": "\u0039", // disarm
    a: "\u0061", // strike
    b: "\u0062", // critical
    c: "\u0063", // attack expertise
    d: "\u0064", // failure
    e: "\u0065", // block
    f: "\u0066", // defense expertise
    h: "\u0068", // dash
    i: "\u0069", // reactive
    j: "\u006A", // active
    k: "\u006B", // tactic
    l: "\u006C", // innate
    m: "\u006D", // identify
    n: "\u006E", // ranged
    o: "\u006F", // melee
    p: "\u0070", // shove
    q: "\u0071", // damage
    r: "\u0072", // heal
    s: "\u0073", // reposition
    t: "\u0074", // jump
    u: "\u0075", // climb
    v: "\u0076", // force
    w: "\u0077", // durability
  };

  const gameSymbols = [
    { symbol: 't', name: 'Jump', description: 'Jump action', unicode: ICON.t },
    { symbol: 'm', name: 'Identify', description: 'Identify action', unicode: ICON.m },
    { symbol: 'a', name: 'Strike', description: 'Strike action', unicode: ICON.a },
    { symbol: 'e', name: 'Block', description: 'Block result', unicode: ICON.e },
    { symbol: '3', name: 'Hunker', description: 'Hunker action', unicode: ICON["3"] },
    { symbol: 'n', name: 'Ranged', description: 'Ranged attack', unicode: ICON.n },
    { symbol: 'v', name: 'Force', description: 'Force point', unicode: ICON.v },
    { symbol: 'c', name: 'Attack Expertise', description: 'Attack expertise die', unicode: ICON.c },
    { symbol: 'f', name: 'Defense Expertise', description: 'Defense expertise die', unicode: ICON.f },
    { symbol: 's', name: 'Reposition', description: 'Reposition action', unicode: ICON.s },
    { symbol: 'r', name: 'Heal', description: 'Heal action', unicode: ICON.r },
    { symbol: 'w', name: 'Durability', description: 'Durability stat', unicode: ICON.w },
    { symbol: 'b', name: 'Critical', description: 'Critical hit', unicode: ICON.b },
    { symbol: 'd', name: 'Failure', description: 'Failure result', unicode: ICON.d },
    { symbol: 'h', name: 'Dash', description: 'Dash action', unicode: ICON.h },
    { symbol: 'o', name: 'Melee', description: 'Melee attack', unicode: ICON.o },
    { symbol: 'p', name: 'Shove', description: 'Shove action', unicode: ICON.p },
    { symbol: 'q', name: 'Damage', description: 'Damage result', unicode: ICON.q },
    { symbol: '1', name: 'Pinned', description: 'Pinned condition', unicode: ICON["1"] },
    { symbol: '4', name: 'Exposed', description: 'Exposed condition', unicode: ICON["4"] },
    { symbol: '5', name: 'Strained', description: 'Strained condition', unicode: ICON["5"] },
    { symbol: '9', name: 'Disarm', description: 'Disarm condition', unicode: ICON["9"] },
    { symbol: 'u', name: 'Climb', description: 'Climb action', unicode: ICON.u },
    { symbol: 'k', name: 'Tactic', description: 'Tactic action', unicode: ICON.k },
    { symbol: 'l', name: 'Innate', description: 'Innate ability', unicode: ICON.l },
    { symbol: 'i', name: 'Reactive', description: 'Reactive ability', unicode: ICON.i },
    { symbol: 'j', name: 'Active', description: 'Active ability', unicode: ICON.j }
  ];

  useEffect(() => {
    if (character) {
      setFormData({
        ...character,
        factions: character.factions || [],
        period: character.period || [],
        abilities: character.abilities || [],
        structuredAbilities: character.structuredAbilities || []
      });
    }
  }, [character]);

  const handleInputChange = (field: keyof Character, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAbilityChange = (field: keyof Ability, value: any) => {
    setNewAbility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const insertGameSymbol = (symbol: string, name: string, unicode: string) => {
    const symbolText = `[[${name.toLowerCase().replace(/\s+/g, '-')}]]`;
    setNewAbility(prev => ({
      ...prev,
      description: prev.description + symbolText
    }));
  };

  const addAbility = () => {
    if (newAbility.name.trim()) {
      const ability: Ability = {
        ...newAbility,
        id: newAbility.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
      };
      
      setFormData(prev => ({
        ...prev,
        structuredAbilities: [...(prev.structuredAbilities || []), ability]
      }));
      
      setNewAbility({
        id: '',
        type: 'Active',
        symbol: 'j',
        name: '',
        description: '',
        forceCost: 0,
        trigger: 'on_activation',
        isAction: false,
        tags: []
      });
    }
  };

  const removeAbility = (abilityId: string) => {
    setFormData(prev => ({
      ...prev,
      structuredAbilities: (prev.structuredAbilities || []).filter(a => a.id !== abilityId)
    }));
  };

  const addFaction = () => {
    if (newFaction.trim() && !(formData.factions || []).includes(newFaction.trim())) {
      setFormData(prev => ({
        ...prev,
        factions: [...(prev.factions || []), newFaction.trim()]
      }));
      setNewFaction('');
    }
  };

  const removeFaction = (faction: string) => {
    setFormData(prev => ({
      ...prev,
      factions: (prev.factions || []).filter(f => f !== faction)
    }));
  };

  const addPeriod = () => {
    if (newPeriod.trim() && !(formData.period || []).includes(newPeriod.trim())) {
      setFormData(prev => ({
        ...prev,
        period: [...(prev.period || []), newPeriod.trim()]
      }));
      setNewPeriod('');
    }
  };

  const removePeriod = (period: string) => {
    setFormData(prev => ({
      ...prev,
      period: (prev.period || []).filter(p => p !== period)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Character name is required');
      return;
    }
    onSave(formData);
  };

  const handleDelete = () => {
    if (character && onDelete && window.confirm('Are you sure you want to delete this character?')) {
      onDelete(character.id);
    }
  };

  // Kontrola dostępu
  if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>You don't have permission to edit characters</p>
      </div>
    );
  }

  // Zabezpieczenie przed undefined formData
  if (!formData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '896px',
      margin: '0 auto',
      padding: '24px',
      background: '#111827',
      color: '#f9fafb'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#f9fafb'
      }}>
        {character ? 'Edit Character' : 'Add New Character'}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Basic Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f9fafb'
          }}>Basic Information</h3>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Character Name(s)</label>
            <input
              type="text"
              value={formData.characterNames || ''}
              onChange={(e) => handleInputChange('characterNames', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              placeholder="e.g. Ahsoka Tano"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Card Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                handleInputChange('name', newName);
                // Auto-generate ID from card name
                const generatedId = newName.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/^-+|-+$/g, '');
                handleInputChange('id', generatedId);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              placeholder="e.g. Ahsoka Tano Fulcrum"
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Box Set Code</label>
            <input
              type="text"
              value={formData.boxSetCode || ''}
              onChange={(e) => handleInputChange('boxSetCode', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              placeholder="e.g. COR-001, SEP-002"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Portrait</label>
            
            {/* Wyświetl istniejący obrazek jeśli istnieje */}
            {formData.portrait && (
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={formData.portrait}
                  alt="Character portrait"
                  style={{
                    maxWidth: '120px',
                    maxHeight: '120px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
            
            {/* Upload i URL */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      handleInputChange('portrait', event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{
                  flex: '1',
                  padding: '8px 12px',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
              />
              <input
                type="url"
                value={formData.portrait || ''}
                onChange={(e) => handleInputChange('portrait', e.target.value)}
                style={{
                  flex: '1',
                  padding: '8px 12px',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                placeholder="Or paste URL..."
              />
            </div>
            
            {/* Przycisk usunięcia obrazka */}
            {formData.portrait && (
              <button
                type="button"
                onClick={() => handleInputChange('portrait', '')}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                Remove Image
              </button>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Unit Type</label>
            <select
              value={formData.unit_type}
              onChange={(e) => handleInputChange('unit_type', e.target.value)}
              className="select"
              style={{ width: '100%' }}
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #374151'
          }}>Statistics</h3>
          
          {/* Dynamic SP/PC field based on unit type */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>
              {formData.unit_type === 'Primary' ? 'Squad Points (SP)' : 'Point Cost (PC)'}
            </label>
            <input
              type="number"
              value={formData.unit_type === 'Primary' ? formData.squad_points : formData.point_cost}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (formData.unit_type === 'Primary') {
                  handleInputChange('squad_points', value);
                } else {
                  handleInputChange('point_cost', value);
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="0"
              placeholder={formData.unit_type === 'Primary' ? 'SP value' : 'PC value'}
            />
          </div>

          {/* Number of Characters */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Number of Characters in Unit</label>
            <input
              type="number"
              value={formData.number_of_characters || 1}
              onChange={(e) => handleInputChange('number_of_characters', parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="1"
              placeholder="Number of characters"
            />
          </div>

          {/* Force */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Force</label>
            <input
              type="number"
              value={formData.force}
              onChange={(e) => handleInputChange('force', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="0"
              placeholder="Force points"
            />
          </div>

          {/* Stamina */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Stamina</label>
            <input
              type="number"
              value={formData.stamina}
              onChange={(e) => handleInputChange('stamina', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="0"
              placeholder="Stamina points"
            />
          </div>

          {/* Durability */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Durability</label>
            <input
              type="number"
              value={formData.durability}
              onChange={(e) => handleInputChange('durability', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="0"
              placeholder="Durability points"
            />
          </div>
        </div>
      </div>

      {/* Factions */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f9fafb'
        }}>Factions</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            value={newFaction}
            onChange={(e) => setNewFaction(e.target.value)}
            className="select"
            style={{ flex: '1' }}
          >
            <option value="">Select a faction</option>
            {availableFactions
              .filter(faction => !(formData.factions || []).includes(faction))
              .map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))
            }
          </select>
          <button
            onClick={addFaction}
            disabled={!newFaction}
            style={{
              padding: '8px 16px',
              background: newFaction ? '#3b82f6' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: newFaction ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (newFaction) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (newFaction) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(formData.factions || []).map((faction, index) => (
            <span
              key={index}
              style={{
                padding: '4px 12px',
                background: '#3b82f6',
                borderRadius: '9999px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white'
              }}
            >
              {faction}
              <button
                onClick={() => removeFaction(faction)}
                style={{
                  color: '#93c5fd',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '16px',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#93c5fd';
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Periods */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f9fafb'
        }}>Periods</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            value={newPeriod}
            onChange={(e) => setNewPeriod(e.target.value)}
            className="select"
            style={{ flex: '1' }}
          >
            <option value="">Select a period</option>
            {availablePeriods
              .filter(period => !(formData.period || []).includes(period))
              .map(period => (
                <option key={period} value={period}>{period}</option>
              ))
            }
          </select>
          <button
            onClick={addPeriod}
            disabled={!newPeriod}
            style={{
              padding: '8px 16px',
              background: newPeriod ? '#16a34a' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: newPeriod ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (newPeriod) {
                e.currentTarget.style.background = '#15803d';
              }
            }}
            onMouseLeave={(e) => {
              if (newPeriod) {
                e.currentTarget.style.background = '#16a34a';
              }
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(formData.period || []).map((period, index) => (
            <span
              key={index}
              style={{
                padding: '4px 12px',
                background: '#16a34a',
                borderRadius: '9999px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white'
              }}
            >
              {period}
              <button
                onClick={() => removePeriod(period)}
                style={{
                  color: '#86efac',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '16px',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#86efac';
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Abilities */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f9fafb'
        }}>Abilities</h3>
        
        {/* Add New Ability */}
        <div style={{
          background: '#1f2937',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#d1d5db'
              }}>Type</label>
              <select
                value={newAbility.type}
                onChange={(e) => handleAbilityChange('type', e.target.value)}
                className="select"
                style={{ width: '100%' }}
              >
                <option value="Active">Active</option>
                <option value="Reactive">Reactive</option>
                <option value="Innate">Innate</option>
                <option value="Tactic">Tactic</option>
                <option value="Identity">Identity</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#d1d5db'
              }}>Name</label>
              <input
                type="text"
                value={newAbility.name}
                onChange={(e) => handleAbilityChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                placeholder="Ability name"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#d1d5db'
              }}>Force Cost</label>
              <input
                type="number"
                value={newAbility.forceCost}
                onChange={(e) => handleAbilityChange('forceCost', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                min="0"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#d1d5db'
              }}>Trigger</label>
              <select
                value={newAbility.trigger}
                onChange={(e) => handleAbilityChange('trigger', e.target.value)}
                className="select"
                style={{ width: '100%' }}
              >
                {availableTriggers.map(trigger => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Game Symbols Panel */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setShowGameSymbols(!showGameSymbols)}
              style={{
                padding: '8px 16px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: showGameSymbols ? '12px' : '0',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6d28d9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#7c3aed';
              }}
            >
              {showGameSymbols ? '▼ Hide' : '▶ Show'} Game Symbols
            </button>
            
            {showGameSymbols && (
              <div style={{
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginBottom: '8px'
                }}>
                  Click a symbol to insert it into the description:
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '8px'
                }}>
                  {gameSymbols.map((gameSymbol, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertGameSymbol(gameSymbol.symbol, gameSymbol.name, gameSymbol.unicode)}
                      style={{
                        padding: '8px',
                        background: '#4b5563',
                        border: '1px solid #6b7280',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#6b7280';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#4b5563';
                      }}
                      title={gameSymbol.description}
                    >
                      <span 
                        style={{
                          fontFamily: 'ShatterpointIcons, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                          fontSize: '20px',
                          color: '#fbbf24'
                        }}
                      >
                        {gameSymbol.unicode}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#d1d5db',
                        textAlign: 'center'
                      }}>
                        {gameSymbol.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#d1d5db'
            }}>Description</label>
            <textarea
              value={newAbility.description}
              onChange={(e) => handleAbilityChange('description', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                minHeight: '80px'
              }}
              rows={3}
              placeholder="Ability description (use Game Symbols above to insert [[symbol]] tags)"
            />
          </div>

          <button
            onClick={addAbility}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6d28d9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#7c3aed';
            }}
          >
            Add Ability
          </button>
        </div>

        {/* Abilities List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(formData.structuredAbilities || []).map((ability) => (
            <div key={ability.id} style={{
              background: '#1f2937',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: '1' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ color: '#60a5fa' }}>[{ability.type}]</span>
                  <span style={{ fontWeight: '600', color: '#f9fafb' }}>{ability.name}</span>
                  {ability.forceCost > 0 && (
                    <span style={{ color: '#fbbf24' }}>Force: {ability.forceCost}</span>
                  )}
                </div>
                <p style={{
                  color: '#d1d5db',
                  fontSize: '14px',
                  margin: 0
                }}>{ability.description}</p>
              </div>
              <button
                onClick={() => removeAbility(ability.id)}
                style={{
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fca5a5';
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.background = 'none';
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        gap: '16px'
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#16a34a';
          }}
        >
          {character ? 'Save Changes' : 'Add Character'}
        </button>
        
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6b7280';
          }}
        >
          Cancel
        </button>

        {character && onDelete && (
          <button
            onClick={handleDelete}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
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
            Delete Character
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterEditor;
