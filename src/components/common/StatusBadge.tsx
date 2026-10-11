import React from 'react';

export type StatusType = 
  | 'pending' 
  | 'accepted' 
  | 'approved' 
  | 'active' 
  | 'open' 
  | 'rejected' 
  | 'completed' 
  | 'draft' 
  | 'inactive'
  | 'reviewing';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '',
  dot = true
}) => {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-[#E7E9EE] text-[#4B5563] border-[#D5DDEB]';
  let dotColor = 'bg-[#4B5563]';
  let label = status;

  if (normalized === 'pending' || normalized === 'reviewing') {
    styles = 'bg-[#FFC857]/30 text-[#B45309] border-[#FFC857]/60';
    dotColor = 'bg-[#B45309]';
  } else if (normalized === 'accepted' || normalized === 'approved' || normalized === 'active') {
    styles = 'bg-[#DDF5EA] text-[#0F9D6B] border-[#0F9D6B]/30';
    dotColor = 'bg-[#0F9D6B]';
  } else if (normalized === 'open') {
    styles = 'bg-[#E1ECFB] text-[#1565E8] border-[#1565E8]/30';
    dotColor = 'bg-[#1565E8]';
  } else if (normalized === 'rejected' || normalized === 'inactive') {
    styles = 'bg-[#FBE4E4] text-[#E5393C] border-[#E5393C]/30';
    dotColor = 'bg-[#E5393C]';
  } else if (normalized === 'completed') {
    styles = 'bg-[#E8E9FB] text-[#5C54E5] border-[#5C54E5]/30';
    dotColor = 'bg-[#5C54E5]';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span className="capitalize">{label}</span>
    </span>
  );
};
