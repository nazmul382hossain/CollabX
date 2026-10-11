import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { authService } from '../services/authService';

interface AuthActionPageProps {
  onNavigate: (path: string) => void;
}

/**
 * ============================================================================
 * CollabX Custom Firebase Auth Action Handler Page (/auth-action)
 * ============================================================================
 * NOTE: Keep this component in the project for future use!
 * When you publish CollabX to your custom domain (e.g., https://mycollabxapp.com),
 * you can route Firebase directly to this custom in-app page by:
 * 1. Adding a route in App.tsx: 
 *    case '/auth-action': return <AuthActionPage onNavigate={handleNavigate} />;
 * 2. Setting Firebase Console > Authentication > Templates > Password Reset >
 *    Custom Action URL to: https://mycollabxapp.com/#/auth-action
 * 
 * Until then, Firebase's hosted page handles the password reset form and then
 * redirects back to CollabX via actionCodeSettings: window.location.origin + '/#/login?passwordReset=1'.
 * ============================================================================
 */
export const AuthActionPage: React.FC<AuthActionPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>('');
  const [actionCode, setActionCode] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Password reset form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const parseParams = () => {
      if (typeof window === 'undefined') return { code: '', action: '' };
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);

      const code = searchParams.get('oobCode') || hashParams.get('oobCode') || searchParams.get('code') || hashParams.get('code') || '';
      const action = searchParams.get('mode') || hashParams.get('mode') || 'resetPassword';

      return { code, action };
    };

    const { code, action } = parseParams();
    setMode(action);
    setActionCode(code);

    if (!code) {
      setVerifyError('No action code found in the reset URL. Please request a new link.');
      setLoading(false);
      return;
    }

    if (action === 'resetPassword') {
      authService.verifyPasswordResetCode(code).then((result) => {
        if (result.success && result.email) {
          setVerifiedEmail(result.email);
        } else {
          setVerifyError(result.error || 'The reset link is invalid or has expired.');
        }
        setLoading(false);
      }).catch(() => {
        setVerifyError('Failed to verify reset link. Please check your network connection.');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      setSubmitError('Password does not meet the minimum security requirements.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await authService.confirmPasswordReset(actionCode, newPassword);
      if (result.success) {
        setSuccess(true);
      } else {
        setSubmitError(result.error || 'Failed to reset password. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B2545]/5 via-white to-gray-50 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#D5DDEB] shadow-2xl overflow-hidden animate-fade-in">
        {/* Top Header */}
        <div className="bg-[#0B2545] p-6 text-center text-white relative">
          <div className="flex items-baseline justify-center font-bold tracking-tight text-2xl mb-1">
            <span className="text-white">Collab</span>
            <span className="text-[#F5B82E]">X</span>
          </div>
          <p className="text-xs text-blue-200/80 font-medium">Academic Research Collaboration Portal</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0B6BE6] animate-spin" />
              <p className="text-sm font-semibold text-gray-700">Verifying secure action link…</p>
            </div>
          )}

          {/* Verification Error State */}
          {!loading && verifyError && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Link Invalid or Expired</h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{verifyError}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2.5 px-4 bg-[#0B6BE6] hover:bg-[#0957bd] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success State */}
          {!loading && success && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Password Changed Successfully</h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Your CollabX account password has been updated. You can now log in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/login?passwordReset=1')}
                className="w-full py-2.5 px-4 bg-[#0B6BE6] hover:bg-[#0957bd] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Password Reset Form */}
          {!loading && !verifyError && !success && mode === 'resetPassword' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0B6BE6]" />
                  <h3 className="text-base font-bold text-[#0B2545]">Create New Password</h3>
                </div>
                {verifiedEmail && (
                  <p className="text-xs text-gray-500">
                    Resetting password for: <strong className="text-gray-800 font-semibold">{verifiedEmail}</strong>
                  </p>
                )}
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B2545] mb-1.5">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-800 focus:outline-hidden focus:border-[#0B6BE6] focus:ring-1 focus:ring-[#0B6BE6] transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B2545] mb-1.5">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-800 focus:outline-hidden focus:border-[#0B6BE6] focus:ring-1 focus:ring-[#0B6BE6] transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Password Criteria checklist */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                    <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpperCase && hasLowerCase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                    <span className={hasUpperCase && hasLowerCase ? 'text-emerald-700 font-semibold' : ''}>Uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                    <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>At least one numeric digit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                    <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : ''}>Passwords match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !passwordsMatch || !hasMinLength}
                  className="w-full py-2.5 px-4 bg-[#0B6BE6] hover:bg-[#0957bd] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
