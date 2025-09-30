import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import RichTextEditor from './RichTextEditor';

interface Ability {
  id: string;
  type: 'Active' | 'Reactive' | 'Innate' | 'Tactic' | 'Identity';
  symbol: string;
  name: string;
  description: string;
  forceCost: number;
  damageCost?: number;
  trigger: string;
  isAction: boolean;
  tags: string[];
}

interface AbilitiesEditorProps {
  abilities: Ability[];
  onAbilitiesChange: (abilities: Ability[]) => void;
  characterId?: string;
}

export const AbilitiesEditor: React.FC<AbilitiesEditorProps> = ({
  abilities,
  onAbilitiesChange,
  characterId
}) => {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;

  const [newAbility, setNewAbility] = useState<Ability>({
    id: '',
    type: 'Active',
    symbol: 'j',
    name: '',
    description: '',
    forceCost: 0,
    damageCost: undefined,
    trigger: 'on_activation',
    isAction: false,
    tags: []
  });

  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [showGameSymbols, setShowGameSymbols] = useState(false);

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
    x: "\u0078", // advance
    h: "\u0068", // dash
    i: "\u0069", // reactive
    j: "\u006A", // active
    k: "\u006B", // tactic
    l: "\u006C", // innate
    m: "\u006D", // identify
    g: "\u0067", // ranged (correct)
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
    { symbol: 'g', name: 'Ranged', description: 'Ranged attack', unicode: ICON.g },
    { symbol: 'g', name: 'Range', description: 'Range', unicode: ICON.g },
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
    { symbol: 'x', name: 'Advance', description: 'Advance action', unicode: ICON.x },
    { symbol: 'k', name: 'Tactic', description: 'Tactic action', unicode: ICON.k },
    { symbol: 'l', name: 'Innate', description: 'Innate ability', unicode: ICON.l },
    { symbol: 'i', name: 'Reactive', description: 'Reactive ability', unicode: ICON.i },
    { symbol: 'j', name: 'Active', description: 'Active ability', unicode: ICON.j }
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
    { value: 'start_of_struggle', label: 'Start of Struggle' },
    { value: 'end_of_struggle', label: 'End of Struggle' },
    { value: 'start_of_game', label: 'Start of Game' },
    { value: 'end_of_game', label: 'End of Game' },
    { value: 'gain_control_over_point', label: 'Gain control over point' },
    { value: 'lose_control_over_point', label: 'Lose control over point' },
    { value: 'allied_unit_damaged', label: 'Allied Unit Damaged' },
    { value: 'enemy_unit_damaged', label: 'Enemy Unit Damaged' },
    { value: 'when_unit_wounded', label: 'When unit wounded' },
    { value: 'when_unit_wound', label: 'When unit wound' },
    { value: 'when_this_unit_not_wounded', label: 'When this Unit Not Wounded' },
    { value: 'allied_unit_wounded', label: 'Allied Unit Wounded' },
    { value: 'contest_point', label: 'Contest point' },
    { value: 'passive', label: 'Passive' },
    { value: 'constant', label: 'Constant' }
  ];

  const handleAbilityChange = (field: keyof Ability, value: any) => {
    setNewAbility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to render symbols and formatting in ability descriptions
  const renderAbilityDescription = (description: string) => {
    if (!description) return '';
    
    // Map symbol tags to Unicode characters (same as AbilityCard)
    const symbolMap: Record<string, string> = {
      'force': "\u0076",  // v - sp-force
      'dash': "\u0068",   // h - sp-dash
      'jump': "\u0074",   // t - sp-jump
      'crit': "\u0062",   // b - sp-critical
      'hit': "\u0061",    // a - sp-strike
      'block': "\u0065",  // e - sp-block
      'identify': "\u006D", // m - sp-identify
      'strike': "\u0061", // a - sp-strike
      'hunker': "\u0033", // 3 - sp-hunker
      'ranged': "\u0067", // g - sp-ranged
      'range': "\u0067", // g - sp-range
      'attack-expertise': "\u0063", // c - sp-attack-expertise
      'defense-expertise': "\u0066", // f - sp-defense-expertise
      'reposition': "\u0073", // s - sp-reposition
      'heal': "\u0072", // r - sp-heal
      'durability': "\u0077", // w - sp-durability
      'critical': "\u0062", // b - sp-critical
      'failure': "\u0064", // d - sp-failure
      'melee': "\u006F", // o - sp-melee
      'shove': "\u0070", // p - sp-shove
      'damage': "\u0071", // q - sp-damage
      'pinned': "\u0031", // 1 - sp-pinned
      'exposed': "\u0034", // 4 - sp-exposed
      'strained': "\u0035", // 5 - sp-strained
      'disarm': "\u0039", // 9 - sp-disarm
      'climb': "\u0075", // u - sp-climb
      'advance': "\u0078", // x - sp-advance
      'tactic': "\u006B", // k - sp-tactic
      'innate': "\u006C", // l - sp-innate
      'reactive': "\u0069", // i - sp-reactive
      'active': "\u006A", // j - sp-active
    };

    let result = description;
    
    // Replace faction tags with styled spans
    result = result.replace(/<faction>([^<]+)<\/faction>/g, (match, faction) => {
      return `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid rgba(59, 130, 246, 0.3);">${faction}</span>`;
    });
    
    // Replace unittype tags with styled spans
    result = result.replace(/<unittype>([^<]+)<\/unittype>/g, (match, unitType) => {
      return `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid rgba(16, 185, 129, 0.3);">${unitType}</span>`;
    });
    
    // Replace [[symbol]] tags with actual symbols
    result = result.replace(/\[\[([^\]]+)\]\]/g, (match, symbolName) => {
      const unicode = symbolMap[symbolName.toLowerCase()];
      if (unicode) {
        return `<span style="font-family: 'ShatterpointIcons', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #fbbf24; font-size: 16px;">${unicode}</span>`;
      }
      return match; // Return original if symbol not found
    });
    
    return result;
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
      
      onAbilitiesChange([...abilities, ability]);
      
      setNewAbility({
        id: '',
        type: 'Active',
        symbol: 'j',
        name: '',
        description: '',
        forceCost: 0,
        damageCost: undefined,
        trigger: 'on_activation',
        isAction: false,
        tags: []
      });
    }
  };

  const removeAbility = (abilityId: string) => {
    onAbilitiesChange(abilities.filter(a => a.id !== abilityId));
  };

  const editAbility = (ability: Ability) => {
    setEditingAbility(ability);
    setNewAbility({
      ...ability
    });
  };

  const cancelEditAbility = () => {
    setEditingAbility(null);
    setNewAbility({
      id: '',
      type: 'Active',
      symbol: 'j',
      name: '',
      description: '',
      forceCost: 0,
      damageCost: undefined,
      trigger: 'on_activation',
      isAction: false,
      tags: []
    });
  };

  const updateAbility = () => {
    if (!editingAbility) return;
    
    onAbilitiesChange(abilities.map(a => 
      a.id === editingAbility.id ? newAbility : a
    ));
    
    cancelEditAbility();
  };

  // Kontrola dostępu
  if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>You don't have permission to edit abilities</p>
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
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
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
            
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              marginTop: '16px',
              color: '#d1d5db'
            }}>Damage Cost</label>
            <input
              type="number"
              value={newAbility.damageCost || ''}
              onChange={(e) => handleAbilityChange('damageCost', parseInt(e.target.value) || undefined)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              min="0"
              placeholder="0"
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
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
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
          <RichTextEditor
            value={newAbility.description}
            onChange={(value) => handleAbilityChange('description', value)}
            placeholder="Ability description (use formatting tools above)"
            gameSymbols={gameSymbols}
            onInsertSymbol={insertGameSymbol}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={editingAbility ? updateAbility : addAbility}
            style={{
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6d28d9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#7c3aed';
            }}
          >
            {editingAbility ? 'Update Ability' : 'Add Ability'}
          </button>
          {editingAbility && (
            <button
              onClick={cancelEditAbility}
              style={{
                padding: '8px 16px',
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
          )}
        </div>
      </div>

      {/* Abilities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {abilities.map((ability) => (
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
                <span style={{ 
                  fontFamily: "'ShatterpointIcons', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", 
                  color: '#fbbf24', 
                  fontSize: '16px' 
                }}>
                  {ability.symbol}
                </span>
                <span style={{ fontWeight: '600', color: '#f9fafb' }}>{ability.name}</span>
                {ability.forceCost > 0 && (
                  <span style={{ color: '#fbbf24' }}>Force: {ability.forceCost}</span>
                )}
                {ability.damageCost && ability.damageCost > 0 && (
                  <span style={{ color: '#ef4444' }}>Damage: {ability.damageCost}</span>
                )}
              </div>
              <p 
                style={{
                  color: '#d1d5db',
                  fontSize: '14px',
                  margin: 0
                }}
                dangerouslySetInnerHTML={{ __html: renderAbilityDescription(ability.description) }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => editAbility(ability)}
                style={{
                  color: '#60a5fa',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#93c5fd';
                  e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                  e.currentTarget.style.background = 'none';
                }}
              >
                Edit
              </button>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbilitiesEditor;
