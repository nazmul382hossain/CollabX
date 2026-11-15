import React, { useEffect } from 'react';
import { User, UserRole } from '../../types';

interface RoleRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  allowedRoles: UserRole[];
  onNavigate: (path: string) => void;
  onAccessDenied?: () => void;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  currentUser,
  allowedRoles,
  onNavigate,
  onAccessDenied
}) => {
  const isAllowed = currentUser ? allowedRoles.includes(currentUser.role) : false;

  useEffect(() => {
    if (!currentUser) return;
    if (!isAllowed) {
      if (onAccessDenied) {
        onAccessDenied();
      } else {
        // Dispatch global access denied toast event
        window.dispatchEvent(
          new CustomEvent('collabx_toast', {
            detail: {
              message: "You don't have access to that page",
              type: 'error',
              title: 'Access Restricted'
            }
          })
        );
      }

      // Instant redirect to the user's role-specific dashboard
      const targetDashboard =
        currentUser.role === 'admin'
          ? '/admin'
          : currentUser.role === 'supervisor' || currentUser.role === 'researcher'
            ? '/researcher'
            : '/dashboard';

      onNavigate(targetDashboard);
    }
  }, [isAllowed, currentUser, onNavigate, onAccessDenied]);

  if (!currentUser || !isAllowed) {
    return null;
  }

  return <>{children}</>;
};
