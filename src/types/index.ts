export type UserRole = 'student' | 'researcher' | 'supervisor' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  universityId?: string;
  role: UserRole;
  status: UserStatus;
  authProvider?: 'password' | 'Google' | 'GitHub';
  avatar: string;
  headline: string;
  department: string;
  institution: string;
  bio: string;
  interests: string[];
  skills: string[];
  links: {
    github?: string;
    linkedin?: string;
    scholar?: string;
    orcid?: string;
    website?: string;
  };
  verified?: boolean;
  profileComplete?: boolean;
  institutionalId?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  emailVerified?: boolean;
  photoURL?: string;
  cvUrl?: string;
  cvFileName?: string;
  cvFileSize?: string;
  cvFileData?: string;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  uid?: string;
  name: string;
  photoURL?: string;
  avatar: string;
  headline: string;
  department: string;
  institution: string;
  role: UserRole;
  interests: string[];
  skills: string[];
  bio?: string;
  links?: {
    github?: string;
    linkedin?: string;
    scholar?: string;
    orcid?: string;
    website?: string;
  };
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchArea {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  bgPastel: string;
  projectCount: number;
  subfields: string[];
  description: string;
}

export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'upcoming' | 'closed';
export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ProjectType = 'Thesis' | 'Funded Research' | 'Course Project' | 'Open Source' | 'Competition' | 'Industry';

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  objectives: string[];
  expectedOutcome: string;
  methodology?: string;
  areaId: string;
  areaName: string;
  subarea?: string;
  projectType: ProjectType;
  difficulty: ProjectDifficulty;
  durationMonths: number;
  totalPositions: number;
  filledPositions: number;
  deadline: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  supervisorId: string;
  supervisorName: string;
  supervisorAvatar: string;
  supervisorDesignation: string;
  requiredSkills: string[];
  tags: string[];
  thumbnail: string;
  views: number;
  progressPercent: number;
  createdAt: string;
  rejectReason?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  projectThumbnail: string;
  userId: string;
  applicantUid?: string;
  userName: string;
  userAvatar: string;
  userEmail: string;
  userDepartment: string;
  message: string;
  skills?: string;
  skillsNote?: string;
  cvUrl?: string;
  cvFileName?: string;
  cvFileSize?: string;
  cvFileData?: string;
  status: ApplicationStatus;
  appliedDate: string;
  createdAt?: string;
  responseNote?: string;
  decidedAt?: string;
}

export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: 'supervisor' | 'owner' | 'member';
  positionTitle: string;
  status: 'active' | 'removed';
  joinedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  percent: number;
  sortOrder: number;
  dueDate: string;
  completed: boolean;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedBy: string;
  uploaderName: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId?: string;
  isSupervisor?: boolean;
  body: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
    url?: string;
    dataUrl?: string;
  };
}

export type NotificationType = 
  | 'application_approved' 
  | 'application_rejected' 
  | 'new_message' 
  | 'deadline' 
  | 'new_project' 
  | 'team_invite' 
  | 'paper_published' 
  | 'system';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export type EventType = 'meeting' | 'submission' | 'report' | 'presentation' | 'deadline' | 'other';

export interface CalendarEvent {
  id: string;
  userId?: string;
  projectId?: string;
  projectName?: string;
  title: string;
  type: EventType;
  eventDate: string; // YYYY-MM-DD
  eventTime: string;
  reminder: string;
  description: string;
}

export type PaperType = 'Journal' | 'Conference' | 'Thesis' | 'Preprint' | 'Report';
export type PaperVisibility = 'public' | 'members' | 'private';

export interface Paper {
  id: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  title: string;
  abstract: string;
  paperType: PaperType;
  areaId: string;
  areaName: string;
  year: number;
  doi?: string;
  authors: string[];
  keywords: string[];
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  pdfData?: string;
  coverImage?: string;
  visibility: PaperVisibility;
  aiAssisted?: boolean;
  views: number;
  downloads: number;
  likes: number;
  createdAt: string;
}

export interface PaperComment {
  id: string;
  paperId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  body: string;
  createdAt: string;
}

export interface AiDraft {
  id: string;
  userId: string;
  title: string;
  topic: string;
  paperType: string;
  targetWords: number;
  citationStyle: string;
  researchArea: string;
  outline: { title: string; prompt: string; completed?: boolean }[];
  sections: { [key: string]: string };
  fullContentHtml: string;
  verifiedReferences: {
    title: string;
    authors: string;
    year: number;
    doi: string;
    verified: boolean;
  }[];
  updatedAt: string;
}

export interface ExternalScholarlyResult {
  id: string;
  source: 'OpenAlex' | 'Crossref' | 'arXiv' | 'Semantic Scholar';
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  citedByCount?: number;
  abstract: string;
  oaPdfUrl?: string;
  url: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
  adminReply?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  entityType: string;
  entityTitle: string;
  createdAt: string;
}
