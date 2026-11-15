import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { db, auth } from './firebaseAuth';
import { MentorFeedback, Project, TeamMember, User, Application } from '../types';
import { storage } from './storage';

const LOCAL_FEEDBACK_KEY = 'collabx_mentor_feedback_v1';

function readLocalFeedback(): MentorFeedback[] {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalFeedback(items: MentorFeedback[]): void {
  try {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const FEEDBACK_ASPECT_TAGS = [
  'Clear Guidance',
  'Responsive Communication',
  'Supportive Mentor',
  'Strong Technical Direction',
  'Fair Workload',
  'Great Lab Culture'
];

class FeedbackService {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }

  /**
   * Synchronous read of cached feedback for a project.
   */
  getCachedFeedbackForProject(projectId: string): MentorFeedback[] {
    return readLocalFeedback()
      .filter(f => f.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Synchronous read of cached feedback for a supervisor / researcher across all projects.
   */
  getCachedFeedbackForMentor(mentorId: string): MentorFeedback[] {
    return readLocalFeedback()
      .filter(f => f.mentorId === mentorId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Fetch feedback for a specific project from Firestore (with local cache merge).
   */
  async fetchFeedbackForProject(projectId: string): Promise<MentorFeedback[]> {
    const localAll = readLocalFeedback();
    if (db) {
      try {
        const q = query(
          collection(db, 'mentorFeedback'),
          where('projectId', '==', projectId)
        );
        const snap = await getDocs(q);
        const remoteMap = new Map<string, MentorFeedback>();
        localAll.forEach(item => remoteMap.set(item.id, item));
        snap.forEach(docSnap => {
          const data = docSnap.data() as MentorFeedback;
          remoteMap.set(docSnap.id, { ...data, id: docSnap.id });
        });
        const merged = Array.from(remoteMap.values());
        writeLocalFeedback(merged);
        return merged
          .filter(f => f.projectId === projectId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch {
        // Fallback cleanly to local cache
      }
    }
    return this.getCachedFeedbackForProject(projectId);
  }

  /**
   * Fetch all feedback received by a supervisor or researcher across projects.
   */
  async fetchFeedbackForMentor(mentorId: string): Promise<MentorFeedback[]> {
    const localAll = readLocalFeedback();
    if (db) {
      try {
        const q = query(
          collection(db, 'mentorFeedback'),
          where('mentorId', '==', mentorId)
        );
        const snap = await getDocs(q);
        const remoteMap = new Map<string, MentorFeedback>();
        localAll.forEach(item => remoteMap.set(item.id, item));
        snap.forEach(docSnap => {
          const data = docSnap.data() as MentorFeedback;
          remoteMap.set(docSnap.id, { ...data, id: docSnap.id });
        });
        const merged = Array.from(remoteMap.values());
        writeLocalFeedback(merged);
        return merged
          .filter(f => f.mentorId === mentorId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch {
        // Fallback cleanly to local cache
      }
    }
    return this.getCachedFeedbackForMentor(mentorId);
  }

  /**
   * Compute summary metrics from a feedback list (no fake defaults).
   */
  computeSummary(items: MentorFeedback[]): { average: number; count: number } {
    if (!items || items.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = items.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    return {
      average: Number((sum / items.length).toFixed(1)),
      count: items.length
    };
  }

  /**
   * Determines whether the signed-in user works under this project's supervisor/researcher
   * and is therefore eligible to submit feedback.
   */
  canCollaboratorLeaveFeedback(
    user: User | null,
    project: Project,
    teamMembers: TeamMember[],
    userApplications?: Application[]
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Please log in to submit mentorship feedback.' };
    }
    if (user.id === project.supervisorId) {
      return { allowed: false, reason: 'Project supervisors view collaborator feedback here.' };
    }

    // 1. Active member in this project team
    const isThisProjectMember = teamMembers.some(
      tm => tm.userId === user.id && tm.status !== 'removed'
    );
    if (isThisProjectMember) {
      return { allowed: true };
    }

    // 2. Approved applicant on this project
    const apps = userApplications || storage.getUserApplications(user.id);
    const hasApprovedOnThis = apps.some(
      a => a.projectId === project.id && a.status === 'approved'
    );
    if (hasApprovedOnThis) {
      return { allowed: true };
    }

    // 3. Collaborates or has worked under the same supervisor/researcher on another project
    const mentorProjects = storage.getProjects().filter(p => p.supervisorId === project.supervisorId);
    const allTeams = storage.getTeamMembers();
    const worksUnderMentorElsewhere = mentorProjects.some(mp =>
      allTeams.some(tm => tm.projectId === mp.id && tm.userId === user.id && tm.status !== 'removed') ||
      apps.some(a => a.projectId === mp.id && a.status === 'approved')
    );
    if (worksUnderMentorElsewhere) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Only students and researchers working under ${project.supervisorName} can submit feedback.`
    };
  }

  /**
   * Submit or update feedback for a supervisor/researcher on a project.
   * Document ID = `${projectId}_${authorId}` (one feedback per collaborator per project).
   */
  async submitFeedback(params: {
    project: Project;
    author: User;
    rating: number;
    tags: string[];
    comment: string;
  }): Promise<MentorFeedback> {
    const cleanRating = Math.min(5, Math.max(1, Math.round(params.rating)));
    const cleanComment = params.comment.trim();
    const docId = `${params.project.id}_${params.author.id}`;
    const now = new Date().toISOString();

    const existingList = readLocalFeedback();
    const existing = existingList.find(f => f.id === docId);

    const feedbackItem: MentorFeedback = {
      id: docId,
      projectId: params.project.id,
      projectTitle: params.project.title,
      mentorId: params.project.supervisorId,
      mentorName: params.project.supervisorName,
      authorId: params.author.id,
      authorName: params.author.name,
      authorAvatar: params.author.avatar || '',
      authorRole: params.author.role,
      authorDepartment: params.author.department,
      rating: cleanRating,
      tags: Array.from(new Set(params.tags)),
      comment: cleanComment,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    const updatedList = existing
      ? existingList.map(item => (item.id === docId ? feedbackItem : item))
      : [feedbackItem, ...existingList];

    writeLocalFeedback(updatedList);

    if (db && auth?.currentUser && auth.currentUser.uid === params.author.id) {
      try {
        await setDoc(doc(db, 'mentorFeedback', docId), feedbackItem, { merge: true });
      } catch (err) {
        console.warn('Firestore mentorFeedback sync notice:', err);
      }
    }

    this.notify();
    return feedbackItem;
  }
}

export const feedbackService = new FeedbackService();
