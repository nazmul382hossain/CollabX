import React from 'react';

interface PikachuMascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  speechBubbleText?: string;
}

export const PikachuMascot: React.FC<PikachuMascotProps> = ({ 
  className = '', 
  size = 'md',
  speechBubbleText
}) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      {speechBubbleText && (
        <div className="absolute -top-10 -left-6 bg-white px-3 py-1 rounded-xl shadow-md border border-[#E3EAF3] text-xs font-semibold text-[#0B2A55] whitespace-nowrap animate-bounce">
          {speechBubbleText}
          <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-white border-b border-r border-[#E3EAF3] rotate-45 transform" />
        </div>
      )}
      
      {/* Illustrated Cheerful Mascot SVG */}
      <svg 
        className={`${sizeMap[size]} drop-shadow-md hover:scale-105 transition-transform duration-300`} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Ear */}
        <path d="M32 46C26 25 18 10 12 14C6 18 18 35 25 49Z" fill="#FFD23F" stroke="#0B2A55" strokeWidth="2.5" />
        <path d="M12 14C15 12 21 18 24 24L18 28Z" fill="#1E293B" />
        
        {/* Right Ear (Waving direction) */}
        <path d="M88 46C94 25 102 10 108 14C114 18 102 35 95 49Z" fill="#FFD23F" stroke="#0B2A55" strokeWidth="2.5" />
        <path d="M108 14C105 12 99 18 96 24L102 28Z" fill="#1E293B" />

        {/* Head and Body */}
        <circle cx="60" cy="65" r="38" fill="#FFD23F" stroke="#0B2A55" strokeWidth="2.5" />
        
        {/* Rosy Cheeks */}
        <circle cx="34" cy="74" r="8" fill="#E53935" opacity="0.88" />
        <circle cx="86" cy="74" r="8" fill="#E53935" opacity="0.88" />
        
        {/* Big Curious Eyes */}
        <circle cx="46" cy="60" r="6" fill="#1E293B" />
        <circle cx="44.5" cy="58.5" r="2.2" fill="#FFFFFF" />
        
        <circle cx="74" cy="60" r="6" fill="#1E293B" />
        <circle cx="72.5" cy="58.5" r="2.2" fill="#FFFFFF" />

        {/* Nose */}
        <polygon points="60,67 58,70 62,70" fill="#1E293B" />

        {/* Happy Open Smile */}
        <path d="M53 74C56 78 64 78 67 74C65 82 55 82 53 74Z" fill="#E53935" stroke="#0B2A55" strokeWidth="1.5" />
        <path d="M56 77C58 79 62 79 64 77" fill="#F472B6" />

        {/* Waving Paw Right */}
        <g className="origin-bottom-left animate-[spin_3s_ease-in-out_infinite]">
          <path d="M96 66C104 60 112 62 110 70C108 76 98 76 94 72Z" fill="#FFD23F" stroke="#0B2A55" strokeWidth="2.5" />
        </g>

        {/* Left Little Paw */}
        <path d="M24 72C20 74 20 80 26 80C30 80 32 76 28 72Z" fill="#FFD23F" stroke="#0B2A55" strokeWidth="2" />
        
        {/* Sparkle highlights */}
        <circle cx="70" cy="40" r="2" fill="#FFFFFF" />
        <circle cx="50" cy="38" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
