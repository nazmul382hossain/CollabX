import { doc, getDoc, getDocs, setDoc, collection } from 'firebase/firestore';
import { PublicProfile, User } from '../types';
import { db } from './firebaseAuth';
import { storage } from './storage';
import { SEED_USERS } from '../data/seedData';

const PUBLIC_PROFILES_STORAGE_KEY = 'collabx_public_profiles';

/**
 * Strips all sensitive, private, or credentials fields from a user object.
 * Returns ONLY publicly sharable profile fields.
 * Strictly NEVER includes: email, password, salt, cv files, session tokens, etc.
 */
export function sanitizeToPublicProfile(user: Partial<User> & { id: string }): PublicProfile {
  return {
    id: user.id,
    uid: user.id,
    name: user.name || 'Anonymous Researcher',
    photoURL: user.avatar || '',
    avatar: user.avatar || '',
    headline: user.headline || '',
    department: user.department || '',
    institution: user.institution || '',
    role: user.role || 'student',
    interests: Array.isArray(user.interests) ? [...user.interests] : [],
    skills: Array.isArray(user.skills) ? [...user.skills] : [],
    bio: user.bio || '',
    links: user.links ? { ...user.links } : {},
    verified: user.verified ?? false,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

class PublicProfileService {
  private cache: Map<string, PublicProfile> = new Map();
  private listeners: Set<() => void> = new Set();
  private isLoadedFromFirestore = false;

  constructor() {
    this.initFromLocal();
  }

  /**
   * Initializes in-memory cache from SEED_USERS (sanitized) and localStorage.
   */
  private initFromLocal(): void {
    // 1. Seed profiles (sanitized, zero emails)
    for (const seed of SEED_USERS) {
      this.cache.set(seed.id, sanitizeToPublicProfile(seed));
    }

    // 2. Load stored public profiles if any
    try {
      const raw = localStorage.getItem(PUBLIC_PROFILES_STORAGE_KEY);
      if (raw) {
        const storedList: PublicProfile[] = JSON.parse(raw);
        for (const item of storedList) {
          if (item && item.id) {
            this.cache.set(item.id, sanitizeToPublicProfile(item));
          }
        }
      }
    } catch {
      // Local storage parse fallback
    }

    // 3. Also populate from any local users (without their emails or sensitive data)
    try {
      const users = storage.getUsers();
      for (const u of users) {
        if (u && u.id && !this.cache.has(u.id)) {
          this.cache.set(u.id, sanitizeToPublicProfile(u));
        }
      }
    } catch {
      // fallback
    }
  }

  private persistCache(): void {
    try {
      const list = Array.from(this.cache.values());
      localStorage.setItem(PUBLIC_PROFILES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Storage quota or disabled fallback
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        // no-op
      }
    });
  }

  /**
   * Subscribe to public profile updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Synchronous getter for all public profiles currently in cache.
   * STRICTLY contains only public fields: no email, no cv files, no sensitive keys.
   */
  getPublicProfiles(): PublicProfile[] {
    return Array.from(this.cache.values());
  }

  /**
   * Synchronous getter for a specific public profile by user ID.
   */
  getPublicProfileById(userId: string): PublicProfile | undefined {
    if (!userId) return undefined;
    return this.cache.get(userId);
  }

  /**
   * Asynchronously fetches a single public profile from Firestore `publicProfiles/{userId}`.
   * If found, caches it and notifies subscribers.
   */
  async fetchPublicProfileFromFirestore(userId: string): Promise<PublicProfile | null> {
    if (!userId) return null;

    // Return cached if available
    const cached = this.cache.get(userId);

    if (db) {
      try {
        const docRef = doc(db, 'publicProfiles', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const sanitized = sanitizeToPublicProfile({ id: userId, ...data });
          this.cache.set(userId, sanitized);
          this.persistCache();
          return sanitized;
        }
      } catch (err) {
        console.warn(`Could not load public profile ${userId} from Firestore:`, err);
      }
    }

    return cached || null;
  }

  /**
   * Asynchronously fetches all public profiles from Firestore collection `publicProfiles`.
   */
  async fetchAllPublicProfilesFromFirestore(): Promise<PublicProfile[]> {
    if (this.isLoadedFromFirestore) {
      return this.getPublicProfiles();
    }

    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'publicProfiles'));
        querySnapshot.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const sanitized = sanitizeToPublicProfile({ id: docSnap.id, ...data });
            this.cache.set(docSnap.id, sanitized);
          }
        });
        this.isLoadedFromFirestore = true;
        this.persistCache();
      } catch (err) {
        console.warn('Could not load public profiles collection from Firestore:', err);
      }
    }

    return this.getPublicProfiles();
  }

  /**
   * Keeps both users/{uid} and publicProfiles/{uid} in sync whenever a user creates or edits their profile.
   * - users/{uid}: private document containing email, role, department, institution, avatar, status, etc.
   * - publicProfiles/{uid}: strictly public document with ONLY public fields (name, photoURL, headline, department, institution, role, interests, skills, bio, links). NO email!
   */
  async syncUserProfile(user: User): Promise<void> {
    if (!user || !user.id) return;

    // 1. Update sanitized public profile in memory & local storage
    const publicProfile = sanitizeToPublicProfile(user);
    this.cache.set(user.id, publicProfile);
    this.persistCache();

    // 2. Also keep local storage users updated
    storage.updateUser(user);

    // 3. If Firestore is active, update BOTH collections
    if (db) {
      try {
        // Document 1: publicProfiles/{userId} (ONLY public fields, zero email/passwords/CVs)
        const publicDocData: Record<string, any> = {
          id: user.id,
          uid: user.id,
          name: user.name,
          photoURL: user.avatar || '',
          avatar: user.avatar || '',
          headline: user.headline || '',
          department: user.department || '',
          institution: user.institution || '',
          role: user.role,
          interests: Array.isArray(user.interests) ? [...user.interests] : [],
          skills: Array.isArray(user.skills) ? [...user.skills] : [],
          bio: user.bio || '',
          links: user.links ? { ...user.links } : {},
          verified: user.verified ?? true,
          updatedAt: new Date().toISOString()
        };

        // Strict enforcement: strip out any private fields
        delete publicDocData.email;
        delete publicDocData.password;
        delete publicDocData.passwordHash;
        delete publicDocData.salt;
        delete publicDocData.cvUrl;
        delete publicDocData.cvFileName;
        delete publicDocData.cvFileSize;
        delete publicDocData.cvFileData;
        delete publicDocData.sessionToken;

        await setDoc(doc(db, 'publicProfiles', user.id), publicDocData, { merge: true });

        // Document 2: users/{userId} (Private account data, readable only by owner/admin)
        await setDoc(doc(db, 'users', user.id), {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          institution: user.institution,
          avatar: user.avatar,
          status: user.status,
          authProvider: user.authProvider || 'password',
          headline: user.headline || '',
          bio: user.bio || '',
          interests: user.interests || [],
          skills: user.skills || [],
          links: user.links || {},
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Notice: Firestore profile sync fallback:', err);
      }
    }
  }
}

export const publicProfileService = new PublicProfileService();
