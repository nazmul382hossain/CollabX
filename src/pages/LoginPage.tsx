import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  Globe,
  AlertCircle,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ASSETS } from '../data/assets';
import { Logo } from '../components/common/Logo';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
  message?: string;
  returnUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  onNavigate,
  message,
  returnUrl: propReturnUrl
}) => {
  const { signInWithSocial } = useAuth();
  const [activeSocialLoading, setActiveSocialLoading] = useState<'Google' | 'GitHub' | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to read query params from URL hash or query string
  const getParams = () => {
    if (typeof window === 'undefined') return { msg: message || '', ret: propReturnUrl || '', isReset: false };
    const hash = window.location.hash || '';
    const queryPart = hash.includes('?') ? hash.split('?')[1] : (window.location.search ? window.location.search.substring(1) : '');
    const params = new URLSearchParams(queryPart);
    const searchParams = new URLSearchParams(window.location.search);
    const isReset = 
      params.get('passwordReset') === '1' || 
      searchParams.get('passwordReset') === '1' || 
      window.location.href.includes('passwordReset=1');
    const msg = isReset ? 'Password changed. Please log in.' : (params.get('message') || message || '');
    const ret = params.get('returnUrl') || propReturnUrl || '';
    return { msg, ret, isReset };
  };

  const [returnUrl, setReturnUrl] = useState(() => getParams().ret);
  const [popupNotice, setPopupNotice] = useState<string | null>(() => {
    const { msg } = getParams();
    return msg || null;
  });
  const [popupNoticeTitle, setPopupNoticeTitle] = useState<string | null>(() => {
    const { isReset } = getParams();
    return isReset ? 'Password Updated' : null;
  });
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(() => {
    const { isReset } = getParams();
    return isReset;
  });
  const [showPopupToast, setShowPopupToast] = useState<boolean>(() => {
    const { msg } = getParams();
    return Boolean(msg);
  });

  // Check for registration success flag, passwordReset=1 return, or password reset action from Gmail link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const mode = searchParams.get('mode') || hashParams.get('mode');
      const resetEmail = searchParams.get('email') || hashParams.get('email');

      const isPasswordResetDone = 
        searchParams.get('passwordReset') === '1' || 
        hashParams.get('passwordReset') === '1' || 
        window.location.href.includes('passwordReset=1');

      if (isPasswordResetDone) {
        setPopupNotice('Password changed. Please log in.');
        setPopupNoticeTitle('Password Updated');
        setIsSuccessToast(true);
        setShowPopupToast(true);
      } else if (mode === 'resetPassword' || searchParams.get('action') === 'resetPassword') {
        if (resetEmail) {
          setEmail(resetEmail);
        }
        setIsForgotPasswordOpen(true);
      }

      const isRegistered = window.location.hash.includes('registered=true');
      const flash = sessionStorage.getItem('collabx_auth_flash');
      if (isRegistered || flash) {
        if (!isPasswordResetDone) {
          setPopupNotice(flash || 'Registration successful! You can now log in with your credentials.');
          setPopupNoticeTitle('Registration Complete');
          setIsSuccessToast(true);
          setShowPopupToast(true);
        }
        sessionStorage.removeItem('collabx_auth_flash');
      } else if (!isPasswordResetDone) {
        const { msg, ret } = getParams();
        if (msg) {
          setPopupNotice(msg);
          setShowPopupToast(true);
        }
        if (ret) {
          setReturnUrl(ret);
        }
      }
    }
  }, [message, propReturnUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Execute strict backend/service authentication check
      const result = await authService.login(email, password);

      if (!result.success || !result.user) {
        setError(result.error || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      // Successful authentication: create authenticated session and redirect
      onLoginSuccess(result.user);
      
      // If there was a returnUrl, ensure user has the appropriate role before navigating
      if (returnUrl && returnUrl !== '/login') {
        const isAdminRoute = returnUrl.startsWith('/admin');
        const isFacultyRoute = returnUrl.startsWith('/researcher') || returnUrl.startsWith('/publish-project');
        if (isAdminRoute && result.user.role !== 'admin') {
          // Non-admins redirected to their appropriate role dashboard by onLoginSuccess
        } else if (isFacultyRoute && result.user.role === 'student') {
          // Students redirected to their dashboard by onLoginSuccess
        } else {
          onNavigate(returnUrl);
        }
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = async (provider: 'Google' | 'GitHub') => {
    setError('');
    setActiveSocialLoading(provider);

    try {
      const result = await signInWithSocial(provider);
      setActiveSocialLoading(null);

      if (!result.success && !result.cancelled) {
        setError(result.error || 'Sign-in failed. Please try again.');
      }
      // Never navigate inside sign-in handler: AuthProvider state machine handles navigation!
    } catch {
      setActiveSocialLoading(null);
      setError('Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white select-none relative">
      {/* Floating Alert / Popup Toast if triggered with please login or password changed */}
      {showPopupToast && popupNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fade-in">
          <div className="bg-[#0B2545] text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isSuccessToast 
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' 
                  : 'bg-[#F05A28]/20 border-[#F05A28]/40 text-[#FF7A45]'
              }`}>
                {isSuccessToast ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#FF7A45]" />
                )}
              </div>
              <div className="text-xs font-semibold leading-tight text-white">
                <span className={`block text-[11px] uppercase tracking-wider font-bold ${
                  isSuccessToast ? 'text-emerald-300' : 'text-[#FFC83D]'
                }`}>
                  {popupNoticeTitle || (isSuccessToast ? 'Success' : 'Authentication Required')}
                </span>
                <span>{popupNotice}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPopupToast(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar: Dark navy, CollabX wordmark on left, search + globe on right */}
      <header className="h-14 sm:h-16 bg-[#0B2545] px-4 sm:px-8 flex items-center justify-between text-white shrink-0 z-30 shadow-xs">
        {/* Left: Collab (white) + X (gold #F5B82E) */}
        <div 
          onClick={() => onNavigate('/')}
          className="flex items-baseline font-bold tracking-tight text-2xl cursor-pointer"
        >
          <span className="text-white font-extrabold">Collab</span>
          <span className="text-[#F5B82E] font-black">X</span>
        </div>

        {/* Right icons: Search, Globe */}
        <div className="flex items-center gap-5 sm:gap-6 text-gray-300">
          <button 
            type="button"
            onClick={() => onNavigate('/projects')}
            className="hover:text-white transition-colors cursor-pointer"
            title="Search projects..."
          >
            <Search className="w-5 h-5 text-gray-200" strokeWidth={2.2} />
          </button>
          
          <button 
            type="button"
            onClick={() => onNavigate('/about')}
            className="hover:text-white transition-colors cursor-pointer"
            title="About CollabX"
          >
            <Globe className="w-5 h-5 text-gray-200" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* Main Split Screen Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        
        {/* Left Half: Pure White Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white">
          <div className="max-w-[400px] w-full space-y-4 text-left">
            
            {/* Centered Brand Logo */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 mb-2">
              <Logo size="md" onClick={() => onNavigate('/')} />
              
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F4B] tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-sm text-gray-500 font-normal">
                Login to your academic account
              </p>
            </div>

            {/* Notice / Information Banner */}
            {popupNotice && (
              <div className="p-3 rounded-lg bg-[#EBF3FF] border border-[#0B6BE6]/30 text-[#0B2A55] text-xs font-semibold flex items-start gap-2.5 animate-fade-in shadow-2xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0B6BE6]" />
                <div className="leading-relaxed">{popupNotice}</div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-lg bg-[#FBE4E4] border border-[#E5393C]/30 text-[#E5393C] text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E5393C]" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            {/* Strict Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
              
              {/* Email Input Group with Person Icon */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-800">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@portcity.edu.bd"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                </div>
              </div>

              {/* Password Input Group with Lock Icon */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password link on right */}
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#1565E8] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Solid GREEN Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0E9F6E] hover:bg-[#0b855c] disabled:bg-gray-400 text-white font-bold text-sm sm:text-base rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Verifying Credentials...' : 'Login'}
              </button>
            </form>

            {/* Don't have an account? Sign Up */}
            <div className="text-center text-xs sm:text-sm text-gray-700 pt-2 font-normal">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-[#1565E8] font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3 pt-1">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider shrink-0">
                or continue with
              </span>
            </div>

            {/* Social Login with Google & GitHub (Stacked, outlined, 1px border, hover lift) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                disabled={activeSocialLoading !== null}
                aria-label="Continue with Google"
                className="w-full h-11 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#1565E8]/40 focus:border-[#1565E8] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {activeSocialLoading === 'Google' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#4285F4] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('GitHub')}
                disabled={activeSocialLoading !== null}
                aria-label="Continue with GitHub"
                className="w-full h-11 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#1565E8]/40 focus:border-[#1565E8] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {activeSocialLoading === 'GitHub' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current text-gray-900 shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Half: 50% width full picture cover */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-[#0B2545]">
          <img 
            src={ASSETS.auth.loginBanner} 
            alt="CollabX Adventure" 
            className="w-full h-full object-cover object-center absolute inset-0"
          />
          {/* Subtle natural vignette shadow */}
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>

      </div>


      {/* Forgot Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => {
          setIsForgotPasswordOpen(false);
        }}
        initialEmail={email}
        onSelectSocialLogin={(provider) => {
          setIsForgotPasswordOpen(false);
          handleSocialAuth(provider);
        }}
      />
    </div>
  );
};
