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
  advance: "\u0078", // x - advance
  // Combo Glyphs
  crit_to_fail: "\u0062\u2192\u0064", // b → d (Crit -> Fail)
};

// Helper function to render text with placeholders
function renderTextWithPlaceholders(
  text: string, 
  boldMatches: Array<{match: string, content: string, index: number}>,
  italicMatches: Array<{match: string, content: string, index: number}>,
  factionMatches: Array<{match: string, faction: string, index: number}>,
  unitTypeMatches: Array<{match: string, unitType: string, index: number}>
): React.ReactNode[] {
  const parts = text.split(/(__BOLD_\d+__|__ITALIC_\d+__|__FACTION_\d+__|__UNITTYPE_\d+__)/);
  return parts.map((part, index) => {
    if (part.startsWith('__BOLD_') && part.endsWith('__')) {
      const boldIndex = parseInt(part.replace('__BOLD_', '').replace('__', ''));
      const boldMatch = boldMatches[boldIndex];
      if (boldMatch) {
        return <strong key={`bold-${boldIndex}-${index}`}>{boldMatch.content}</strong>;
      }
    }
    if (part.startsWith('__ITALIC_') && part.endsWith('__')) {
      const italicIndex = parseInt(part.replace('__ITALIC_', '').replace('__', ''));
      const italicMatch = italicMatches[italicIndex];
      if (italicMatch) {
        return <em key={`italic-${italicIndex}-${index}`}>{italicMatch.content}</em>;
      }
    }
    if (part.startsWith('__FACTION_') && part.endsWith('__')) {
      const factionIndex = parseInt(part.replace('__FACTION_', '').replace('__', ''));
      const factionMatch = factionMatches[factionIndex];
      if (factionMatch) {
        return (
          <span
            key={`faction-${factionIndex}-${index}`}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              margin: '0 2px'
            }}
          >
            {factionMatch.faction}
          </span>
        );
      }
    }
    
    if (part.startsWith('__UNITTYPE_') && part.endsWith('__')) {
      const unitTypeIndex = parseInt(part.replace('__UNITTYPE_', '').replace('__', ''));
      const unitTypeMatch = unitTypeMatches[unitTypeIndex];
      if (unitTypeMatch) {
        return (
          <span
            key={`unittype-${unitTypeIndex}-${index}`}
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              margin: '0 2px'
            }}
          >
            {unitTypeMatch.unitType}
          </span>
        );
      }
    }
    return part;
  });
}

function renderWithGlyphs(text?: string) {
  if (!text) return null;
  
  // First, handle bold and italic tags
  let processedText = text;
  
  // Handle <b> tags
  const boldMatches: Array<{match: string, content: string, index: number}> = [];
  const boldRegex = /<b>([^<]+)<\/b>/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    boldMatches.push({
      match: boldMatch[0],
      content: boldMatch[1],
      index: boldMatch.index
    });
  }
  
  // Handle <i> tags
  const italicMatches: Array<{match: string, content: string, index: number}> = [];
  const italicRegex = /<i>([^<]+)<\/i>/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    italicMatches.push({
      match: italicMatch[0],
      content: italicMatch[1],
      index: italicMatch.index
    });
  }
  
  // Replace bold and italic tags with placeholders
  boldMatches.forEach((boldMatch, i) => {
    processedText = processedText.replace(boldMatch.match, `__BOLD_${i}__`);
  });
  
  italicMatches.forEach((italicMatch, i) => {
    processedText = processedText.replace(italicMatch.match, `__ITALIC_${i}__`);
  });
  
  // Then handle faction tags
  const factionRegex = /<faction>([^<]+)<\/faction>/g;
  const factionMatches: Array<{match: string, faction: string, index: number}> = [];
  let match;
  while ((match = factionRegex.exec(processedText)) !== null) {
    factionMatches.push({
      match: match[0],
      faction: match[1],
      index: match.index
    });
  }
  
  // Replace faction tags with placeholders
  factionMatches.forEach((factionMatch, i) => {
    processedText = processedText.replace(factionMatch.match, `__FACTION_${i}__`);
  });
  
  // Then handle unittype tags
  const unitTypeRegex = /<unittype>([^<]+)<\/unittype>/g;
  const unitTypeMatches: Array<{match: string, unitType: string, index: number}> = [];
  let unitTypeMatch;
  while ((unitTypeMatch = unitTypeRegex.exec(processedText)) !== null) {
    unitTypeMatches.push({
      match: unitTypeMatch[0],
      unitType: unitTypeMatch[1],
      index: unitTypeMatch.index
    });
  }
  
  // Replace unittype tags with placeholders
  unitTypeMatches.forEach((unitTypeMatch, i) => {
    processedText = processedText.replace(unitTypeMatch.match, `__UNITTYPE_${i}__`);
  });
  
  // Then handle glyphs
  const re = /\[\[([^[\]]+)\]\]/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(processedText))) {
    if (m.index > last) {
      const textPart = processedText.slice(last, m.index);
      // Use helper function to render text with all placeholders
      const renderedParts = renderTextWithPlaceholders(textPart, boldMatches, italicMatches, factionMatches, unitTypeMatches);
      out.push(...renderedParts);
    }
    
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
  
  // Handle remaining text
  if (last < processedText.length) {
    const remainingText = processedText.slice(last);
    const renderedParts = renderTextWithPlaceholders(remainingText, boldMatches, italicMatches, factionMatches, unitTypeMatches);
    out.push(...renderedParts);
  }
  
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
