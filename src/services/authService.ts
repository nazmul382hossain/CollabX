// =====================================================================
// CollabX Authentication & Session Management Service
// Strict credentials verification, password hashing, and session guards
// =====================================================================

import { User, UserRole } from '../types';
import { storage } from './storage';
import { hashPassword, verifyPassword, generateSalt } from './cryptoUtils';
import { ASSETS } from '../data/assets';
import { publicProfileService } from './publicProfileService';
import { db, auth } from './firebaseAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword as fbSignIn,
  sendPasswordResetEmail, 
  fetchSignInMethodsForEmail, 
  ActionCodeSettings,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';

export interface RequestPasswordResetResult {
  success: boolean;
  error?: string;
  isSocialOnly?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  redirect?: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  universityId?: string;
  department?: string;
  institution?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

class AuthService {
  /**
   * Validate email format according to standard RFC 5322 pattern
   */
  public isValidEmail(email: string): boolean {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email.trim());
  }

  /**
   * Validate password complexity: minimum 8 characters, at least 1 letter and 1 digit
   */
  public validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return { valid: false, error: 'Password must contain at least one letter and one number.' };
    }
    return { valid: true };
  }

  /**
   * Determine default dashboard based strictly on database role
   */
  public getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'supervisor':
      case 'researcher':
        return '/researcher';
      case 'student':
      default:
        return '/dashboard';
    }
  }

  /**
   * Authenticate user credentials against the persistent users store
   * Enforces:
   * 1. Non-empty email & password
   * 2. Parameterized user search
   * 3. Password hash verification
   * 4. Account active status check
   * 5. Session token generation (clears prior session to prevent fixation)
   * 6. Generic failure error to prevent account enumeration
   */
  public async login(emailInput: string, passwordInput: string): Promise<LoginResult> {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const cleanPassword = passwordInput || '';

    // Validation: empty email or password
    if (!cleanEmail || !cleanPassword) {
      return {
        success: false,
        error: 'Please enter both email and password.'
      };
    }

    if (!this.isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      };
    }

    // Attempt authentic Firebase Auth & Firestore verification first
    if (auth && db) {
      try {
        const cred = await fbSignIn(auth, cleanEmail, cleanPassword);
        const fbUser = cred.user;
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const firestoreUser = userSnap.data() as User;
          if (firestoreUser.status === 'inactive') {
            return {
              success: false,
              error: 'Your account is currently disabled or inactive. Please contact the administrator.'
            };
          }

          const account: User = {
            ...firestoreUser,
            id: fbUser.uid,
            email: fbUser.email || cleanEmail,
            role: firestoreUser.role || 'student'
          };

          storage.updateUser(account);
          storage.establishAuthenticatedSession(account);

          return {
            success: true,
            user: account,
            redirect: this.getDashboardRoute(account.role)
          };
        }
      } catch (fbErr: any) {
        console.warn('Firebase login attempt notice:', fbErr?.code);
      }
    }

    // Look up user in database
    const users = storage.getUsers();
    const account = users.find(u => u.email.toLowerCase() === cleanEmail);

    // If account does not exist -> REJECT with generic message
    if (!account) {
      return {
        success: false,
        error: 'Invalid email or password.'
      };
    }

    // Verify submitted password against stored password hash
    const isPasswordValid = await verifyPassword(cleanPassword, account.passwordHash, account.salt);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password.'
      };
    }

    // Verify account active status
    if (account.status === 'inactive') {
      return {
        success: false,
        error: 'Your account is currently disabled or inactive. Please contact the administrator.'
      };
    }

    if (account.status === 'pending') {
      return {
        success: false,
        error: 'Your account registration is currently pending administrative verification.'
      };
    }

    // Regenerate and establish session
    storage.establishAuthenticatedSession(account);

    return {
      success: true,
      user: account,
      redirect: this.getDashboardRoute(account.role)
    };
  }

  /**
   * Register a new user in the database
   * Enforces:
   * 1. Required field checks
   * 2. Email format validation
   * 3. Duplicate email check
   * 4. Duplicate university ID check (if provided)
   * 5. Password complexity & confirmation check
   * 6. Cryptographic password hashing
   * 7. Save into database
   * 8. Does NOT create an authenticated session (redirects to Login)
   */
  public async register(params: RegisterParams): Promise<RegisterResult> {
    const name = (params.name || '').trim();
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const password = params.password || '';
    const confirmPassword = params.confirmPassword || '';
    // Enforce allowed public registration roles (admin is strictly forbidden from client creation)
    const rawRole = params.role || 'student';
    const role: UserRole = (rawRole === 'supervisor' || rawRole === 'researcher') ? rawRole : 'student';
    const universityId = (params.universityId || '').trim();
    const department = (params.department || 'Computer Science and Engineering').trim();
    const institution = (params.institution || 'Port City International University').trim();

    // 1. Required fields
    if (!name) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Academic email address is required.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    // 2. Email format validation
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid academic email address.' };
    }

    // 3. Duplicate email check
    const existingUsers = storage.getUsers();
    const emailExists = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please log in.'
      };
    }

    // 4. Duplicate university ID check
    if (universityId) {
      const idExists = existingUsers.some(
        u => u.universityId && u.universityId.toLowerCase() === universityId.toLowerCase()
      );
      if (idExists) {
        return {
          success: false,
          error: 'An account with this University ID already exists.'
        };
      }
    }

    // 5. Password complexity check
    const pwValidation = this.validatePassword(password);
    if (!pwValidation.valid) {
      return { success: false, error: pwValidation.error };
    }

    // 6. Password confirmation check
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    // 7. Secure password hashing
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);

    // 8. Select appropriate avatar and headline
    const avatar = role === 'student' 
      ? ASSETS.avatars.ash 
      : role === 'supervisor' 
        ? ASSETS.avatars.drFahim 
        : ASSETS.avatars.brock;

    const headline = role === 'student'
      ? `${department} Student Researcher`
      : role === 'supervisor'
        ? `Research Supervisor & Faculty Mentor`
        : `Academic Researcher`;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: cleanEmail,
      passwordHash,
      salt,
      universityId: universityId || undefined,
      role,
      status: 'active',
      avatar,
      headline,
      department,
      institution,
      bio: `CollabX ${role} collaborating in academic research and innovation projects.`,
      interests: ['Artificial Intelligence', 'Data Science'],
      skills: role === 'student' ? ['Python', 'Data Analysis'] : ['Research Methodology', 'Data Science'],
      links: {},
      verified: true,
      createdAt: new Date().toISOString()
    };

    // 9. Save new user into database and sync public profile
    storage.addUser(newUser);
    publicProfileService.syncUserProfile(newUser);

    // Return success without creating an authenticated session
    return {
      success: true,
      user: newUser,
      message: 'Account created successfully! Please log in with your credentials.'
    };
  }

  /**
   * Log out currently authenticated session
   */
  public logout(): void {
    storage.logoutUser();
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): User | null {
    return storage.getCurrentUser();
  }

  /**
   * Check if a valid session exists
   */
  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Request password reset email using official Firebase Authentication
   * 1. Calls sendPasswordResetEmail(auth, email)
   * 2. Returns neutral success in all valid cases (does not disclose if email exists)
   * 3. Checks if user only signed in with Google or GitHub (no password provider)
   * 4. Handles auth/invalid-email, auth/too-many-requests, auth/network-request-failed
   */
  public async requestPasswordReset(emailInput: string): Promise<RequestPasswordResetResult> {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Check if account only signed in with Google or GitHub (no password provider)
    let isSocialOnly = false;
    const users = storage.getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser && !existingUser.passwordHash) {
      isSocialOnly = true;
    }

    if (auth) {
      // Check Firebase sign-in methods for email if possible
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        if (methods.length > 0 && !methods.includes('password')) {
          if (methods.includes('google.com') || methods.includes('github.com')) {
            isSocialOnly = true;
          }
        }
      } catch {
        // May fail if email enumeration protection is active in GCP; fallback to local check
      }

      try {
        const continueUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/#/login?passwordReset=1';
        const actionCodeSettings: ActionCodeSettings = {
          url: continueUrl,
          handleCodeInApp: false
        };

        try {
          await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
        } catch (actionErr: any) {
          // If current domain is not yet whitelisted in Firebase Auth Authorized domains,
          // smoothly fall back to default hosted action URL so the reset email is still dispatched!
          if (actionErr?.code === 'auth/unauthorized-continue-uri') {
            console.warn(
              '[CollabX Auth] Continue URL domain not yet added to Firebase Authorized domains. Falling back to default URL:',
              actionErr
            );
            await sendPasswordResetEmail(auth, cleanEmail);
          } else {
            throw actionErr;
          }
        }
      } catch (err: unknown) {
        const fbErr = err as { code?: string; message?: string };
        const code = fbErr?.code || '';

        // If email does not exist in Firebase, do not reveal account existence to prevent enumeration
        if (code === 'auth/user-not-found') {
          return {
            success: true,
            isSocialOnly
          };
        }

        // Friendly error messages for specific Firebase Auth error codes
        if (code === 'auth/invalid-email') {
          return { success: false, error: 'Please enter a valid email address.' };
        }
        if (code === 'auth/too-many-requests') {
          return { success: false, error: 'Too many requests. Please wait a few moments before trying again.' };
        }
        if (code === 'auth/network-request-failed') {
          return { success: false, error: 'Network error. Please check your internet connection and try again.' };
        }

        console.warn('Firebase sendPasswordResetEmail error:', err);
        return {
          success: false,
          error: 'Unable to send password reset email at this moment. Please try again later.'
        };
      }
    }

    return {
      success: true,
      isSocialOnly
    };
  }

  /**
   * Verify an action code (oobCode) from a password reset email link
   * (Available for custom /auth-action reset page once published)
   */
  public async verifyPasswordResetCode(code: string): Promise<{ success: boolean; email?: string; error?: string }> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (err: any) {
      const fbCode = err?.code || '';
      if (fbCode === 'auth/expired-action-code') {
        return { success: false, error: 'The password reset link has expired. Please request a new one.' };
      }
      if (fbCode === 'auth/invalid-action-code') {
        return { success: false, error: 'The password reset link is invalid or has already been used.' };
      }
      return { success: false, error: err?.message || 'Invalid or expired reset link.' };
    }
  }

  /**
   * Confirm password reset with Firebase action code (oobCode) and new password
   * (Available for custom /auth-action reset page once published)
   */
  public async confirmPasswordReset(code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }
    const validation = this.validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true };
    } catch (err: any) {
      const fbCode = err?.code || '';
      if (fbCode === 'auth/expired-action-code') {
        return { success: false, error: 'The password reset link has expired. Please request a new one.' };
      }
      if (fbCode === 'auth/invalid-action-code') {
        return { success: false, error: 'The password reset link is invalid or has already been used.' };
      }
      if (fbCode === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
      }
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  }
}

export const authService = new AuthService();
