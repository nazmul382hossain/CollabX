import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  onClick,
  showText = true 
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Pokéball Icon: Red top, white bottom, navy divider, gold center */}
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-full bg-[#0B1F4B] p-[1.5px] shadow-sm transition-transform ${onClick ? 'group-hover:scale-105' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#0B1F4B" strokeWidth="4" />
          {/* Red top hemisphere */}
          <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#E5393C" />
          {/* Dark center dividing band */}
          <rect x="2" y="46" width="96" height="8" fill="#0B1F4B" />
          {/* Outer center button */}
          <circle cx="50" cy="50" r="16" fill="#0B1F4B" />
          {/* Inner white button */}
          <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
          {/* Center core */}
          <circle cx="50" cy="50" r="5" fill="#FFFFFF" stroke="#0B1F4B" strokeWidth="2" />
        </svg>
      </div>

      {showText && (
        <div className={`flex items-baseline font-bold tracking-tight ${textSizes[size]}`}>
          <span className="text-[#0B1F4B] font-extrabold">Collab</span>
          <span className="text-[#F5B82E] font-black drop-shadow-xs">X</span>
        </div>
      )}
    </div>
  );
};
