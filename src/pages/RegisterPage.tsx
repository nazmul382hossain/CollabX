import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  Globe,
  IdCard,
  AlertCircle,
  X
} from 'lucide-react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { ASSETS } from '../data/assets';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegistered: () => void;
  onLoginSuccess?: (user: User) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onNavigate, 
  onRegistered,
  onLoginSuccess
}) => {
  const { signInWithSocial } = useAuth();
  const [activeSocialLoading, setActiveSocialLoading] = useState<'Google' | 'GitHub' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');

  const showToast = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live password strength
  const getPasswordStrength = () => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (score === 3) return { label: 'Good', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authService.register({
        name,
        email,
        password,
        confirmPassword,
        role,
        universityId,
        department,
        institution: 'Port City International University'
      });

      if (!result.success) {
        setError(result.error || 'Registration failed. Please review your details.');
        setIsSubmitting(false);
        return;
      }

      // STRICT REQUIREMENT:
      // Show registration success message and redirect the visitor to the Login page.
      // Do NOT create an authenticated session upon registration.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('collabx_auth_flash', 'Account registered successfully! Please log in with your academic credentials.');
      }
      onRegistered();
    } catch {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSocialAuth = async (provider: 'Google' | 'GitHub') => {
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
    <div className="min-h-screen flex flex-col bg-white select-none">
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
        
        {/* Left Half: Registration Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white overflow-y-auto">
          <div className="max-w-[420px] w-full space-y-3.5 text-left py-4">
            
            {/* Centered Brand Logo */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 mb-1">
              <Logo size="md" onClick={() => onNavigate('/')} />
              
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F4B] tracking-tight">
                Create an Account
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-normal">
                Join Port City International University Research Portal
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FBE4E4] border border-[#E5393C]/30 text-[#E5393C] text-xs font-semibold flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E5393C]" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-3 pt-1">
              
              {/* Full Name Input Group */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohammad Nayeem"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                </div>
              </div>

              {/* Academic Email Input Group */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">
                  Academic Email <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@portcity.edu.bd"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                </div>
              </div>

              {/* University ID Input Group */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">
                  University / Student ID <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <IdCard className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={universityId}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                      setUniversityId(clean);
                    }}
                    placeholder="e.g. CSE02807185"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                </div>
              </div>

              {/* Department Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 bg-white focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                >
                  <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                  <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering (EEE)</option>
                  <option value="Natural Sciences & Mathematics">Natural Sciences & Mathematics</option>
                  <option value="Business Administration">Business Administration (BBA)</option>
                </select>
              </div>

              {/* Select Role Radio Group */}
              <div className="space-y-1.5 pt-0.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Academic Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    role === 'student' 
                      ? 'border-[#1565E8] bg-blue-50 text-[#1565E8]' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="registerRole"
                      value="student"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                      className="sr-only"
                    />
                    Student
                  </label>
                  <label className={`flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    role === 'researcher' 
                      ? 'border-[#1565E8] bg-blue-50 text-[#1565E8]' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="registerRole"
                      value="researcher"
                      checked={role === 'researcher'}
                      onChange={() => setRole('researcher')}
                      className="sr-only"
                    />
                    Researcher
                  </label>
                  <label className={`flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    role === 'supervisor' 
                      ? 'border-[#1565E8] bg-blue-50 text-[#1565E8]' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="registerRole"
                      value="supervisor"
                      checked={role === 'supervisor'}
                      onChange={() => setRole('supervisor')}
                      className="sr-only"
                    />
                    Supervisor
                  </label>
                </div>
              </div>

              {/* Password Input Group */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-800">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {strength && (
                    <span className={`text-[10px] font-bold ${strength.text}`}>
                      Strength: {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters (letters & numbers)"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
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

              {/* Confirm Password Input Group */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Solid GREEN Sign Up Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#0E9F6E] hover:bg-[#0b855c] disabled:bg-gray-400 text-white font-bold text-sm sm:text-base rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Creating Account...' : 'Register Account'}
                </button>
              </div>
            </form>

            {/* Already have an account? Login */}
            <div className="text-center text-xs sm:text-sm text-gray-700 pt-2 font-normal">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-[#1565E8] font-bold hover:underline cursor-pointer"
              >
                Log In Here
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3 pt-1">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider shrink-0">
                or continue with
              </span>
            </div>

            {/* Social Registration with Google & GitHub (Stacked, outlined, 1px border, hover lift) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleStartSocialAuth('Google')}
                disabled={activeSocialLoading !== null}
                aria-label="Continue with Google"
                className="w-full h-11 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#1565E8]/40 focus:border-[#1565E8] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {activeSocialLoading === 'Google' ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-[#4285F4] rounded-full animate-spin" />
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
                onClick={() => handleStartSocialAuth('GitHub')}
                disabled={activeSocialLoading !== null}
                aria-label="Continue with GitHub"
                className="w-full h-11 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#1565E8]/40 focus:border-[#1565E8] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {activeSocialLoading === 'GitHub' ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
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
            src={ASSETS.auth.registerBanner || ASSETS.auth.loginBanner} 
            alt="CollabX Research" 
            className="w-full h-full object-cover object-center absolute inset-0"
          />
          {/* Subtle natural vignette shadow */}
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>

      </div>

      {/* Toast Notification for Configuration & Auth Messages */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fade-in pointer-events-auto">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 backdrop-blur-md ${
            toastType === 'error'
              ? 'bg-[#1F1212] text-white border-red-500/40'
              : toastType === 'success'
                ? 'bg-[#0E2A1F] text-white border-emerald-500/40'
                : 'bg-[#0B2545] text-white border-blue-400/30'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toastType === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : toastType === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold leading-tight text-white">
                <span className={`block text-[10px] uppercase font-bold tracking-wider ${
                  toastType === 'error' ? 'text-red-400' : toastType === 'success' ? 'text-emerald-400' : 'text-blue-300'
                }`}>
                  {toastType === 'error' ? 'Notice' : toastType === 'success' ? 'Success' : 'Information'}
                </span>
                <span>{toastMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
