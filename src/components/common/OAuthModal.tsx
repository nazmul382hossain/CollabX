import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Microscope, 
  Briefcase,
  Building,
  IdCard,
  Pencil,
  ChevronDown
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
  returningUser?: User | null;
  initialRole?: UserRole;
  initialDepartment?: string;
  initialUniversityId?: string;
  onSuccess: (user: User) => void;
}

type ModalStep = 'processing' | 'profile-reveal' | 'verification';

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  profileData,
  returningUser,
  initialRole = 'student',
  initialDepartment = 'Computer Science & Engineering',
  initialUniversityId = '',
  onSuccess
}) => {
  // Step state: processing (3 stages, 700ms each) -> profile-reveal (96px photo, ~1s) -> verification (new role modal matching screenshot)
  const [step, setStep] = useState<ModalStep>('processing');
  const [processingStage, setProcessingStage] = useState<number>(0);

  // User profile state
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [imgError, setImgError] = useState(false);
  const [activeProfile, setActiveProfile] = useState<SocialAuthProfileData | null>(null);

  // Fallback email state for GitHub if user.email was null
  const [manualEmail, setManualEmail] = useState('');
  const [emailFormError, setEmailFormError] = useState('');

  // Role verification form state
  const safeInitialRole: UserRole = (initialRole === 'supervisor' || initialRole === 'researcher') 
    ? initialRole 
    : 'student';

  const [selectedRole, setSelectedRole] = useState<UserRole>(safeInitialRole);
  const [selectedDepartment, setSelectedDepartment] = useState(
    initialDepartment || 'Computer Science & Engineering'
  );
  
  // Role-specific fields
  const [studentId, setStudentId] = useState(initialUniversityId || '');
  const [researcherId, setResearcherId] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [designation, setDesignation] = useState('Lecturer');

  // Touched state for live inline validation
  const [studentIdTouched, setStudentIdTouched] = useState(false);
  const [facultyIdTouched, setFacultyIdTouched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Compute initials fallback
  const getInitials = (displayName?: string | null, emailAddress?: string | null) => {
    if (displayName && displayName.trim()) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (emailAddress && emailAddress.includes('@')) {
      return emailAddress.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsSubmitting(false);
      setImgError(false);
      setManualEmail('');
      setEmailFormError('');
      setProcessingStage(0);
      setStep('processing');
      setIsEditingName(false);

      // Populate user info from profileData or returningUser
      if (profileData) {
        setActiveProfile(profileData);
        const displayName = profileData.displayName || 'Academic Scholar';
        setName(displayName);
        setEditedName(displayName);
        setEmail(profileData.email || '');
        let pUrl = profileData.photoURL || '';
        if (pUrl && provider === 'Google') {
          pUrl = pUrl.replace('=s96-c', '=s400-c');
        }
        setPhotoURL(pUrl);
      } else if (returningUser) {
        setName(returningUser.name);
        setEditedName(returningUser.name);
        setEmail(returningUser.email);
        setPhotoURL(returningUser.avatar || '');
      }

      if (initialRole && (initialRole === 'supervisor' || initialRole === 'researcher' || initialRole === 'student')) {
        setSelectedRole(initialRole);
      }
      if (initialDepartment) {
        setSelectedDepartment(initialDepartment);
      }
      if (initialUniversityId) {
        setStudentId(initialUniversityId);
      }
    }
  }, [isOpen, profileData, returningUser, initialRole, initialDepartment, initialUniversityId, provider]);

  // Handle sequential processing stages: ~700ms each
  // Stage 0: "Connecting to Google/GitHub..."
  // Stage 1: "Fetching your profile..."
  // Stage 2: "Preparing your workspace..."
  useEffect(() => {
    if (!isOpen || step !== 'processing') return;

    const t1 = setTimeout(() => {
      setProcessingStage(1);
    }, 700);

    const t2 = setTimeout(() => {
      setProcessingStage(2);
    }, 1400);

    const t3 = setTimeout(() => {
      if (returningUser && returningUser.verified === true) {
        // Returning verified user: skip modal and go straight to dashboard
        onSuccess(returningUser);
        onClose();
      } else {
        // Reveal profile picture
        setStep('profile-reveal');
      }
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, step, returningUser, onSuccess, onClose]);

  // Profile Picture Reveal:
  // If email is present, keep card visible for about 1 second (1000ms), then automatically transition to verification modal.
  useEffect(() => {
    if (!isOpen || step !== 'profile-reveal') return;

    if (email) {
      const timer = setTimeout(() => {
        setStep('verification');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, email]);

  if (!isOpen || !provider) return null;

  // Validation rules: only capital letters and numbers without spacing
  const studentIdRegex = /^[A-Z0-9]{3,25}$/;
  const isStudentIdValid = studentIdRegex.test(studentId.trim()) && /\d/.test(studentId.trim());
  const isFacultyIdValid = /^[A-Z0-9]{3,25}$/.test(facultyId.trim());

  const isFormValid = () => {
    if (!selectedDepartment) return false;
    if (selectedRole === 'student') {
      return isStudentIdValid;
    }
    if (selectedRole === 'supervisor') {
      return isFacultyIdValid && designation.trim().length > 0;
    }
    // Researcher: ID and ORCID are optional
    return true;
  };

  // Handle GitHub email submit if user.email was null
  const handleConfirmGitHubEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailFormError('Please enter a valid official email address.');
      return;
    }
    setEmail(clean);
    setEmailFormError('');
    setStep('verification');
  };

  const handleClose = async () => {
    if (activeProfile) {
      await cancelSocialAuth().catch(() => {});
    }
    onClose();
  };

  // Triggered when user submits the verification form
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Trigger touched state
    if (selectedRole === 'student' && !isStudentIdValid) {
      setStudentIdTouched(true);
      return;
    }
    if (selectedRole === 'supervisor' && !isFacultyIdValid) {
      setFacultyIdTouched(true);
      return;
    }

    // Role security check: Admin is strictly disallowed from client
    if ((selectedRole as string) === 'admin') {
      setError('Administrator role cannot be self-assigned. Contact systems administration.');
      return;
    }

    const cleanEmail = (email || manualEmail).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('A valid official academic email address is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanName = (name || 'Academic Scholar').trim();
      const uid = activeProfile?.uid || `oauth-${provider.toLowerCase()}-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const effectiveId = selectedRole === 'student'
        ? studentId.trim()
        : selectedRole === 'supervisor'
          ? facultyId.trim()
          : (researcherId.trim() || undefined);

      const newUser = await createSocialUserProfile({
        uid,
        name: cleanName,
        email: cleanEmail,
        photoURL: photoURL || undefined,
        role: selectedRole,
        department: selectedDepartment,
        institution: 'Port City International University',
        studentId: effectiveId,
        universityId: effectiveId,
        authProvider: provider
      });

      setIsSubmitting(false);
      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || `Failed to complete verification with ${provider}. Please try again.`);
    }
  };

  const roleOptions: { 
    id: UserRole; 
    title: string; 
    subtitle: string; 
    icon: React.ComponentType<{ className?: string }> 
  }[] = [
    {
      id: 'student',
      title: 'Student Scholar',
      subtitle: 'Undergraduate / Graduate Student Researcher',
      icon: GraduationCap
    },
    {
      id: 'researcher',
      title: 'Academic Researcher',
      subtitle: 'Research Fellow / ML Engineer / Assistant',
      icon: Microscope
    },
    {
      id: 'supervisor',
      title: 'Faculty Supervisor',
      subtitle: 'Professor / Academic Mentor / Project Lead',
      icon: Briefcase
    }
  ];

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'student': return 'Student Scholar';
      case 'researcher': return 'Academic Researcher';
      case 'supervisor': return 'Faculty Supervisor';
      default: return 'Student Scholar';
    }
  };

  // Stage text for processing screen
  const processingText = processingStage === 0
    ? `Connecting to ${provider}...`
    : processingStage === 1
      ? 'Fetching your profile...'
      : 'Preparing your workspace...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      
      {/* ========================================================================= */}
      {/* 1) PROCESSING SCREEN                                                      */}
      {/* ========================================================================= */}
      {step === 'processing' && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-10 text-center max-w-md w-full space-y-6 animate-fade-in">
          {/* Centered Provider Logo */}
          <div className="w-16 h-16 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-md border border-blue-900/30">
            {provider === 'Google' ? (
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-xl text-[#0B2545] tracking-tight">
              {processingText}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Port City International University Portal
            </p>
          </div>

          {/* Animated Progress Indicator */}
          <div className="space-y-2.5 max-w-xs mx-auto pt-1">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-linear-to-r from-[#1D5FE8] to-[#0B2545] transition-all duration-500 ease-out"
                style={{ width: processingStage === 0 ? '33%' : processingStage === 1 ? '66%' : '100%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span className={processingStage >= 0 ? 'text-[#1D5FE8]' : ''}>1. Authenticate</span>
              <span className={processingStage >= 1 ? 'text-[#1D5FE8]' : ''}>2. Profile</span>
              <span className={processingStage >= 2 ? 'text-[#1D5FE8]' : ''}>3. Workspace</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2) PROFILE PICTURE REVEAL                                                 */}
      {/* ========================================================================= */}
      {step === 'profile-reveal' && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-10 text-center max-w-md w-full space-y-5 animate-fade-in">
          
          {/* 96px Profile Picture with smooth fade/scale-in */}
          <div className="relative mx-auto w-24 h-24">
            {photoURL && !imgError ? (
              <img 
                src={photoURL} 
                alt={name || 'User Profile'}
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white ring-2 ring-blue-100 mx-auto transition-all duration-500 scale-100 animate-in fade-in zoom-in-90"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-linear-to-tr from-[#0B2545] to-[#1D5FE8] text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white ring-2 ring-blue-100 mx-auto animate-in fade-in zoom-in-90 duration-500">
                {getInitials(name, email)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-xl text-[#0B2545] tracking-tight">
              {name || 'Academic Scholar'}
            </h3>
            {email ? (
              <p className="text-xs text-gray-500 font-medium">
                {email}
              </p>
            ) : null}
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8F0] border border-[#A7F3D0] text-[#059669] text-xs font-semibold shadow-2xs">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Verified by {provider}
            </span>
          </div>

          {!email && (
            <form onSubmit={handleConfirmGitHubEmail} className="pt-3 space-y-3 text-left border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enter Your Official Academic Email <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Your GitHub email is private. Please provide your institutional or official email to continue.
                </p>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => {
                    setManualEmail(e.target.value);
                    setEmailFormError('');
                  }}
                  placeholder="e.g. name@portcity.edu.bd or @gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#1D5FE8] focus:ring-1 focus:ring-[#1D5FE8]"
                />
                {emailFormError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {emailFormError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1D5FE8] hover:bg-[#1550c7] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Role Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {email && (
            <p className="text-[11px] text-gray-400 font-medium animate-pulse">
              Opening academic verification...
            </p>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3) NEW COMPLETE ACADEMIC VERIFICATION POP UP (MATCHING SCREENSHOT)        */}
      {/* ========================================================================= */}
      {step === 'verification' && (
        <div className="bg-white rounded-[24px] max-w-[540px] w-full shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5 animate-fade-in my-6">
          
          {/* PROFILE HEADER (Light blue rounded box) */}
          <div className="bg-[#EEF5FF] border border-[#BFDBFE] rounded-[18px] p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Circular avatar 56px */}
              <div className="relative shrink-0">
                {photoURL && !imgError ? (
                  <img
                    src={photoURL}
                    alt={name || 'User Avatar'}
                    onError={() => setImgError(true)}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs bg-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-linear-to-tr from-[#0B2545] to-[#1D5FE8] text-white flex items-center justify-center font-bold text-base ring-2 ring-white shadow-xs">
                    {getInitials(name, email)}
                  </div>
                )}
              </div>

              {/* User details */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editedName.trim()) setName(editedName.trim());
                            setIsEditingName(false);
                          }
                          if (e.key === 'Escape') {
                            setEditedName(name);
                            setIsEditingName(false);
                          }
                        }}
                        autoFocus
                        className="text-sm font-bold text-slate-900 bg-white border border-blue-400 rounded-md px-1.5 py-0.5 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editedName.trim()) setName(editedName.trim());
                          setIsEditingName(false);
                        }}
                        className="text-xs text-blue-600 font-bold px-1 hover:underline cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-slate-900 text-base leading-tight tracking-tight truncate">
                        {name || 'Academic Scholar'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        title="Edit display name"
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 inline-block" />
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  {email || manualEmail}
                </div>

                {/* Live Preview Line: <Selected Role> • <Selected Department> */}
                <div className="text-xs font-semibold text-[#1D5FE8] truncate max-w-[240px] sm:max-w-[280px] mt-1">
                  {getRoleDisplayName(selectedRole)} • {selectedDepartment}
                </div>
              </div>
            </div>

            {/* Verified badge */}
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F8F0] border border-[#A7F3D0] text-[#059669] text-xs font-semibold shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Verified by {provider}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* SECTION 1: 1. SELECT ACADEMIC ROLE * */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  1. SELECT ACADEMIC ROLE <span className="text-red-500">*</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Choose Researcher, Supervisor, or Student
                </span>
              </div>

              {/* Three role cards */}
              <div 
                role="radiogroup" 
                aria-label="Select Academic Role" 
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {roleOptions.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;

                  return (
                    <div
                      key={r.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedRole(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setSelectedRole(r.id);
                        }
                      }}
                      className={`rounded-2xl p-3.5 text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[128px] focus:outline-hidden ${
                        isSelected
                          ? 'border-2 border-[#1D5FE8] bg-[#F0F6FF] shadow-2xs'
                          : 'border border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Top icon and check badge */}
                      <div className="flex items-start justify-between w-full">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#1D5FE8] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#1D5FE8] text-white flex items-center justify-center text-xs shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Title & subtitle */}
                      <div>
                        <div className={`font-bold text-xs sm:text-sm mt-2.5 leading-snug ${
                          isSelected ? 'text-slate-900' : 'text-slate-800'
                        }`}>
                          {r.title}
                        </div>
                        <div className={`text-[10px] sm:text-[11px] mt-1 leading-tight ${
                          isSelected ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {r.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 w-full my-3" />

            {/* SECTION 2: 2. ACADEMIC VERIFICATION DETAILS */}
            <div className="space-y-3.5">
              <span className="block text-xs font-bold tracking-wider text-slate-800 uppercase">
                2. ACADEMIC VERIFICATION DETAILS
              </span>

              {/* Academic Department Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Academic Department <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#1D5FE8] focus-within:ring-1 focus-within:ring-[#1D5FE8]">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 bg-transparent rounded-xl appearance-none cursor-pointer focus:outline-hidden"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="English">English</option>
                    <option value="Law">Law</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3 pointer-events-none stroke-[2.5]" />
                </div>
              </div>

              {/* Dynamic ID & Fields based on role */}
              {selectedRole === 'student' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">
                      Institutional ID
                    </span>
                  </div>

                  <div className={`relative flex items-center rounded-xl border transition-all ${
                    studentIdTouched && !isStudentIdValid
                      ? 'border-red-500 bg-red-50/10 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                      : 'border-slate-200 bg-white focus-within:border-[#1D5FE8] focus-within:ring-1 focus-within:ring-[#1D5FE8]'
                  }`}>
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => {
                        const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                        setStudentId(clean);
                        setStudentIdTouched(true);
                      }}
                      onBlur={() => setStudentIdTouched(true)}
                      placeholder="e.g. CSE02807185"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden"
                    />
                  </div>

                  {studentIdTouched && !isStudentIdValid && (
                    <p className="text-xs text-red-500 font-normal mt-1.5">
                      Only capital letters and numbers without spaces allowed (e.g. CSE02807185)
                    </p>
                  )}
                </div>
              )}

              {selectedRole === 'researcher' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Researcher / Institutional ID
                    </label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#1D5FE8] focus-within:ring-1 focus-within:ring-[#1D5FE8]">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={researcherId}
                        onChange={(e) => {
                          const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                          setResearcherId(clean);
                        }}
                        placeholder="e.g. RES2024014"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ORCID iD (optional)
                    </label>
                    <input
                      type="text"
                      value={orcidId}
                      onChange={(e) => setOrcidId(e.target.value)}
                      placeholder="e.g. 0000-0002-1825-0097"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#1D5FE8] focus:ring-1 focus:ring-[#1D5FE8]"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'supervisor' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Employee / Faculty ID <span className="text-red-500">*</span>
                    </label>
                    <div className={`relative flex items-center rounded-xl border transition-all ${
                      facultyIdTouched && !isFacultyIdValid
                        ? 'border-red-500 bg-red-50/10 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                        : 'border-slate-200 bg-white focus-within:border-[#1D5FE8] focus-within:ring-1 focus-within:ring-[#1D5FE8]'
                    }`}>
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={facultyId}
                        onChange={(e) => {
                          const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                          setFacultyId(clean);
                          setFacultyIdTouched(true);
                        }}
                        onBlur={() => setFacultyIdTouched(true)}
                        placeholder="e.g. FAC2024001"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden"
                      />
                    </div>
                    {facultyIdTouched && !isFacultyIdValid && (
                      <p className="text-xs text-red-500 font-normal mt-1.5">
                        Only capital letters and numbers without spaces allowed (minimum 3 characters)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#1D5FE8] focus-within:ring-1 focus-within:ring-[#1D5FE8]">
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-transparent rounded-xl appearance-none cursor-pointer focus:outline-hidden"
                      >
                        <option value="Lecturer">Lecturer</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3 pointer-events-none stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Institution Strip */}
              <div className="rounded-xl border border-slate-200 p-2.5 sm:p-3 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Port City International University
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md shrink-0">
                  Official Portal
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isFormValid() && !isSubmitting
                    ? 'bg-[#1D5FE8] hover:bg-[#1550c7] text-white cursor-pointer shadow-xs'
                    : 'bg-[#CBD5E1] text-white cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Completing verification...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Complete Verification as {getRoleDisplayName(selectedRole)}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
