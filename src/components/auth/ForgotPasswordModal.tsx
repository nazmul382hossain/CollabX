import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink,
  Info
} from 'lucide-react';
import { authService } from '../../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialCode?: string;
  initialStep?: string;
  onSuccess?: (email: string, message: string) => void;
  onSelectSocialLogin?: (provider: 'Google' | 'GitHub') => void;
}

type ResetStep = 'email' | 'sent';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSelectSocialLogin
}) => {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSocialOnly, setIsSocialOnly] = useState(false);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) {
        setEmail(initialEmail);
      }
      setStep('email');
      setError(null);
      setResendNotice(null);
      setIsSocialOnly(false);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown countdown timer (60 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Send password reset email via Firebase Authentication
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setResendNotice(null);
    setLoading(true);

    try {
      const result = await authService.requestPasswordReset(cleanEmail);
      if (!result.success) {
        setError(result.error || 'Failed to send reset link. Please check your email and try again.');
        setLoading(false);
        return;
      }

      setIsSocialOnly(Boolean(result.isSocialOnly));
      setResendCooldown(60);
      setStep('sent');
    } catch {
      setError('An unexpected error occurred. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend email handler (with 60-second cooldown enforcement)
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError(null);
    setResendNotice(null);
    setResending(true);

    try {
      const result = await authService.requestPasswordReset(email.trim());
      if (!result.success) {
        setError(result.error || 'Failed to resend reset email. Please try again.');
        setResending(false);
        return;
      }

      setIsSocialOnly(Boolean(result.isSocialOnly));
      setResendCooldown(60);
      setResendNotice('A new password reset email has been dispatched.');
    } catch {
      setError('Could not resend email. Please try again in a few moments.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-[#D5DDEB] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 sm:px-8 pt-7 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              step === 'sent' 
                ? 'bg-[#DDF5EA] text-[#0E9F6E]' 
                : 'bg-blue-100 text-[#0B6BE6]'
            }`}>
              {step === 'sent' ? (
                <CheckCircle2 className="w-5 h-5 text-[#0E9F6E]" />
              ) : (
                <Mail className="w-5 h-5 text-[#0B6BE6]" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#0B2A55] tracking-tight">
                {step === 'email' ? 'Reset Password' : 'Check Your Email'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {step === 'email' 
                  ? 'We will send you a link to reset your password' 
                  : 'Password reset link dispatched via Firebase'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Resend Success Notice */}
          {resendNotice && !error && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendNotice}</span>
            </div>
          )}

          {/* STEP 1: Enter Email Form */}
          {step === 'email' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B2A55] mb-1.5">
                  Your Account Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@institution.edu or name@gmail.com"
                    autoFocus
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#0B6BE6] focus:ring-1 focus:ring-[#0B6BE6] transition-all bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  Enter the email address associated with your CollabX account. We will send a secure password reset link to this address.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-2 py-2.5 px-5 bg-[#0B6BE6] hover:bg-[#0957bd] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending reset link…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Confirmation Screen */}
          {step === 'sent' && (
            <div className="space-y-4">
              {/* Primary Neutral Success Message Box */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-emerald-50/40 border border-blue-200/80 rounded-2xl flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0B6BE6] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5 text-[#0B6BE6]" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B2A55]">
                    Password Reset Link Sent
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    If an account with this email exists and uses a password, a reset link has been sent. Check your Inbox and Spam folder.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Recipient: <strong className="text-[#0B2A55] font-semibold">{email}</strong>
                  </p>
                </div>
              </div>

              {/* Tip if account was created with Google or GitHub (no password provider) */}
              {isSocialOnly && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="leading-relaxed font-medium">
                      If you signed up with Google or GitHub, use that button to log in.
                    </p>
                    {onSelectSocialLogin && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectSocialLogin('Google');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-2xs"
                        >
                          Log in with Google
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectSocialLogin('GitHub');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-2xs"
                        >
                          Log in with GitHub
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sender & Spam Hint */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-700">Hint: </span>
                  <span>The email comes from <strong className="text-gray-800 font-mono text-[11px] bg-gray-200/60 px-1.5 py-0.5 rounded">noreply@collabx-6ee7d.firebaseapp.com</strong> and may be in Spam.</span>
                </div>
              </div>

              {/* Action Buttons: Open Gmail, Resend email, Change email, Back to login */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Open Gmail Button */}
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#0B6BE6] hover:bg-[#0957bd] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Open Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* 2. Resend email button (disabled for 60s cooldown) */}
                <button
                  type="button"
                  disabled={resendCooldown > 0 || resending}
                  onClick={handleResend}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 
                    ? `Resend email (${resendCooldown}s)` 
                    : resending 
                      ? 'Resending email…' 
                      : 'Resend email'}
                </button>

                {/* 3 & 4. Change email & Back to login */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setResendNotice(null);
                      setStep('email');
                    }}
                    className="flex-1 py-2 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer font-medium flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change email</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 text-xs font-bold text-[#0B6BE6] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <span>Back to login</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
