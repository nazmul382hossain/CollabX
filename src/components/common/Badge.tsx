import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple' | 'yellow' | 'teal';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  children,
  className = '',
  dot = false
}) => {
  const styles = {
    green: 'bg-[#DDF5EA] text-[#0E9F6E] border-[#A7F3D0]',
    blue: 'bg-[#DCE6FB] text-[#0B6BE6] border-[#BFDBFE]',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    red: 'bg-[#FDE3E3] text-[#E53935] border-[#FECACA]',
    gray: 'bg-[#E8EAF0] text-[#4B5563] border-[#E5E7EB]',
    purple: 'bg-[#E9E9FB] text-[#5C54E5] border-[#DDD6FE]',
    yellow: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    teal: 'bg-[#D9F3F0] text-[#0D9488] border-[#99F6E4]'
  };

  const dotColors = {
    green: 'bg-[#0E9F6E]',
    blue: 'bg-[#0B6BE6]',
    amber: 'bg-[#D97706]',
    red: 'bg-[#E53935]',
    gray: 'bg-[#4B5563]',
    purple: 'bg-[#5C54E5]',
    yellow: 'bg-[#B45309]',
    teal: 'bg-[#0D9488]'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
