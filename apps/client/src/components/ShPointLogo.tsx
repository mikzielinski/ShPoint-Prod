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
      {/* Logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-icon"
      >
        {/* Outer circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Inner design - Shatterpoint inspired */}
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Center point */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="currentColor"
        />
        
        {/* Shatter lines */}
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="95"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="5"
          y1="50"
          x2="95"
          y2="50"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="20"
          y1="20"
          x2="80"
          y2="80"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="80"
          y1="20"
          x2="20"
          y2="80"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      
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
