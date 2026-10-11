import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Microscope, 
  Briefcase,
  User as UserIcon,
  Mail,
  Building,
  IdCard,
  Lock,
  AlertCircle
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { 
  createSocialUserProfile, 
  cancelSocialAuth, 
  SocialAuthProfileData 
} from '../../services/firebaseAuth';

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'Google' | 'GitHub' | null;
  profileData?: SocialAuthProfileData | null;
  onSuccess: (user: User) => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  profileData,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);
  const [photoURL, setPhotoURL] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [selectedDepartment, setSelectedDepartment] = useState('Computer Science and Engineering');
  const [universityId, setUniversityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill user data strictly from official provider payload
  useEffect(() => {
    if (isOpen && profileData) {
      setError('');
      setIsSubmitting(false);

      const provName = profileData.displayName || '';
      const provEmail = profileData.email || '';
      const provPhoto = profileData.photoURL || '';

      setName(provName);
      setEmail(provEmail);
      setIsEmailReadOnly(Boolean(provEmail));
      setPhotoURL(provPhoto);
      setSelectedRole('student');
      setSelectedDepartment('Computer Science and Engineering');
      setUniversityId('');
    }
  }, [isOpen, profileData]);

  if (!isOpen || !provider || !profileData) return null;

  // Compute live avatar for the user
  const getAvatarUrl = () => {
    if (photoURL) return photoURL;
    return selectedRole === 'supervisor'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
      : selectedRole === 'researcher'
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  };

  const handleClose = async () => {
    // If user closes without completing profile, sign out so no half-created account remains
    await cancelSocialAuth();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please provide your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid academic email address.');
      return;
    }

    // Role security check: Admin is never allowed to be chosen from client
    if ((selectedRole as string) === 'admin') {
      setError('Administrator role cannot be self-assigned.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = await createSocialUserProfile({
        uid: profileData.uid,
        name: cleanName,
        email: cleanEmail,
        photoURL: getAvatarUrl(),
        role: selectedRole,
        department: selectedDepartment,
        institution: 'Port City International University',
        universityId: universityId.trim() || undefined,
        authProvider: provider
      });

      setIsSubmitting(false);
      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to complete profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 my-8">
        
        {/* Header with Provider Branding */}
        <div className={`px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b ${
          provider === 'Google' ? 'bg-[#F8FAFC]' : 'bg-[#0D1117] text-white'
        }`}>
          <div className="flex items-center gap-3">
            {provider === 'Google' ? (
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`font-bold text-base leading-tight ${provider === 'Google' ? 'text-[#0B2A55]' : 'text-white'}`}>
                Complete Your Profile
              </h3>
              <p className={`text-xs ${provider === 'Google' ? 'text-gray-500' : 'text-gray-400'}`}>
                Authenticated via {provider} • Select your academic role & department
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              provider === 'Google' ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{error}</div>
            </div>
          )}

          {/* Profile Card Preview */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3.5">
            <img 
              src={getAvatarUrl()} 
              alt="Avatar Preview" 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0 bg-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-[#0B2A55] truncate">
                {name || `${provider} User`}
              </div>
              <div className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                <span>{email || 'No email provided'}</span>
                {isEmailReadOnly && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <Check className="w-2.5 h-2.5" /> Verified by {provider}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-blue-600 font-medium truncate mt-0.5 capitalize">
                {selectedRole} • {selectedDepartment}
              </div>
            </div>
          </div>

          {/* User Fields */}
          <div className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  Academic Email <span className="text-red-500">*</span>
                </label>
                {isEmailReadOnly ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Verified by {provider}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-medium">
                    Private on {provider} — please enter
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  readOnly={isEmailReadOnly}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={provider === 'Google' ? 'user@gmail.com' : 'user@domain.com'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden ${
                    isEmailReadOnly 
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600' 
                      : 'border-gray-300 focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8]'
                  }`}
                />
              </div>
              {!isEmailReadOnly && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Your {provider} account has a private email. Please enter your academic email to link your account.
                </p>
              )}
            </div>

            {/* Role Selection (Student / Researcher / Supervisor - ADMIN IS NEVER SELECTABLE) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-gray-700">
                Select Academic Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'researcher', label: 'Researcher', icon: Microscope },
                  { id: 'supervisor', label: 'Supervisor', icon: Briefcase }
                ].map(r => {
                  const Icon = r.icon;
                  const isChecked = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id as UserRole)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isChecked
                          ? 'border-[#1565E8] bg-[#1565E8]/10 text-[#1565E8] font-bold ring-1 ring-[#1565E8]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isChecked ? 'text-[#1565E8]' : 'text-gray-400'}`} />
                      <span className="text-xs">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-800 bg-white focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8]"
                >
                  <option value="Computer Science and Engineering">Computer Science & Engineering</option>
                  <option value="Electrical and Electronic Engineering">Electrical & Electronic Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="English & Humanities">English & Humanities</option>
                  <option value="Law & Justice">Law & Justice</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                </select>
              </div>
            </div>

            {/* Institution (Read-Only) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Institution
              </label>
              <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600 font-semibold flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span>Port City International University</span>
              </div>
            </div>

            {/* University ID (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Student / University ID (Optional)
              </label>
              <div className="relative flex items-center">
                <IdCard className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder="e.g. CSE-2022-0489"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1565E8] focus:ring-1 focus:ring-[#1565E8]"
                />
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-[#0E9F6E] hover:bg-[#0b855c] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Access Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
