import React from 'react';
import { User, UserRole } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

interface RoleRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  allowedRoles: UserRole[];
  onNavigate: (path: string) => void;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  currentUser,
  allowedRoles,
  onNavigate
}) => {
  if (!currentUser) {
    return null;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    const roleTitles = allowedRoles.map(r => r.toUpperCase()).join(' or ');
    return (
      <div className="bg-white rounded-3xl border border-[#D5DDEB] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-16 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#FBE4E4] text-[#E5393C] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0B1F4B]">Access Restricted</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          This portal section requires <span className="font-bold text-[#0B1F4B]">{roleTitles}</span> privileges. 
          Your account is currently registered as <span className="font-bold text-[#1565E8] capitalize">{currentUser.role}</span>.
        </p>
        <div className="pt-3 flex justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (currentUser.role === 'admin') onNavigate('/admin');
              else if (currentUser.role === 'supervisor' || currentUser.role === 'researcher') onNavigate('/researcher');
              else onNavigate('/dashboard');
            }}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to My Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
