import React, { useEffect } from 'react';
import { User } from '../../types';
import { LoginPage } from '../../pages/LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  authLoading: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  message?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  currentUser,
  authLoading,
  currentPath,
  onNavigate,
  message = 'Please log in to continue'
}) => {
  // If authentication state is still resolving
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B6BE6] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#0B2A55] tracking-wide animate-pulse">
          Verifying security credentials…
        </p>
      </div>
    );
  }

  // If user is not authenticated, render Login with returnUrl and message
  if (!currentUser) {
    return (
      <LoginPage
        onNavigate={onNavigate}
        onLoginSuccess={(user) => {
          // Return to the protected route requested
          onNavigate(currentPath);
        }}
        message={message}
        returnUrl={currentPath}
      />
    );
  }

  // Authenticated: Render children
  return <>{children}</>;
};
