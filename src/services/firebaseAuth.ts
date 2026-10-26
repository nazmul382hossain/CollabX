import { 
  initializeApp, 
  getApps, 
  getApp, 
  FirebaseApp 
} from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  deleteUser,
  Auth,
  User as FirebaseUser,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Firestore 
} from 'firebase/firestore';
import { User, Application, UserRole } from '../types';
import { storage } from './storage';
import { authService, RegisterParams } from './authService';
import { formatFileSize } from './cvService';
import { publicProfileService } from './publicProfileService';

// Real Firebase Client Configuration from Environment Variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.authDomain && 
    firebaseConfig.projectId
  );
}

let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

// Global active auth state listener subscribers
type AuthListener = (user: User | null) => void;
const authListeners: Set<AuthListener> = new Set();
let currentAuthenticatedUser: User | null = null;
let isInitialAuthLoaded = false;

// Initialize onAuthStateChanged listener
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  authListeners.add(callback);

  // If already loaded, trigger immediately with current status
  if (isInitialAuthLoaded) {
    callback(currentAuthenticatedUser);
  }

  return () => {
    authListeners.delete(callback);
  };
}

function notifyAuthListeners(user: User | null) {
  currentAuthenticatedUser = user;
  isInitialAuthLoaded = true;
  authListeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

/**
 * Initialize and sync Auth state on application start.
 * Ensures the ONLY source of truth is authentic session + user profile document.
 * By default on cold start without an active valid session, currentUser is strictly null.
 */
export async function initializeFirebaseAuth(): Promise<User | null> {
  try {
    // 1. Check for pending redirect result from social auth fallback
    if (auth) {
      try {
        const redirectRes = await getRedirectResult(auth);
        if (redirectRes && redirectRes.user) {
          const fbUser = redirectRes.user;
          const users = storage.getUsers();
          const existing = users.find(u => 
            (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase()) || u.id === fbUser.uid
          );
          if (existing) {
            if (existing.status === 'inactive') {
              await fbSignOut(auth).catch(() => {});
              currentAuthenticatedUser = null;
            } else {
              currentAuthenticatedUser = existing;
              storage.setCurrentUser(existing.id);
            }
          }
        }
      } catch (redirectErr) {
        console.warn('Redirect auth check notice:', redirectErr);
      }
    }

    // 2. Attach real onAuthStateChanged listener to Firebase Auth if initialized
    if (auth) {
      fbOnAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) {
          if (!storage.getCurrentUser()) {
            notifyAuthListeners(null);
          }
          return;
        }

        // Check Firestore or storage for user profile
        let userProfile: User | null = null;
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              userProfile = snap.data() as User;
            }
          } catch {
            // Local fallback
          }
        }
        if (!userProfile) {
          const users = storage.getUsers();
          userProfile = users.find(u => u.id === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())) || null;
        }

        if (userProfile) {
          if (userProfile.status === 'inactive') {
            await fbSignOut(auth!).catch(() => {});
            storage.logoutUser();
            notifyAuthListeners(null);
            return;
          }
          if (userProfile.verified === true) {
            storage.setCurrentUser(userProfile.id);
            notifyAuthListeners(userProfile);
          } else {
            // Document exists but verified !== true
            notifyAuthListeners({
              ...userProfile,
              verified: false
            });
          }
        } else {
          // Document does not exist in Firestore: user has not completed verification profile
          notifyAuthListeners(null);
        }
      });
    }

    // 3. Sync from session storage as provisional state
    const user = storage.getCurrentUser();
    if (user && user.status === 'active') {
      currentAuthenticatedUser = user;
    } else {
      currentAuthenticatedUser = null;
    }

    if (!auth) {
      isInitialAuthLoaded = true;
      notifyAuthListeners(currentAuthenticatedUser);
    }
  } catch {
    currentAuthenticatedUser = null;
    isInitialAuthLoaded = true;
    notifyAuthListeners(null);
  }
  return currentAuthenticatedUser;
}

export function getCurrentUser(): User | null {
  return currentAuthenticatedUser;
}

export function isAuthReady(): boolean {
  return isInitialAuthLoaded;
}

/**
 * Sign In with strict authentication
 * 1. Authenticates against Firebase Auth if configured.
 * 2. Reads role STRICTLY from Firestore users/{uid}.
 * 3. Rejects inactive accounts and returns generic error on failure.
 */
export async function signInWithEmailAndPassword(
  email: string, 
  pass: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();

  // Try real Firebase Auth & Firestore first if configured
  if (auth && db && isFirebaseConfigured()) {
    try {
      const cred = await fbSignIn(auth, cleanEmail, pass);
      const fbUser = cred.user;

      // Read role ONLY from Firestore users/{uid}
      const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
      if (userSnap.exists()) {
        const firestoreData = userSnap.data() as User;

        if (firestoreData.status === 'inactive') {
          await fbSignOut(auth).catch(() => {});
          return {
            success: false,
            error: 'Your account is currently disabled or inactive. Please contact the administrator.'
          };
        }

        const authenticatedUser: User = {
          ...firestoreData,
          id: fbUser.uid,
          email: fbUser.email || cleanEmail,
          // Role is read strictly from Firestore users/{uid}
          role: firestoreData.role || 'student'
        };

        storage.updateUser(authenticatedUser);
        storage.setCurrentUser(authenticatedUser.id);
        notifyAuthListeners(authenticatedUser);

        return {
          success: true,
          user: authenticatedUser
        };
      }
    } catch (fbErr: any) {
      console.warn('Firebase Auth sign in notice:', fbErr?.code);
    }
  }

  // Fallback to storage/authService
  const result = await authService.login(cleanEmail, pass);
  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'Invalid email or password.'
    };
  }

  // Update session and fire onAuthStateChanged
  storage.setCurrentUser(result.user.id);
  notifyAuthListeners(result.user);
  return {
    success: true,
    user: result.user
  };
}

/**
 * Create a new user account in Firebase Auth & Firestore profile
 * Role is strictly restricted to ['student', 'researcher', 'supervisor'].
 * Admin accounts can NEVER be created from client code.
 */
export async function createUserWithEmailAndPassword(
  params: RegisterParams
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const rawRole = params.role || 'student';
  const role: UserRole = (rawRole === 'supervisor' || rawRole === 'researcher') ? rawRole : 'student';

  if (auth && db && isFirebaseConfigured()) {
    try {
      const cred = await fbCreateUser(auth, cleanEmail, params.password);
      const uid = cred.user.uid;

      const newUser: User = {
        id: uid,
        name: params.name.trim(),
        email: cleanEmail,
        role,
        status: 'active',
        universityId: params.universityId?.trim(),
        department: params.department || 'Computer Science and Engineering',
        institution: params.institution || 'Port City International University',
        avatar: role === 'student' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        headline: `${role === 'student' ? 'Student Researcher' : 'Faculty Supervisor'} · ${params.department || 'CSE'}`,
        bio: `CollabX ${role} collaborating in academic research.`,
        interests: ['Artificial Intelligence', 'Data Science'],
        skills: role === 'student' ? ['Python', 'Data Analysis'] : ['Research Methodology', 'Data Science'],
        links: {},
        verified: true,
        createdAt: new Date().toISOString()
      };

      // 1. Write private users/{uid} document in Firestore
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: newUser.name,
        email: cleanEmail,
        role: newUser.role,
        status: 'active',
        department: newUser.department,
        institution: newUser.institution,
        avatar: newUser.avatar,
        headline: newUser.headline,
        bio: newUser.bio,
        interests: newUser.interests,
        skills: newUser.skills,
        links: newUser.links,
        createdAt: newUser.createdAt
      });

      // 2. Write publicProfiles/{uid} document in Firestore
      await publicProfileService.syncUserProfile(newUser);

      // Sign out new user from Firebase Auth so they log in with credentials
      await fbSignOut(auth).catch(() => {});

      return {
        success: true,
        user: newUser
      };
    } catch (fbErr: any) {
      console.warn('Firebase createUser notice:', fbErr?.code);
      if (fbErr?.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in.'
        };
      }
    }
  }

  // Fallback to authService.register
  const result = await authService.register({ ...params, role });
  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'Registration failed.'
    };
  }

  return {
    success: true,
    user: result.user
  };
}

/**
 * Establish authenticated session for a user and trigger onAuthStateChanged
 */
export function setAuthenticatedUser(user: User): void {
  storage.setCurrentUser(user.id);
  notifyAuthListeners(user);
}

/**
 * Sign in or sign up with OAuth credentials (Google / GitHub)
 */
export async function signInWithOAuth(user: User): Promise<User> {
  const users = storage.getUsers();
  const existing = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  let targetUser = user;

  if (existing) {
    targetUser = {
      ...existing,
      name: user.name || existing.name,
      avatar: user.avatar || existing.avatar,
      links: { ...existing.links, ...user.links }
    };
    storage.updateUser(targetUser);
  } else {
    storage.addUser(user);
    targetUser = user;
  }

  storage.setCurrentUser(targetUser.id);
  notifyAuthListeners(targetUser);
  return targetUser;
}

export interface SocialAuthProfileData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: 'Google' | 'GitHub';
  username?: string;
}

export interface SocialAuthResponse {
  success: boolean;
  isNewUser?: boolean;
  user?: User;
  profileData?: SocialAuthProfileData;
  error?: string;
  cancelled?: boolean;
  notConfigured?: boolean;
  redirecting?: boolean;
}

export interface SocialAuthOptions {
  preferredRole?: UserRole;
  department?: string;
  universityId?: string;
  institution?: string;
  isRegistration?: boolean;
}

/**
 * Real Firebase Authentication signInWithPopup with Google or GitHub
 * NEVER asks for or stores user's password.
 * Opens official accounts.google.com or github.com popup.
 * If not configured, returns notConfigured: true with a clear informative message.
 */
export async function signInWithSocialOAuth(
  providerType: 'Google' | 'GitHub',
  options?: SocialAuthOptions
): Promise<SocialAuthResponse> {
  // Check if Firebase is configured with credentials
  if (!isFirebaseConfigured() || !auth) {
    return {
      success: false,
      notConfigured: true,
      error: `${providerType} sign-in is not configured. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your environment variables.`
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

    const cred = await signInWithPopup(auth, provider);
    const fbUser = cred.user;

    if (!fbUser) {
      return {
        success: false,
        error: 'Failed to retrieve user information from provider.'
      };
    }

    // Read ONLY uid, displayName, email, and photoURL returned by the official provider
    const uid = fbUser.uid;
    const email = fbUser.email || null;
    const displayName = fbUser.displayName || null;
    let photoURL = fbUser.photoURL || null;

    // For Google photos, replace "=s96-c" with "=s400-c" for a sharper image
    if (photoURL && providerType === 'Google') {
      photoURL = photoURL.replace('=s96-c', '=s400-c');
    }

    // Check if user document already exists in Firestore or local synced store
    let existingUser: User | null = null;

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          existingUser = snap.data() as User;
        }
      } catch {
        // Fallback to storage check
      }
    }

    if (!existingUser) {
      const users = storage.getUsers();
      existingUser = users.find(u => 
        (email && u.email?.toLowerCase() === email.toLowerCase()) || u.id === uid
      ) || null;
    }

    // Returning user only if users/{uid} has verified === true
    if (existingUser && existingUser.verified === true) {
      if (existingUser.status === 'inactive') {
        if (auth) await fbSignOut(auth).catch(() => {});
        return {
          success: false,
          error: 'Your account is currently disabled or inactive. Please contact the administrator.'
        };
      }

      storage.setCurrentUser(existingUser.id);
      notifyAuthListeners(existingUser);
      return { success: true, isNewUser: false, user: existingUser };
    }

    // First-time user: return profileData for processing -> profile reveal -> role-verification modal
    return {
      success: true,
      isNewUser: true,
      profileData: {
        uid,
        displayName,
        email,
        photoURL,
        provider: providerType
      }
    };
  } catch (authErr: any) {
    const code = authErr?.code || '';

    // auth/popup-closed-by-user or auth/cancelled-popup-request: silently return to the sign-up page, no error
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { success: false, cancelled: true };
    }

    // auth/popup-blocked: show friendly message
    if (code === 'auth/popup-blocked') {
      return { 
        success: false, 
        error: 'Please allow popups for this site and try again.' 
      };
    }

    // auth/account-exists-with-different-credential
    if (code === 'auth/account-exists-with-different-credential') {
      return {
        success: false,
        error: 'This email is already registered with another sign-in method. Please use that method.'
      };
    }

    // auth/network-request-failed
    if (code === 'auth/network-request-failed') {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }

    // Any other error
    return {
      success: false,
      error: 'Sign-in failed. Please try again.'
    };
  }
}

/**
 * Link an existing signed-in account with Google or GitHub
 */
export async function linkAccountWithOAuth(providerType: 'Google' | 'GitHub'): Promise<{ success: boolean; error?: string }> {
  if (!auth?.currentUser) {
    return { success: false, error: 'No active session found to link account.' };
  }
  try {
    let provider: GoogleAuthProvider | GithubAuthProvider;
    if (providerType === 'Google') {
      provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
    } else {
      provider = new GithubAuthProvider();
      provider.addScope('user:email');
    }
    await linkWithPopup(auth.currentUser, provider);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || `Failed to link ${providerType} account.` };
  }
}

/**
 * Complete and persist new social user profile
 */
export async function createSocialUserProfile(data: {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  department: string;
  institution?: string;
  studentId?: string;
  universityId?: string;
  authProvider: 'Google' | 'GitHub' | 'google' | 'github';
}): Promise<User> {
  // Enforce role security: role must NEVER be admin; strictly student, researcher or supervisor ONLY
  const allowedRoles: UserRole[] = ['student', 'researcher', 'supervisor'];
  const safeRole: UserRole = allowedRoles.includes(data.role) ? data.role : 'student';

  const providerLower = (data.authProvider || 'google').toLowerCase() as 'google' | 'github';
  const cleanStudentId = (data.studentId || data.universityId || '').trim();
  const createdAt = new Date().toISOString();

  let cleanPhotoURL = data.photoURL || '';
  if (cleanPhotoURL && providerLower === 'google') {
    cleanPhotoURL = cleanPhotoURL.replace('=s96-c', '=s400-c');
  }

  // Explicit Firestore document for users/{uid} as required
  const firestoreUserDoc = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    photoURL: cleanPhotoURL,
    provider: providerLower,
    role: safeRole,
    department: data.department || 'Computer Science and Engineering',
    studentId: cleanStudentId,
    verified: true,
    createdAt
  };

  if (db) {
    try {
      await setDoc(doc(db, 'users', data.uid), firestoreUserDoc, { merge: true });
    } catch (err) {
      console.warn('Failed to write users/{uid} doc to Firestore:', err);
    }
  }

  const defaultAvatar = cleanPhotoURL || (
    providerLower === 'google'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
  );

  const newUser: User = {
    id: data.uid,
    name: firestoreUserDoc.name,
    email: firestoreUserDoc.email,
    universityId: cleanStudentId || undefined,
    role: safeRole,
    status: 'active',
    avatar: defaultAvatar,
    headline: safeRole === 'student' 
      ? `${data.department} Student Scholar` 
      : safeRole === 'supervisor'
        ? 'Research Supervisor & Faculty Mentor'
        : 'Academic Researcher',
    department: data.department,
    institution: data.institution || 'Port City International University',
    bio: `Authenticated via ${providerLower === 'google' ? 'Google' : 'GitHub'} Single Sign-On. Collaborative academic researcher.`,
    interests: ['Artificial Intelligence', 'Data Science', 'Machine Learning', 'Software Systems'],
    skills: providerLower === 'github' 
      ? ['Git', 'Python', 'TypeScript', 'Docker', 'Open Source'] 
      : ['Research Methodology', 'Python', 'Data Analysis', 'Scientific Writing'],
    links: providerLower === 'github' ? {
      github: `https://github.com/${data.name.toLowerCase().replace(/\s+/g, '-')}`
    } : {},
    verified: true,
    authProvider: providerLower === 'google' ? 'Google' : 'GitHub',
    createdAt
  };

  storage.addUser(newUser);
  await publicProfileService.syncUserProfile(newUser);
  storage.setCurrentUser(newUser.id);
  notifyAuthListeners(newUser);
  return newUser;
}

export async function cancelSocialAuth(): Promise<void> {
  if (auth) {
    await fbSignOut(auth).catch(() => {});
  }
}

/**
 * Sign Out: calls signOut, destroys session state, triggers onAuthStateChanged with null
 */
export async function signOut(): Promise<void> {
  try {
    if (auth) {
      await fbSignOut(auth).catch(() => {});
    }
  } catch {
    // no-op
  }
  storage.logoutUser();
  notifyAuthListeners(null);
}

/**
 * Upload CV for the current authenticated user (PDF only, max 5MB)
 * Saves to Firebase Storage / User profile document
 */
export async function uploadUserCv(
  user: User, 
  file: File
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!file) {
    return { success: false, error: 'No file selected.' };
  }

  // Validate format
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return { success: false, error: 'Only PDF documents (.pdf) are accepted.' };
  }

  // Validate max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds the 5MB maximum limit.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const formattedSize = formatFileSize(file.size);

      const updatedUser: User = {
        ...user,
        cvUrl: dataUrl,
        cvFileName: file.name,
        cvFileSize: formattedSize,
        cvFileData: dataUrl
      };

      storage.updateUser(updatedUser);
      notifyAuthListeners(updatedUser);

      resolve({
        success: true,
        user: updatedUser
      });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to process file upload.' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Apply to Join Research Project with strict validation:
 * - User must be authenticated
 * - User cannot be project owner
 * - Project cannot be closed or full
 * - User cannot apply twice
 * - Stores document in Firestore schema
 */
export async function submitProjectApplication(params: {
  projectId: string;
  projectTitle: string;
  projectThumbnail: string;
  user: User;
  message: string;
  skillsNote?: string;
  cvFileName?: string;
  cvFileSize?: string;
  cvFileData?: string;
}): Promise<{ success: boolean; application?: Application; error?: string }> {
  const { projectId, projectTitle, projectThumbnail, user, message, skillsNote, cvFileName, cvFileSize, cvFileData } = params;

  if (!user || !user.id) {
    return { success: false, error: 'Please log in to submit an application.' };
  }

  const project = storage.getProject(projectId);
  if (!project) {
    return { success: false, error: 'Research project not found.' };
  }

  // Rule 1: Project owner/supervisor cannot apply
  if (project.supervisorId === user.id) {
    return { success: false, error: 'You are the supervisor of this project and cannot apply.' };
  }

  // Rule 2: Positions filled check
  if (project.filledPositions >= project.totalPositions || project.status === 'closed') {
    return { success: false, error: 'This project has already filled all available research positions.' };
  }

  // Rule 3: Single application per user per project
  const existingApps = storage.getUserApplications(user.id);
  const alreadyApplied = existingApps.find(a => a.projectId === projectId);
  if (alreadyApplied) {
    return { success: false, error: 'You have already submitted an application for this project.' };
  }

  // Create Firestore application document
  const newApp: Application = storage.createApplication({
    projectId,
    projectTitle,
    projectThumbnail,
    userId: user.id,
    applicantUid: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userEmail: user.email,
    userDepartment: user.department,
    message: message.trim(),
    skills: skillsNote?.trim(),
    skillsNote: skillsNote?.trim(),
    cvUrl: cvFileData || user.cvUrl,
    cvFileName: cvFileName || user.cvFileName,
    cvFileSize: cvFileSize || user.cvFileSize,
    cvFileData: cvFileData || user.cvFileData
  });

  return {
    success: true,
    application: newApp
  };
}
