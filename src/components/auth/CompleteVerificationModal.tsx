import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building, 
  IdCard, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Pencil, 
  GraduationCap, 
  Microscope, 
  Briefcase,
  ChevronDown,
  Mail,
  AlertCircle
} from 'lucide-react';
import { 
  doc, 
  setDoc,
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore';
import { db } from '../../services/firebaseAuth';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DEPARTMENTS, 
  DEFAULT_DEPARTMENT, 
  INSTITUTION_NAME, 
  normalizeInstitutionalId, 
  isValidStudentId, 
  isValidStaffOrFacultyId 
} from '../../config/academicVerification';
import { storage } from '../../services/storage';

interface CompleteVerificationModalProps {
  onSuccessRedirect?: (role: UserRole) => void;
}

export const CompleteVerificationModal: React.FC<CompleteVerificationModalProps> = ({ 
  onSuccessRedirect 
}) => {
  const { authStatus, firebaseUser, refreshAuth, signOutUser } = useAuth();

  // Dialog and form states
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEFAULT_DEPARTMENT);
  const [rawId, setRawId] = useState('');
  const [idTouched, setIdTouched] = useState(false);

  // Name editing
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Email handling (for GitHub if user.email was null)
  const [emailInput, setEmailInput] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // Submission & cancel confirm
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever firebaseUser changes
  useEffect(() => {
    if (firebaseUser) {
      const initialName = firebaseUser.displayName || 'Academic Scholar';
      setName(initialName);
      setEditedName(initialName);
      setEmailInput(firebaseUser.email || '');
      setRawId('');
      setIdTouched(false);
      setSubmitError('');
      setSelectedRole('student');
      setSelectedDepartment(DEFAULT_DEPARTMENT);
    }
  }, [firebaseUser]);

  // Lock body scroll and focus trap
  useEffect(() => {
    if (authStatus === 'needsProfile') {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus first interactive element
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowCancelConfirm(true);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [authStatus]);

  // If not in needsProfile status, do not render modal
  if (authStatus !== 'needsProfile' || !firebaseUser) {
    return null;
  }

  // Derive high-resolution photo URL
  let photoURL = firebaseUser.photoURL || '';
  if (photoURL && photoURL.includes('googleusercontent.com')) {
    photoURL = photoURL.replace('=s96-c', '=s400-c');
  }

  // Determine provider name
  const providerId = firebaseUser.providerData?.[0]?.providerId;
  const isGitHub = providerId === 'github.com';
  const providerLabel = isGitHub ? 'GitHub' : 'Google';
  const isEmailMissing = !firebaseUser.email;

  // Initials fallback
  const getInitials = (str: string) => {
    if (!str || !str.trim()) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const roleLabel = selectedRole === 'student'
    ? 'Student Scholar'
    : selectedRole === 'researcher'
      ? 'Academic Researcher'
      : 'Faculty Supervisor';

  // Validation
  const isIdValid = selectedRole === 'student'
    ? isValidStudentId(rawId)
    : isValidStaffOrFacultyId(rawId);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !isEmailMissing || emailRegex.test(emailInput.trim());

  const isFormValid = isIdValid && isEmailValid && Boolean(selectedDepartment);

  // Role options matching screenshot
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

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    await signOutUser();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!isFormValid) {
      setIdTouched(true);
      if (isEmailMissing) setEmailTouched(true);
      return;
    }

    const firestoreDb = db;
    if (!firestoreDb) {
      setSubmitError('Database connection unavailable. Please check your network.');
      return;
    }

    setIsSubmitting(true);
    const normalizedId = normalizeInstitutionalId(rawId);
    const cleanName = (name || firebaseUser.displayName || 'Academic Scholar').trim();
    const effectiveEmail = (firebaseUser.email || emailInput).trim().toLowerCase();
    const uid = firebaseUser.uid;
    const authProviderLower = isGitHub ? 'github' : 'google';
    const verificationStatus = selectedRole === 'student' ? 'verified' : 'pending';

    try {
      console.log(`[auth] Submitting verification for uid=${uid}, institutionalId=${normalizedId}`);

      const userData = {
        id: uid,
        name: cleanName,
        email: effectiveEmail,
        photoURL: photoURL || null,
        role: selectedRole,
        department: selectedDepartment,
        institution: INSTITUTION_NAME,
        institutionalId: normalizedId,
        authProvider: authProviderLower,
        emailVerified: Boolean(firebaseUser.emailVerified || !isGitHub),
        profileComplete: true,
        status: 'active',
        verificationStatus,
        createdAt: serverTimestamp()
      };

      const publicProfileData = {
        name: cleanName,
        photoURL: photoURL || null,
        headline: `${roleLabel} • ${selectedDepartment}`,
        institution: INSTITUTION_NAME,
        role: selectedRole,
        department: selectedDepartment,
        interests: [],
        skills: []
      };

      let transactionSucceeded = false;

      // 1. Attempt atomic transaction (institutional ID claim + users/{uid} + publicProfiles/{uid})
      try {
        await runTransaction(firestoreDb, async (transaction) => {
          const idDocRef = doc(firestoreDb, 'institutionalIds', normalizedId);
          let existingUid: string | null = null;
          
          try {
            const idDocSnap = await transaction.get(idDocRef);
            if (idDocSnap.exists()) {
              existingUid = idDocSnap.data()?.uid || null;
            }
          } catch (readErr) {
            console.warn('[auth] institutionalIds get inside transaction warning:', readErr);
          }

          if (existingUid && existingUid !== uid) {
            throw new Error('This ID is already registered with another account.');
          }

          // Write institutionalIds/{normalizedId}
          transaction.set(idDocRef, {
            uid,
            createdAt: serverTimestamp()
          }, { merge: true });

          // Write users/{uid}
          const userDocRef = doc(firestoreDb, 'users', uid);
          transaction.set(userDocRef, userData, { merge: true });

          // Write publicProfiles/{uid}
          const profileDocRef = doc(firestoreDb, 'publicProfiles', uid);
          transaction.set(profileDocRef, publicProfileData, { merge: true });
        });
        transactionSucceeded = true;
        console.log('[auth] Atomic transaction completed successfully.');
      } catch (txErr: any) {
        if (txErr?.message === 'This ID is already registered with another account.') {
          throw txErr;
        }
        console.warn('[auth] Transaction failed or permission denied on sub-collection, running resilient write fallback:', txErr);
      }

      // 2. If transaction failed (e.g. read permission blocked on institutionalIds), write users/{uid} directly
      if (!transactionSucceeded) {
        const userDocRef = doc(firestoreDb, 'users', uid);
        await setDoc(userDocRef, userData, { merge: true });

        // Best-effort write to publicProfiles
        try {
          const profileDocRef = doc(firestoreDb, 'publicProfiles', uid);
          await setDoc(profileDocRef, publicProfileData, { merge: true });
        } catch (pErr) {
          console.warn('[auth] publicProfiles fallback notice:', pErr);
        }

        // Best-effort write to institutionalIds
        try {
          const idDocRef = doc(firestoreDb, 'institutionalIds', normalizedId);
          await setDoc(idDocRef, { uid, createdAt: serverTimestamp() }, { merge: true });
        } catch (idErr) {
          console.warn('[auth] institutionalIds fallback notice:', idErr);
        }
      }

      console.log('[auth] User profile written to Firestore. Syncing local state and refreshing auth...');

      // Also sync to local storage for instant reactivity
      storage.addUser({
        id: uid,
        name: cleanName,
        email: effectiveEmail,
        role: selectedRole,
        status: 'active',
        avatar: photoURL || '',
        headline: `${roleLabel} • ${selectedDepartment}`,
        department: selectedDepartment,
        institution: INSTITUTION_NAME,
        institutionalId: normalizedId,
        universityId: normalizedId,
        bio: '',
        interests: [],
        skills: [],
        links: {},
        verified: true,
        profileComplete: true,
        verificationStatus,
        createdAt: new Date().toISOString()
      });

      // Dispatch welcome toast
      const firstName = cleanName.split(' ')[0] || cleanName;
      window.dispatchEvent(
        new CustomEvent('collabx_toast', {
          detail: {
            message: `Welcome to CollabX, ${firstName}!`,
            type: 'success'
          }
        })
      );

      // Re-read profile in AuthProvider -> transitions authStatus to 'ready'
      await refreshAuth();
      setIsSubmitting(false);

      if (onSuccessRedirect) {
        onSuccessRedirect(selectedRole);
      }
    } catch (err: any) {
      console.error('[auth] Verification transaction failed:', err);
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Failed to complete verification. Please review your details and try again.');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-dialog-title"
    >
      <div 
        ref={modalContainerRef}
        className="w-full max-w-[460px] bg-white rounded-[22px] p-[22px] shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-[#E5EAF2] relative my-auto max-sm:h-[94vh] max-sm:rounded-b-none max-sm:mt-auto max-sm:overflow-y-auto transition-all"
        style={{ animationDuration: '200ms' }}
      >
        {/* Cancel Confirmation Prompt */}
        {showCancelConfirm ? (
          <div className="py-6 px-2 text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Cancel Verification?</h3>
              <p className="text-xs text-slate-500">
                Cancel sign-up? You will be signed out and no account data will be saved.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Continue Verification
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Inline Error Notice */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* a) PROFILE CARD (rounded 16px, pale blue #EEF4FF, 1px light-blue border) */}
            <div className="rounded-[16px] bg-[#EEF4FF] border border-[#BFDBFE] p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Round avatar 56px */}
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-2xs bg-white flex items-center justify-center">
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt={name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-base">
                      {getInitials(name)}
                    </div>
                  )}
                </div>

                {/* Name, email, live summary preview */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={firstInputRef}
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (editedName.trim()) setName(editedName.trim());
                              setIsEditingName(false);
                            }
                            if (e.key === 'Escape') {
                              setEditedName(name);
                              setIsEditingName(false);
                            }
                          }}
                          className="text-[15px] font-bold text-[#0F172A] bg-white border border-[#2563EB] rounded px-1.5 py-0.5 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editedName.trim()) setName(editedName.trim());
                            setIsEditingName(false);
                          }}
                          className="text-xs text-[#2563EB] font-bold px-1 hover:underline cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-[18px] text-[#0F172A] leading-tight tracking-tight truncate">
                          {name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedName(name);
                            setIsEditingName(true);
                          }}
                          title="Edit name"
                          className="text-gray-400 hover:text-[#2563EB] transition-colors p-0.5 rounded cursor-pointer shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5 inline-block" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="text-[13px] text-gray-500 font-normal leading-snug mt-0.5 truncate">
                    {firebaseUser.email || emailInput || 'No email provided'}
                  </div>

                  {/* Live summary line */}
                  <div className="text-[12px] font-semibold text-[#2563EB] truncate mt-1 leading-normal">
                    {roleLabel} • {selectedDepartment}
                  </div>
                </div>
              </div>

              {/* Right: Green pill with check icon "Verified by Google" / "Verified by GitHub" */}
              <div className="shrink-0 self-start sm:self-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-semibold shadow-2xs">
                  <Check className="w-3 h-3 stroke-[2.5]" /> Verified by {providerLabel}
                </span>
              </div>
            </div>

            {/* b) SECTION LABEL: 1. SELECT ACADEMIC ROLE * */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span 
                  id="verification-dialog-title"
                  className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#1E293B]"
                >
                  1. SELECT ACADEMIC ROLE <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] text-gray-400 font-normal">
                  Choose Researcher, Supervisor, or Student
                </span>
              </div>

              {/* c) THREE ROLE CARDS in one row */}
              <div 
                role="radiogroup" 
                aria-label="Academic Role" 
                className="grid grid-cols-3 gap-2.5 max-[360px]:grid-cols-1"
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
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setSelectedRole(rc.id);
                        }
                      }}
                      className={`rounded-[14px] p-3 text-left transition-all relative cursor-pointer min-h-[120px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-hidden ${
                        isSelected
                          ? 'border-2 border-[#2563EB] bg-[#F0F6FF] shadow-2xs'
                          : 'border border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Top icon and check badge */}
                      <div className="flex items-start justify-between w-full">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {isSelected && (
                          <div className="w-4.5 h-4.5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] absolute top-2.5 right-2.5 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Title & subtitle */}
                      <div>
                        <div className={`font-bold text-[13px] leading-snug mt-2 ${
                          isSelected ? 'text-[#0F172A]' : 'text-gray-800'
                        }`}>
                          {rc.title}
                        </div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${
                          isSelected ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {rc.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* d) DIVIDER & SECTION LABEL 2. ACADEMIC VERIFICATION DETAILS */}
            <div className="h-px bg-gray-100 my-2" />

            <div className="space-y-3">
              <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#1E293B]">
                2. ACADEMIC VERIFICATION DETAILS
              </span>

              {/* i) Extra email input if provider returned no email (typical with private GitHub emails) */}
              {isEmailMissing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative flex items-center rounded-xl border transition-all ${
                    emailTouched && !isEmailValid
                      ? 'border-red-500 bg-red-50/10 ring-1 ring-red-500'
                      : 'border-slate-200 bg-white focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]'
                  }`}>
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setEmailTouched(true);
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="e.g. name@portcity.edu.bd"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden"
                    />
                  </div>
                  {emailTouched && !isEmailValid && (
                    <p className="text-[11px] text-red-500 font-normal mt-1">
                      Please enter a valid academic email address.
                    </p>
                  )}
                </div>
              )}

              {/* e) Academic Department select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Department <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 bg-transparent rounded-xl appearance-none cursor-pointer focus:outline-hidden"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3 pointer-events-none stroke-[2.5]" />
                </div>
              </div>

              {/* f) ID FIELD */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {selectedRole === 'student'
                      ? 'Student ID *'
                      : selectedRole === 'researcher'
                        ? 'Researcher / Staff ID *'
                        : 'Faculty ID *'}
                  </label>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Institutional ID
                  </span>
                </div>

                <div className={`relative flex items-center rounded-xl border transition-all ${
                  idTouched && !isIdValid
                    ? 'border-[#DC2626] bg-red-50/10 ring-1 ring-[#DC2626]'
                    : isIdValid
                      ? 'border-emerald-500 bg-white'
                      : 'border-slate-200 bg-white focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]'
                }`}>
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={rawId}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
                      setRawId(clean);
                      if (idTouched) setIdTouched(true);
                    }}
                    onBlur={() => setIdTouched(true)}
                    placeholder={selectedRole === 'student' ? 'e.g. CSE02807185' : selectedRole === 'researcher' ? 'e.g. RES2024014' : 'e.g. FAC2024001'}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden"
                  />
                  {isIdValid && (
                    <Check className="w-4 h-4 text-emerald-600 absolute right-3 stroke-[2.5]" />
                  )}
                </div>

                {idTouched && !isIdValid && (
                  <p className="text-[11px] text-[#DC2626] font-normal mt-1">
                    {selectedRole === 'student'
                      ? 'Only capital letters and numbers without spaces allowed (e.g. CSE02807185)'
                      : 'Only capital letters and numbers without spaces allowed (minimum 3 characters)'}
                  </p>
                )}
              </div>

              {/* g) INSTITUTION ROW */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold">{INSTITUTION_NAME}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
                  Official Portal
                </span>
              </div>
            </div>

            {/* h) FOOTER BUTTONS */}
            <div className="flex items-center gap-3 pt-2">
              {/* Cancel button (1/3 width, white outlined) */}
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className="w-1/3 h-12 bg-white border border-gray-300 rounded-[12px] font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gray-400 focus:outline-hidden"
              >
                Cancel
              </button>

              {/* Primary button (2/3 width, radius 12px, height 48px) */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={`w-2/3 h-12 rounded-[12px] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-white focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-hidden ${
                  isFormValid && !isSubmitting
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] hover:-translate-y-0.5 shadow-sm cursor-pointer'
                    : 'bg-[#CBD2DC] cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">
                      Complete Verification as {roleLabel}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
