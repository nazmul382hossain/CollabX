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
  if (!currentUser) {
    return null;
  }

  const isAllowed = allowedRoles.includes(currentUser.role);

  useEffect(() => {
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
  }, [isAllowed, currentUser.role, onNavigate, onAccessDenied]);

  // Prevent any flash of the forbidden page content
  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};
