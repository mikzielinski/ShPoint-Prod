import React from 'react';

interface ShPointLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const ShPointLogo: React.FC<ShPointLogoProps> = ({ 
  size = 32, 
  className = "",
  showText = true 
}) => {
  return (
    <div className={`shpoint-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Logo Image */}
      <img
        src="/images/shapointLogo.png"
        alt="ShPoint Logo"
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)' // Make logo white to match theme
        }}
        className="logo-icon"
      />
      
      {/* Text */}
      {showText && (
        <span className="logo-text" style={{ 
          fontSize: `${size * 0.6}px`, 
          fontWeight: 'bold',
          color: 'currentColor'
        }}>
          ShPoint
        </span>
      )}
    </div>
  );
};

export default ShPointLogo;
