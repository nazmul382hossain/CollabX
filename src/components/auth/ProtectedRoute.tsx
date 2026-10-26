import React from 'react';
import { LoginPage } from '../../pages/LoginPage';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  message?: string;
  currentUser?: User | null;
  authLoading?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  currentPath,
  onNavigate,
  message = 'Please log in to continue'
}) => {
  const { authStatus, currentUser } = useAuth();

  // 1. If authentication state is still resolving
  if (authStatus === 'loading') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#0B2A55] tracking-wide animate-pulse">
          Verifying security credentials…
        </p>
      </div>
    );
  }

  // 2. If user is in needsProfile state:
  // Treated as NOT ready. No dashboard or protected page ever renders.
  // The CompleteVerificationModal is mounted at the app root and overlays the screen.
  if (authStatus === 'needsProfile') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#0B2A55] tracking-wide">
          Academic verification required. Please complete the verification dialog to proceed.
        </p>
      </div>
    );
  }

  // 3. If signed out, render Login
  if (authStatus === 'signedOut' || !currentUser) {
    return (
      <LoginPage
        onNavigate={onNavigate}
        onLoginSuccess={() => {
          onNavigate(currentPath);
        }}
        message={message}
        returnUrl={currentPath}
      />
    );
  }

  // 4. Ready: Render protected children
  return <>{children}</>;
};
