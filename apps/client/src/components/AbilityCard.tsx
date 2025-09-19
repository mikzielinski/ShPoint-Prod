import React from 'react';
import { Ability } from '../lib/shpoint/abilities/types';
import { AbilityIcon } from './AbilityIcon';

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
            {ability.description}
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
