import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'yellow' | 'orange' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  pill?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  pill = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs sm:text-sm',
    lg: 'px-6 py-3.5 text-sm sm:text-base'
  };

  const variantStyles = {
    primary: 'bg-[#1565E8] hover:bg-[#0f52bf] text-white shadow-xs hover:shadow-md border border-transparent',
    outline: 'bg-transparent hover:bg-[#DDE5FB]/50 text-[#1565E8] border border-[#1565E8]',
    yellow: 'bg-[#FFC83D] hover:bg-[#f0ba32] text-[#0B1F4B] font-bold shadow-xs hover:shadow-md border border-transparent',
    orange: 'bg-[#F15A24] hover:bg-[#d64a18] text-white font-bold shadow-xs hover:shadow-md border border-transparent',
    success: 'bg-[#0F9D6B] hover:bg-[#0c7c54] text-white font-bold shadow-xs hover:shadow-md border border-transparent',
    danger: 'bg-[#E5393C] hover:bg-[#c92f32] text-white font-bold shadow-xs hover:shadow-md border border-transparent',
    ghost: 'bg-transparent hover:bg-gray-100 text-[#0B1F4B] border border-transparent'
  };

  const radiusStyle = pill ? 'rounded-full' : 'rounded-[10px]';

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${radiusStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
