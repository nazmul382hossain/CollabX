import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebaseAuth';
import { User } from '../types';
import { storage } from '../services/storage';
import { authService, isManualRegistrationInProgress, LoginResult } from '../services/authService';

export type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

export interface AuthContextType {
  authStatus: AuthStatus;
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  refreshAuth: () => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithSocial: (provider: 'Google' | 'GitHub') => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<LoginResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Helper to resolve Firestore user profile and determine state machine transition
  const resolveUserProfile = useCallback(async (fbUser: FirebaseUser | null) => {
    // Ignore transient auth changes triggered inside manual registration (create -> write -> signOut)
    if (isManualRegistrationInProgress()) {
      return;
    }

    if (!fbUser) {
      // Check if an active local/offline session exists (e.g., demo accounts or local email+password signup)
      const localUser = storage.getCurrentUser();
      if (localUser && localUser.status === 'active') {
        const readyLocalUser: User = {
          ...localUser,
          profileComplete: true,
          verified: localUser.verified ?? true
        };
        setFirebaseUser(null);
        setCurrentUser(readyLocalUser);
        setAuthStatus('ready');
        return;
      }

      console.log('[auth] transition -> signedOut (no Firebase or local session)');
      setFirebaseUser(null);
      setCurrentUser(null);
      setAuthStatus('signedOut');
      return;
    }

    setFirebaseUser(fbUser);
    const isPasswordUser = fbUser.providerData?.some(p => p.providerId === 'password') ?? false;

    const resolveLocalFallback = (): boolean => {
      const currentLocal = storage.getCurrentUser();
      const matched =
        (currentLocal && (currentLocal.id === fbUser.uid || (fbUser.email && currentLocal.email.toLowerCase() === fbUser.email.toLowerCase())))
          ? currentLocal
          : storage.getUsers().find(
              u => u.id === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
            );

      if (matched && matched.status === 'active') {
        const readyUser: User = {
          ...matched,
          id: fbUser.uid,
          email: fbUser.email || matched.email,
          profileComplete: true,
          verified: matched.verified ?? true
        };
        storage.addUser(readyUser);
        storage.establishAuthenticatedSession(readyUser);
        setCurrentUser(readyUser);
        setAuthStatus('ready');
        return true;
      }

      if (isPasswordUser) {
        const cleanEmail = (fbUser.email || '').toLowerCase();
        const readyUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split('@')[0] || 'Academic Scholar',
          email: fbUser.email || '',
          role: 'student',
          status: 'active',
          authProvider: 'password',
          avatar: fbUser.photoURL || '',
          headline: 'Student Researcher • Computer Science & Engineering',
          department: 'Computer Science and Engineering',
          institution: 'Port City International University',
          bio: 'CollabX student collaborating in academic research and innovation projects.',
          interests: ['Artificial Intelligence', 'Data Science'],
          skills: ['Python', 'Data Analysis'],
          links: {},
          verified: true,
          profileComplete: true,
          verificationStatus: 'verified',
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString()
        };
        storage.addUser(readyUser);
        storage.establishAuthenticatedSession(readyUser);
        setCurrentUser(readyUser);
        setAuthStatus('ready');
        return true;
      }

      return false;
    };

    if (!db) {
      if (resolveLocalFallback()) return;
      console.warn('[auth] Firestore db not configured, fallback to needsProfile');
      setCurrentUser(null);
      setAuthStatus('needsProfile');
      return;
    }

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const profileComplete = data?.profileComplete === true || isPasswordUser;

        if (data?.status === 'inactive') {
          console.log(`[auth] transition -> signedOut (uid=${fbUser.uid}, account inactive in Firestore)`);
          if (auth) await fbSignOut(auth).catch(() => {});
          storage.logoutUser();
          setFirebaseUser(null);
          setCurrentUser(null);
          setAuthStatus('signedOut');
          return;
        }

        if (profileComplete) {
          const fullUser: User = {
            id: fbUser.uid,
            name: data.name || fbUser.displayName || 'Academic Scholar',
            email: data.email || fbUser.email || '',
            role: data.role || 'student',
            status: data.status || 'active',
            avatar: data.avatar || data.photoURL || fbUser.photoURL || '',
            headline: data.headline || `${data.role || 'student'} • ${data.department || 'Computer Science & Engineering'}`,
            department: data.department || 'Computer Science & Engineering',
            institution: data.institution || 'Port City International University',
            institutionalId: data.institutionalId || data.studentId || data.universityId || undefined,
            universityId: data.universityId || data.institutionalId || data.studentId || undefined,
            bio: data.bio || '',
            interests: data.interests || [],
            skills: data.skills || [],
            links: data.links || {},
            verified: data.verified ?? true,
            profileComplete: true,
            verificationStatus: data.verificationStatus || (data.role === 'student' ? 'verified' : 'pending'),
            emailVerified: fbUser.emailVerified,
            photoURL: data.photoURL || data.avatar || fbUser.photoURL || undefined,
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()
          };

          storage.addUser(fullUser);
          storage.establishAuthenticatedSession(fullUser);
          setCurrentUser(fullUser);
          console.log(`[auth] transition -> ready (uid=${fbUser.uid}, doc exists=true, profileComplete=true, role=${fullUser.role})`);
          setAuthStatus('ready');
        } else {
          setCurrentUser(null);
          console.log(`[auth] transition -> needsProfile (uid=${fbUser.uid}, doc exists=true, profileComplete=false)`);
          setAuthStatus('needsProfile');
        }
      } else {
        // Document does NOT exist in Firestore: check local/password fallback before requiring social profile completion
        if (resolveLocalFallback()) return;
        setCurrentUser(null);
        console.log(`[auth] transition -> needsProfile (uid=${fbUser.uid}, doc exists=false)`);
        setAuthStatus('needsProfile');
      }
    } catch (err) {
      console.error('[auth] Error fetching users/{uid} document:', err);
      if (isPasswordUser && resolveLocalFallback()) return;
      // Keep in needsProfile so user can re-verify or retry
      setCurrentUser(null);
      setAuthStatus('needsProfile');
    }
  }, []);

  // Listen to onAuthStateChanged & getRedirectResult
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      const localUser = storage.getCurrentUser();
      if (localUser && localUser.status === 'active') {
        setCurrentUser({ ...localUser, profileComplete: true, verified: localUser.verified ?? true });
        setAuthStatus('ready');
      } else {
        console.log('[auth] Firebase not configured, signedOut');
        setAuthStatus('signedOut');
      }
      return;
    }

    let isMounted = true;

    // Handle redirect result if user came from redirect flow
    getRedirectResult(auth)
      .then((res) => {
        if (!isMounted) return;
        if (res?.user) {
          console.log('[auth] getRedirectResult resolved with user:', res.user.uid);
        }
      })
      .catch((err) => {
        console.warn('[auth] getRedirectResult error:', err);
      });

    // Main authentic Firebase Auth observer
    const unsubscribe = fbOnAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      await resolveUserProfile(fbUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [resolveUserProfile]);

  const refreshAuth = useCallback(async () => {
    await resolveUserProfile(auth?.currentUser || null);
  }, [resolveUserProfile]);

  const signOutUser = useCallback(async () => {
    console.log('[auth] Manual signOutUser requested');
    if (auth) {
      await fbSignOut(auth).catch(() => {});
    }
    storage.logoutUser();
    setFirebaseUser(null);
    setCurrentUser(null);
    console.log('[auth] transition -> signedOut');
    setAuthStatus('signedOut');
  }, []);

  const loginWithEmail = useCallback(async (emailInput: string, passwordInput: string): Promise<LoginResult> => {
    const result = await authService.login(emailInput, passwordInput);
    if (result.success && result.user) {
      const readyUser: User = {
        ...result.user,
        profileComplete: true,
        verified: result.user.verified ?? true
      };
      if (auth?.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
      setCurrentUser(readyUser);
      setAuthStatus('ready');
    }
    return result;
  }, []);

  const signInWithSocial = useCallback(async (providerType: 'Google' | 'GitHub'): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => {
    if (!isFirebaseConfigured() || !auth) {
      return {
        success: false,
        error: 'Firebase Authentication is not configured in this environment.'
      };
    }

    try {
      let provider: GoogleAuthProvider | GithubAuthProvider;
      if (providerType === 'Google') {
        provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
          prompt: 'select_account'
        });
      } else {
        provider = new GithubAuthProvider();
        provider.addScope('user:email');
      }

      console.log(`[auth] Opening signInWithPopup for ${providerType}...`);
      await signInWithPopup(auth, provider);
      // DO NOT navigate or create Firestore docs here!
      // onAuthStateChanged will fire automatically and transition state machine.
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      console.warn(`[auth] ${providerType} signIn error code:`, code, err);

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true };
      }
      if (code === 'auth/popup-blocked') {
        if (auth) {
          let p: GoogleAuthProvider | GithubAuthProvider;
          if (providerType === 'Google') {
            p = new GoogleAuthProvider();
            p.addScope('profile');
            p.addScope('email');
            p.setCustomParameters({ prompt: 'select_account' });
          } else {
            p = new GithubAuthProvider();
            p.addScope('user:email');
          }
          await signInWithRedirect(auth, p).catch(() => {});
        }
        return { success: false, error: 'Please allow popups for this site and try again.' };
      }
      if (code === 'auth/account-exists-with-different-credential') {
        return {
          success: false,
          error: 'This email is already registered with another sign-in method. Please use that method.'
        };
      }
      if (code === 'auth/network-request-failed') {
        return {
          success: false,
          error: 'Network error. Please check your internet connection.'
        };
      }
      return {
        success: false,
        error: err?.message || 'Sign-in failed. Please try again.'
      };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        firebaseUser,
        currentUser,
        refreshAuth,
        signOutUser,
        signInWithSocial,
        loginWithEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
