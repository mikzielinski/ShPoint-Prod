import React from 'react';
import { AbilityType, ABILITY_ICONS } from '../lib/shpoint/abilities/types';

interface AbilityIconProps {
  type: AbilityType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
}

const ABILITY_ICON_CLASSES: Record<AbilityType, string> = {
  Active: 'sp-active',
  Reactive: 'sp-reactive',
  Innate: 'sp-innate',
  Tactic: 'sp-tactic',
  Identity: 'sp-identity'
};

const SIZE_CLASSES = {
  sm: 'sp-icon-sm',
  md: 'sp-icon-md',
  lg: 'sp-icon-lg',
  xl: 'sp-icon-xl'
};

export const AbilityIcon: React.FC<AbilityIconProps> = ({
  type,
  size = 'md',
  className = '',
  title
}) => {
  const iconClass = ABILITY_ICON_CLASSES[type];
  const sizeClass = SIZE_CLASSES[size];
  
  // Fallback symbols if font doesn't work - use simpler Unicode symbols
  const fallbackSymbols: Record<AbilityType, string> = {
    Active: '●',      // Simple circle
    Reactive: '○',    // Empty circle
    Innate: '■',      // Square
    Tactic: '▲',      // Triangle
    Identity: '◆'     // Diamond
  };

  // Use correct Unicode codes from ShatterpointIcons mapping
  const shatterpointSymbols: Record<AbilityType, string> = {
    Active: '\u006A',    // j - sp-active
    Reactive: '\u0069',  // i - sp-reactive
    Innate: '\u006C',    // l - sp-innate
    Tactic: '\u006B',    // k - sp-tactic
    Identity: '\u006D'   // m - sp-identity
  };

  const [fontLoaded, setFontLoaded] = React.useState(false);

  React.useEffect(() => {
    // Check if ShatterpointIcons font is loaded
    if (document.fonts && document.fonts.check) {
      const checkFont = async () => {
        try {
          await document.fonts.load('12px ShatterpointIcons');
          setFontLoaded(document.fonts.check('12px ShatterpointIcons'));
        } catch (error) {
          setFontLoaded(false);
        }
      };
      checkFont();
    } else {
      // Fallback for browsers without font API
      setFontLoaded(false);
    }
  }, []);

  return (
    <span
      className={`sp-icon ${iconClass} ${sizeClass} ${className}`}
      title={title || `${type} Ability`}
      role="img"
      aria-label={`${type} ability icon`}
      style={{ color: 'white', fontSize: '24px' }}
    >
      {/* Force use ShatterpointIcons font */}
      <span style={{ fontFamily: 'ShatterpointIcons', color: 'white' }}>{shatterpointSymbols[type]}</span>
    </span>
  );
};

export default AbilityIcon;
