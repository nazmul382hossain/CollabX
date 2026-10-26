import React, { useState, useEffect } from 'react';
import { 
  Building, 
  IdCard, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Pencil, 
  GraduationCap, 
  Microscope, 
  Briefcase 
} from 'lucide-react';
import { User, UserRole } from '../types';
import { auth, cancelSocialAuth, createSocialUserProfile } from '../services/firebaseAuth';

interface VerifyPageProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  onVerificationSuccess: (user: User) => void;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({
  currentUser,
  onNavigate,
  onVerificationSuccess
}) => {
  // Read authenticated user details from Firebase Auth (or fallback to passed currentUser)
  const fbUser = auth?.currentUser;

  // Initial redirect if no user is signed in
  useEffect(() => {
    if (!fbUser && !currentUser) {
      onNavigate('/register');
    }
  }, [fbUser, currentUser, onNavigate]);

  // Loading animation state inside the /verify page on first load:
  // processing (about 1.5 seconds) -> reveal photo & form below it
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState(0);

  // Derive initial user info from auth.currentUser or currentUser
  const initialDisplayName = fbUser?.displayName || currentUser?.name || 'Academic Scholar';
  const initialEmail = fbUser?.email || currentUser?.email || '';
  
  // High-res photo for Google
  let rawPhoto = fbUser?.photoURL || currentUser?.avatar || '';
  if (rawPhoto && rawPhoto.includes('googleusercontent.com')) {
    rawPhoto = rawPhoto.replace('=s96-c', '=s400-c');
  }

  // Detect provider from providerData or authProvider
  const detectedProvider = 
    fbUser?.providerData?.[0]?.providerId === 'github.com' || currentUser?.authProvider === 'GitHub'
      ? 'GitHub'
      : 'Google';

  // Form states
  const [name, setName] = useState(initialDisplayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(initialDisplayName);
  const [photoURL] = useState(rawPhoto);
  const [imgError, setImgError] = useState(false);

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [selectedDepartment, setSelectedDepartment] = useState('Computer Science & Engineering');
  
  // Role-specific fields
  const [studentId, setStudentId] = useState('');
  const [researcherId, setResearcherId] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [designation, setDesignation] = useState('Lecturer');

  // Validation & UI states
  const [studentIdTouched, setStudentIdTouched] = useState(false);
  const [facultyIdTouched, setFacultyIdTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fallback for initials
  const getInitials = (str: string) => {
    if (!str || !str.trim()) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Processing animation timer: 1.5 seconds total
  useEffect(() => {
    const stageTimer = setTimeout(() => {
      setProcessingStage(1);
    }, 700);

    const finishTimer = setTimeout(() => {
      setIsProcessing(false);
    }, 1500);

    return () => {
      clearTimeout(stageTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  // Update name if fbUser loads after render
  useEffect(() => {
    if (fbUser?.displayName && !name) {
      setName(fbUser.displayName);
      setEditedName(fbUser.displayName);
    }
  }, [fbUser?.displayName, name]);

  // Validation logic: only capital letters and numbers without spacing
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

  // Submit verification
  const handleCompleteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

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
      setFormError('Administrator role cannot be self-assigned. Contact systems administration.');
      return;
    }

    const effectiveUid = fbUser?.uid || currentUser?.id;
    if (!effectiveUid) {
      setFormError('Session expired. Please sign in again.');
      return;
    }

    const cleanEmail = (fbUser?.email || currentUser?.email || '').trim().toLowerCase();
    const cleanName = (name || 'Academic Scholar').trim();
    const effectiveId = selectedRole === 'student' 
      ? studentId.trim() 
      : selectedRole === 'supervisor' 
        ? facultyId.trim() 
        : researcherId.trim();

    setIsSubmitting(true);

    try {
      const newUser = await createSocialUserProfile({
        uid: effectiveUid,
        name: cleanName,
        email: cleanEmail,
        photoURL: photoURL || undefined,
        role: selectedRole,
        department: selectedDepartment,
        institution: 'Port City International University',
        studentId: effectiveId || undefined,
        universityId: effectiveId || undefined,
        authProvider: detectedProvider
      });

      setIsSubmitting(false);
      onVerificationSuccess(newUser);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Failed to complete verification. Please try again.');
    }
  };

  // Cancel flow
  const handleCancel = async () => {
    const confirmCancel = window.confirm('Cancel verification? You will be signed out.');
    if (!confirmCancel) return;

    await cancelSocialAuth().catch(() => {});
    onNavigate('/register');
  };

  const roleLabel = selectedRole === 'student'
    ? 'Student Scholar'
    : selectedRole === 'researcher'
      ? 'Academic Researcher'
      : 'Faculty Supervisor';

  const roleCards: {
    id: UserRole;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-10 px-4 sm:px-6">
      <div 
        className="w-full max-w-[560px] bg-white rounded-[24px] p-6 border border-[#E5EAF2] mx-auto animate-fade-in"
        style={{
          boxShadow: '0 20px 50px rgba(15,23,42,0.08)'
        }}
      >
        
        {/* ========================================================================= */}
        {/* 1) PROCESSING ANIMATION STATE (Inside the /verify page on first load)      */}
        {/* ========================================================================= */}
        {isProcessing ? (
          <div className="py-12 px-4 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-md border border-blue-900/30">
              {detectedProvider === 'Google' ? (
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

            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-[#0B2545] tracking-tight">
                {processingStage === 0 ? `Connecting to ${detectedProvider}...` : 'Fetching your profile...'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Port City International University Portal
              </p>
            </div>

            <div className="space-y-2 max-w-xs mx-auto pt-2">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-linear-to-r from-[#1D5FE8] to-[#0B2545] transition-all duration-700 ease-out"
                  style={{ width: processingStage === 0 ? '50%' : '100%' }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2) FULL VERIFICATION FORM (Visual layout strictly matching screenshot)     */
          /* ========================================================================= */
          <form onSubmit={handleCompleteVerification} className="space-y-6 animate-fade-in">
            
            {/* 1) PROFILE HEADER (Top of the card) */}
            <div className="bg-[#EEF5FF] border border-[#BFDBFE] rounded-[16px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Left: circular avatar 56px with a 2px white ring */}
                <div className="w-[56px] h-[56px] rounded-full shrink-0 ring-2 ring-white overflow-hidden bg-white shadow-xs flex items-center justify-center">
                  {photoURL && !imgError ? (
                    <img 
                      src={photoURL} 
                      alt={name} 
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1D5FE8] text-white flex items-center justify-center font-bold text-lg">
                      {getInitials(name)}
                    </div>
                  )}
                </div>

                {/* Middle: name with small grey pencil icon, email below, summary line */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={() => {
                            if (editedName.trim()) setName(editedName.trim());
                            setIsEditingName(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editedName.trim()) setName(editedName.trim());
                              setIsEditingName(false);
                            }
                          }}
                          autoFocus
                          className="px-2 py-0.5 text-base font-bold text-[#1E293B] border border-blue-400 rounded-md bg-white focus:outline-hidden"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-[16px] text-[#1E293B] truncate leading-tight">
                          {name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedName(name);
                            setIsEditingName(true);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 p-0.5"
                          title="Edit name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="text-[14px] text-gray-500 truncate leading-snug">
                    {initialEmail}
                  </div>

                  <div className="text-[12px] text-[#1D5FE8] font-semibold truncate leading-normal">
                    {roleLabel} • {selectedDepartment}
                  </div>
                </div>
              </div>

              {/* Right: green pill badge "Verified by Google" (or GitHub) */}
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-bold shadow-2xs">
                  <Check className="w-3 h-3 stroke-[3]" /> Verified by {detectedProvider}
                </span>
              </div>
            </div>

            {/* Error display */}
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-fade-in">
                {formError}
              </div>
            )}

            {/* 2) SECTION "1. SELECT ACADEMIC ROLE *" */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#1E293B]">
                  1. SELECT ACADEMIC ROLE <span className="text-red-500">*</span>
                </label>
                <span className="text-[12px] text-gray-400 font-normal">
                  Choose Researcher, Supervisor, or Student
                </span>
              </div>

              {/* Three equal cards in one row (gap 12px), radius 16px, padding 14px */}
              <div 
                role="radiogroup" 
                aria-label="Academic Role" 
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {roleCards.map((rc) => {
                  const Icon = rc.icon;
                  const isSelected = selectedRole === rc.id;

                  return (
                    <div
                      key={rc.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedRole(rc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRole(rc.id);
                        }
                      }}
                      className={`relative rounded-[16px] p-[14px] cursor-pointer transition-all flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-2 border-[#2563EB] bg-[#EEF4FF] shadow-xs'
                          : 'border border-[#E2E8F0] bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Top row: Icon box (36px) & Blue check badge at top right if selected */}
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`w-[36px] h-[36px] rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-gray-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <div className="font-bold text-[14px] text-[#1E293B] leading-tight">
                          {rc.title}
                        </div>
                        <div className="text-[12px] text-gray-500 mt-1 leading-snug">
                          {rc.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thin horizontal divider */}
            <hr className="border-t border-[#E2E8F0]" />

            {/* 3) SECTION "2. ACADEMIC VERIFICATION DETAILS" */}
            <div className="space-y-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#1E293B]">
                2. ACADEMIC VERIFICATION DETAILS
              </div>

              {/* Academic Department dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-[#1E293B]">
                  Academic Department <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Building className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full h-[48px] pl-11 pr-10 rounded-[14px] border border-[#CBD5E1] text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
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
                </div>
              </div>

              {/* Dynamic role fields with smooth transition */}
              <div className="transition-all duration-300">
                {selectedRole === 'student' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-[14px] font-medium text-[#1E293B]">
                        Student ID <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] text-gray-400">Institutional ID</span>
                    </div>
                    <div className="relative flex items-center">
                      <IdCard className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                          setStudentId(clean);
                          if (studentIdTouched) setStudentIdTouched(false);
                        }}
                        onBlur={() => setStudentIdTouched(true)}
                        placeholder="e.g. CSE02807185"
                        className={`w-full h-[48px] pl-11 pr-4 rounded-[14px] border text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all ${
                          studentIdTouched && !isStudentIdValid
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#CBD5E1]'
                        }`}
                      />
                    </div>
                    {studentIdTouched && !isStudentIdValid && (
                      <p className="text-[12px] text-[#DC2626] font-medium">
                        Only capital letters and numbers without spaces allowed (e.g. CSE02807185)
                      </p>
                    )}
                  </div>
                )}

                {selectedRole === 'researcher' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[14px] font-medium text-[#1E293B]">
                          Researcher / Institutional ID
                        </label>
                        <span className="text-[12px] text-gray-400">Optional</span>
                      </div>
                      <div className="relative flex items-center">
                        <IdCard className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={researcherId}
                          onChange={(e) => {
                            const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                            setResearcherId(clean);
                          }}
                          placeholder="e.g. RES2024014"
                          className="w-full h-[48px] pl-11 pr-4 rounded-[14px] border border-[#CBD5E1] text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1E293B]">
                        ORCID iD (optional)
                      </label>
                      <input
                        type="text"
                        value={orcidId}
                        onChange={(e) => setOrcidId(e.target.value)}
                        placeholder="e.g. 0000-0002-1825-0097"
                        className="w-full h-[48px] px-4 rounded-[14px] border border-[#CBD5E1] text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'supervisor' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1E293B]">
                        Employee / Faculty ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <IdCard className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={facultyId}
                          onChange={(e) => {
                            const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                            setFacultyId(clean);
                            if (facultyIdTouched) setFacultyIdTouched(false);
                          }}
                          onBlur={() => setFacultyIdTouched(true)}
                          placeholder="e.g. FAC2024001"
                          className={`w-full h-[48px] pl-11 pr-4 rounded-[14px] border text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all ${
                            facultyIdTouched && !isFacultyIdValid
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-[#CBD5E1]'
                          }`}
                        />
                      </div>
                      {facultyIdTouched && !isFacultyIdValid && (
                        <p className="text-[12px] text-[#DC2626] font-medium">
                          Only capital letters and numbers without spaces allowed (minimum 3 characters)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1E293B]">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full h-[48px] px-4 rounded-[14px] border border-[#CBD5E1] text-[14px] text-[#1E293B] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                      >
                        <option value="Lecturer">Lecturer</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4) INSTITUTION STRIP */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-[12px_14px] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1E293B]">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[14px]">Port City International University</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                Official Portal
              </span>
            </div>

            {/* 5) FOOTER BUTTONS (flex row, gap 12px) */}
            <div className="flex items-center gap-3 pt-1">
              {/* Cancel button */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-28 sm:w-32 h-[52px] bg-white border border-[#CBD5E1] rounded-[14px] font-bold text-[14px] text-[#1E293B] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Primary button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className="flex-1 h-[52px] bg-[#1D5FE8] hover:bg-[#164cc0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-[14px] rounded-[14px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Verification as {roleLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
