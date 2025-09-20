import React from 'react';
import { Ability } from '../lib/shpoint/abilities/types';
import { AbilityIcon } from './AbilityIcon';

// Map symbols [[token]] -> Unicode character from ShatterpointIcons font
// Using ASCII characters as defined in icons.css and shatterpoint-icons.css
const GLYPH_MAP: Record<string, string> = {
  force: "\u0076",  // v - sp-force
  dash: "\u0068",   // h - sp-dash
  jump: "\u0074",   // t - sp-jump
  crit: "\u0062",   // b - sp-critical
  hit: "\u0061",    // a - sp-strike
  block: "\u0065",  // e - sp-block
  identify: "\u006D", // m - sp-identify
  strike: "\u0061", // a - sp-strike
  hunker: "\u0033", // 3 - sp-hunker
  ranged: "\u006E", // n - sp-ranged
  "attack-expertise": "\u0063", // c - sp-attack-expertise
  "defense-expertise": "\u0066", // f - sp-defense-expertise
  reposition: "\u0073", // s - sp-reposition
  heal: "\u0072", // r - sp-heal
  durability: "\u0077", // w - sp-durability
  critical: "\u0062", // b - sp-critical
  failure: "\u0064", // d - sp-failure
  melee: "\u006F", // o - sp-melee
  shove: "\u0070", // p - sp-shove
  damage: "\u0071", // q - sp-damage
  pinned: "\u0031", // 1 - sp-pinned
  exposed: "\u0034", // 4 - sp-exposed
  strained: "\u0035", // 5 - sp-strained
  disarm: "\u0039", // 9 - sp-disarm
  climb: "\u0075", // u - sp-climb
  tactic: "\u006B", // k - sp-tactic
  innate: "\u006C", // l - sp-innate
  reactive: "\u0069", // i - sp-reactive
  active: "\u006A", // j - sp-active
};

function renderWithGlyphs(text?: string) {
  if (!text) return null;
  const re = /\[\[([^[\]]+)\]\]/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[1].trim().toLowerCase();
    const g = GLYPH_MAP[token];
    out.push(
      g ? (
        <span
          key={`${m.index}-${token}`}
          title={token}
          className="sp"
          style={{
            fontSize: "1.1em",
            margin: "0 2px",
            color: "#fbbf24"
          }}
        >
          {g}
        </span>
      ) : (
        m[0]
      )
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface AbilityCardProps {
  ability: Ability;
  size?: 'sm' | 'md' | 'lg';
  showForceCost?: boolean;
  showTrigger?: boolean;
  className?: string;
}

export const AbilityCard: React.FC<AbilityCardProps> = ({
  ability,
  size = 'md',
  showForceCost = true,
  showTrigger = false,
  className = ''
}) => {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';
  
    return (
      <div 
        className={`ability-card ${sizeClass} ${className}`} 
        style={{ 
          marginBottom: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '4px',
          padding: '4px',
          margin: '0 0 4px 0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.border = '1px solid transparent';
        }}
      >
        {/* Rząd: Ikona typu + Nazwa + Koszt Force - w jednej linii */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          {/* Ikona typu umiejętności */}
          <AbilityIcon
            type={ability.type}
            size="md"
            title={`${ability.type} Ability`}
            className="text-white"
          />
          
          {/* Nazwa umiejętności + Koszt Force */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
            <h4 style={{ fontWeight: 'bold', color: 'white', fontSize: '16px', margin: 0 }}>
              {ability.name}
            </h4>
            
            {/* Koszt Force - jeśli jest */}
            {showForceCost && ability.forceCost > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {Array.from({ length: ability.forceCost }, (_, i) => (
                  <span 
                    key={i}
                    className="text-white"
                    style={{ 
                      fontFamily: 'ShatterpointIcons, monospace',
                      fontSize: '18px'
                    }}
                  >
                    {"\u0076"} {/* Force glyph - v - sp-force */}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Opis umiejętności - pod spodem w osobnej linii */}
        <div style={{ marginLeft: '32px' }}>
          <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            {renderWithGlyphs(ability.description)}
          </p>
        </div>
      
      {/* Tags (jeśli są) - ukryte */}
      {false && ability.tags && ability.tags.length > 0 && (
        <div className="ml-6 mt-1">
          <div className="flex flex-wrap gap-1">
            {ability.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AbilityCard;
