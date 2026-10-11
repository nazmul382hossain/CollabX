import React from 'react';

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  variant?: 'blue' | 'lavender' | 'mint' | 'pink' | 'peach' | 'light-green' | 'default';
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  icon,
  onRemove,
  onClick,
  className = '',
  variant = 'blue',
  active = false
}) => {
  const variantStyles = {
    blue: active ? 'bg-[#1565E8] text-white border-[#1565E8]' : 'bg-[#DDE5FB] text-[#0B1F4B] border-[#D5DDEB] hover:bg-[#c9d8fb]',
    lavender: active ? 'bg-[#5C54E5] text-white' : 'bg-[#E8E9FB] text-[#0B1F4B] border-[#D5DDEB]',
    mint: active ? 'bg-[#0F9D6B] text-white' : 'bg-[#DDF5EA] text-[#0B1F4B] border-[#D5DDEB]',
    pink: active ? 'bg-[#E5393C] text-white' : 'bg-[#FBE4E4] text-[#0B1F4B] border-[#D5DDEB]',
    peach: active ? 'bg-[#F15A24] text-white' : 'bg-[#FFE9DC] text-[#0B1F4B] border-[#D5DDEB]',
    'light-green': active ? 'bg-[#0F9D6B] text-white' : 'bg-[#E4F2D9] text-[#0B1F4B] border-[#D5DDEB]',
    default: active ? 'bg-[#0B1F4B] text-white' : 'bg-[#E7E9EE] text-[#0B1F4B] border-[#D5DDEB]'
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-red-600 focus:outline-hidden cursor-pointer"
        >
          ×
        </button>
      )}
    </span>
  );
};
