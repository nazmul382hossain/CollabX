import { 
  User, 
  Project, 
  Application, 
  TeamMember, 
  Milestone, 
  ProjectFile, 
  Message, 
  NotificationItem, 
  CalendarEvent, 
  Paper, 
  ActivityLog, 
  ContactMessage, 
  AiDraft 
} from '../types';
import { 
  SEED_USERS, 
  SEED_PROJECTS, 
  SEED_APPLICATIONS, 
  SEED_TEAM_MEMBERS, 
  SEED_MILESTONES, 
  SEED_PROJECT_FILES, 
  SEED_MESSAGES, 
  SEED_NOTIFICATIONS, 
  SEED_EVENTS, 
  SEED_PAPERS, 
  SEED_ACTIVITY_LOGS, 
  SEED_CONTACT_MESSAGES 
} from '../data/seedData';

const STORAGE_KEYS = {
  AUTH_VERSION: 'collabx_auth_v2',
  USERS: 'collabx_users',
  SESSION_TOKEN: 'collabx_session_token',
  CURRENT_USER_ID: 'collabx_current_user_id',
  PROJECTS: 'collabx_projects',
  SAVED_PROJECTS: 'collabx_saved_projects', // map of userId -> projectId[]
  APPLICATIONS: 'collabx_applications',
  TEAM_MEMBERS: 'collabx_team_members',
  MILESTONES: 'collabx_milestones',
  FILES: 'collabx_files',
  MESSAGES: 'collabx_messages',
  NOTIFICATIONS: 'collabx_notifications',
  EVENTS: 'collabx_events',
  PAPERS: 'collabx_papers',
  SAVED_PAPERS: 'collabx_saved_papers', // map of userId -> paperId[]
  AI_DRAFTS: 'collabx_ai_drafts',
  CONTACT: 'collabx_contact_messages',
  NEWSLETTER: 'collabx_newsletter',
  ACTIVITY: 'collabx_activity_logs'
};

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    // Session Fixation & Bug Fix:
    // If the browser holds stale auto-login data from previous versions, purge it completely.
    const currentVersion = localStorage.getItem(STORAGE_KEYS.AUTH_VERSION);
    if (currentVersion !== 'v2_fixed') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(STORAGE_KEYS.AUTH_VERSION, 'v2_fixed');
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }

    // STRICT REQUIREMENT: DO NOT auto-login any user when site opens!
    // No default user ID is ever written to CURRENT_USER_ID.

    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    } else {
      try {
        const storedProjects: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
        let changed = false;
        const updated = storedProjects.map(p => {
          const seed = SEED_PROJECTS.find(sp => sp.id === p.id);
          if (seed && seed.thumbnail !== p.thumbnail) {
            changed = true;
            return { ...p, thumbnail: seed.thumbnail };
          }
          return p;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
        }
      } catch {
        // no-op
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(SEED_APPLICATIONS));
    } else {
      try {
        const storedApps: Application[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
        let changed = false;
        const updated = storedApps.map(a => {
          const seed = SEED_APPLICATIONS.find(sa => sa.id === a.id);
          if (seed && seed.projectThumbnail !== a.projectThumbnail) {
            changed = true;
            return { ...a, projectThumbnail: seed.projectThumbnail };
          }
          return a;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
        }
      } catch {
        // no-op
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(SEED_TEAM_MEMBERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MILESTONES)) {
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(SEED_MILESTONES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(SEED_PROJECT_FILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(SEED_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAPERS)) {
      localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(SEED_PAPERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_PAPERS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_PAPERS, JSON.stringify({ 'user-ash': ['paper-1', 'paper-3'] }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(SEED_ACTIVITY_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTACT)) {
      localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(SEED_CONTACT_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEWSLETTER)) {
      localStorage.setItem(STORAGE_KEYS.NEWSLETTER, JSON.stringify(['student@portcity.edu.bd']));
    }
  }

  // --- USERS & SESSION ---
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  /**
   * Return current authenticated user ONLY if a valid session token exists
   * and the user account is active.
   */
  getCurrentUser(): User | null {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (!id || !token) return null;

    const user = this.getUser(id);
    if (!user || user.status === 'inactive') {
      // Clear stale/invalid session
      this.logoutUser();
      return null;
    }
    return user;
  }

  /**
   * Establish a secure authenticated session after successful credential check
   */
  establishAuthenticatedSession(user: User): string {
    // Clear prior session to prevent session fixation
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);

    const sessionToken = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);

    this.logActivity(user.id, user.name, user.avatar, 'logged in to CollabX', 'user', user.role);
    this.dispatchChange('user_logged_in');
    return sessionToken;
  }

  logoutUser(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    this.dispatchChange('user_logged_out');
  }

  setCurrentUser(id: string): User | undefined {
    const user = this.getUser(id);
    if (user && user.status === 'active') {
      this.establishAuthenticatedSession(user);
      return user;
    }
    return undefined;
  }

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => u.id === updated.id ? updated : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.dispatchChange('user_updated');
  }

  addUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.logActivity(user.id, user.name, user.avatar, 'joined CollabX as', 'user', user.role);
    this.dispatchChange('user_added');
  }

  // --- PROJECTS ---
  getProjects(): Project[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const list: Project[] = raw ? JSON.parse(raw) : SEED_PROJECTS;
    return list.map(p => {
      const seed = SEED_PROJECTS.find(s => s.id === p.id);
      if (seed && seed.thumbnail !== p.thumbnail) {
        return { ...p, thumbnail: seed.thumbnail };
      }
      return p;
    });
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  }

  addProject(project: Project): void {
    const projects = this.getProjects();
    projects.unshift(project);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    // Auto-create initial milestone
    const initialMilestones: Milestone[] = [
      { id: `m-${Date.now()}-1`, projectId: project.id, title: 'Literature Review & Prior Art', percent: 0, sortOrder: 1, dueDate: project.deadline, completed: false },
      { id: `m-${Date.now()}-2`, projectId: project.id, title: 'Experimental Setup & Data', percent: 0, sortOrder: 2, dueDate: project.deadline, completed: false },
      { id: `m-${Date.now()}-3`, projectId: project.id, title: 'Model / System Development', percent: 0, sortOrder: 3, dueDate: project.deadline, completed: false },
      { id: `m-${Date.now()}-4`, projectId: project.id, title: 'Evaluation & Final Paper', percent: 0, sortOrder: 4, dueDate: project.deadline, completed: false }
    ];
    const milestones = this.getMilestones();
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify([...milestones, ...initialMilestones]));

    // Auto-add owner as team member
    const team = this.getTeamMembers();
    team.push({
      id: `tm-${Date.now()}`,
      projectId: project.id,
      userId: project.supervisorId,
      name: project.supervisorName,
      email: this.getUser(project.supervisorId)?.email || 'supervisor@portcity.edu.bd',
      avatar: project.supervisorAvatar,
      role: 'supervisor',
      positionTitle: 'Supervisor & Principal Investigator',
      status: 'active',
      joinedAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(team));

    this.logActivity(project.supervisorId, project.supervisorName, project.supervisorAvatar, 'published research project', 'project', project.title);
    this.dispatchChange('project_added');
  }

  updateProject(updated: Project): void {
    const projects = this.getProjects().map(p => p.id === updated.id ? updated : p);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    this.dispatchChange('project_updated');
  }

  deleteProject(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    this.dispatchChange('project_deleted');
  }

  incrementProjectView(id: string): void {
    const projects = this.getProjects();
    const target = projects.find(p => p.id === id);
    if (target) {
      target.views += 1;
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }
  }

  // --- SAVED PROJECTS ---
  getSavedProjectIds(userId: string): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS);
    const map = raw ? JSON.parse(raw) : {};
    return map[userId] || [];
  }

  toggleSaveProject(userId: string, projectId: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS);
    const map = raw ? JSON.parse(raw) : {};
    const list = map[userId] || [];
    const index = list.indexOf(projectId);
    let isSaved = false;

    if (index > -1) {
      list.splice(index, 1);
      isSaved = false;
    } else {
      list.push(projectId);
      isSaved = true;
    }

    map[userId] = list;
    localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(map));
    this.dispatchChange('saved_projects_updated');
    return isSaved;
  }

  // --- APPLICATIONS ---
  getApplications(): Application[] {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    const list: Application[] = raw ? JSON.parse(raw) : SEED_APPLICATIONS;
    return list.map(a => {
      const seed = SEED_APPLICATIONS.find(s => s.id === a.id);
      if (seed) {
        return {
          ...a,
          projectThumbnail: seed.projectThumbnail,
          cvFileName: a.cvFileName || seed.cvFileName,
          cvFileSize: a.cvFileSize || seed.cvFileSize
        };
      }
      return a;
    });
  }

  getUserApplications(userId: string): Application[] {
    return this.getApplications().filter(a => a.userId === userId);
  }

  getProjectApplications(projectId: string): Application[] {
    return this.getApplications().filter(a => a.projectId === projectId);
  }

  createApplication(app: Omit<Application, 'id' | 'appliedDate' | 'status'>): Application {
    const applications = this.getApplications();
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}`,
      status: 'pending',
      appliedDate: new Date().toISOString()
    };
    applications.unshift(newApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

    // Notify project supervisor
    const project = this.getProject(app.projectId);
    if (project) {
      this.addNotification({
        userId: project.supervisorId,
        type: 'new_project',
        title: 'New Project Application Received',
        body: `${app.userName} applied to join "${project.title}".`,
        link: `/projects/${project.id}/team`,
        isRead: false
      });
    }

    this.logActivity(app.userId, app.userName, app.userAvatar, 'applied to join', 'project', app.projectTitle);
    this.dispatchChange('application_created');
    return newApp;
  }

  updateApplicationStatus(id: string, status: 'approved' | 'rejected', responseNote?: string): void {
    const applications = this.getApplications();
    const app = applications.find(a => a.id === id);
    if (!app) return;

    app.status = status;
    app.responseNote = responseNote;
    app.decidedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

    const project = this.getProject(app.projectId);

    if (status === 'approved' && project) {
      // Add to team members
      const team = this.getTeamMembers();
      if (!team.some(t => t.projectId === app.projectId && t.userId === app.userId)) {
        team.push({
          id: `tm-${Date.now()}`,
          projectId: app.projectId,
          userId: app.userId,
          name: app.userName,
          email: app.userEmail,
          avatar: app.userAvatar,
          role: 'member',
          positionTitle: 'Research Contributor',
          status: 'active',
          joinedAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(team));
      }

      // Increment filled positions
      if (project.filledPositions < project.totalPositions) {
        project.filledPositions += 1;
        this.updateProject(project);
      }

      // Send approval notification
      this.addNotification({
        userId: app.userId,
        type: 'application_approved',
        title: 'Application Approved! 🎉',
        body: `Congratulations! Your application to "${app.projectTitle}" has been approved.`,
        link: `/projects/${app.projectId}`,
        isRead: false
      });
    } else if (status === 'rejected') {
      this.addNotification({
        userId: app.userId,
        type: 'application_rejected',
        title: 'Application Update',
        body: `Your application to "${app.projectTitle}" was not accepted at this time.`,
        link: `/applications`,
        isRead: false
      });
    }

    this.dispatchChange('application_updated');
  }

  withdrawApplication(id: string): void {
    const applications = this.getApplications();
    const app = applications.find(a => a.id === id);
    if (app && app.status === 'pending') {
      app.status = 'withdrawn';
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
      this.dispatchChange('application_updated');
    }
  }

  // --- TEAM MEMBERS ---
  getTeamMembers(projectId?: string): TeamMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    const members: TeamMember[] = raw ? JSON.parse(raw) : SEED_TEAM_MEMBERS;
    return projectId ? members.filter(m => m.projectId === projectId) : members;
  }

  inviteTeamMember(projectId: string, user: User, positionTitle: string): void {
    const members = this.getTeamMembers();
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      projectId,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: 'member',
      positionTitle,
      status: 'active',
      joinedAt: new Date().toISOString()
    };
    members.push(newMember);
    localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members));

    const project = this.getProject(projectId);
    if (project && project.filledPositions < project.totalPositions) {
      project.filledPositions += 1;
      this.updateProject(project);
    }

    this.addNotification({
      userId: user.id,
      type: 'team_invite',
      title: 'Added to Research Team',
      body: `You were added to "${project?.title || 'Project'}" as ${positionTitle}.`,
      link: `/projects/${projectId}/team`,
      isRead: false
    });

    this.dispatchChange('team_updated');
  }

  removeTeamMember(projectId: string, userId: string): void {
    let members = this.getTeamMembers();
    members = members.filter(m => !(m.projectId === projectId && m.userId === userId));
    localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members));

    const project = this.getProject(projectId);
    if (project && project.filledPositions > 1) {
      project.filledPositions -= 1;
      this.updateProject(project);
    }

    this.dispatchChange('team_updated');
  }

  // --- MILESTONES ---
  getMilestones(projectId?: string): Milestone[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const all: Milestone[] = raw ? JSON.parse(raw) : SEED_MILESTONES;
    return projectId ? all.filter(m => m.projectId === projectId) : all;
  }

  updateMilestone(milestoneId: string, percent: number): void {
    const all = this.getMilestones();
    const target = all.find(m => m.id === milestoneId);
    if (!target) return;

    target.percent = Math.min(100, Math.max(0, percent));
    target.completed = target.percent === 100;
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));

    // Recalculate project overall progress
    const projectMilestones = all.filter(m => m.projectId === target.projectId);
    if (projectMilestones.length > 0) {
      const avg = Math.round(projectMilestones.reduce((sum, m) => sum + m.percent, 0) / projectMilestones.length);
      const project = this.getProject(target.projectId);
      if (project) {
        project.progressPercent = avg;
        this.updateProject(project);
      }
    }

    this.dispatchChange('milestone_updated');
  }

  addMilestone(milestone: Omit<Milestone, 'id'>): void {
    const all = this.getMilestones();
    all.push({ ...milestone, id: `m-${Date.now()}` });
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));
    this.dispatchChange('milestone_updated');
  }

  // --- MESSAGES / CHAT ---
  getMessages(projectId: string): Message[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const all: Message[] = raw ? JSON.parse(raw) : SEED_MESSAGES;
    return all.filter(m => m.projectId === projectId);
  }

  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const all: Message[] = raw ? JSON.parse(raw) : SEED_MESSAGES;
    const newMsg: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now'
    };
    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    this.dispatchChange('message_sent');

    // Automatically create notifications for all collaborators / recipients
    try {
      const recipientIds = new Set<string>();

      if (message.recipientId && message.recipientId !== message.senderId) {
        recipientIds.add(message.recipientId);
      } else {
        const project = this.getProject(message.projectId);
        const team = this.getTeamMembers(message.projectId);

        if (project && project.supervisorId && project.supervisorId !== message.senderId) {
          recipientIds.add(project.supervisorId);
        }

        team.forEach(m => {
          if (m.userId && m.userId !== message.senderId) {
            recipientIds.add(m.userId);
          }
        });
      }

      const project = this.getProject(message.projectId);
      const projectTitle = project?.title || 'Project Workspace';
      const preview = message.body.length > 80 ? message.body.substring(0, 80) + '...' : message.body;

      recipientIds.forEach(targetUserId => {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: targetUserId,
          type: 'new_message',
          title: `New Message from ${message.senderName}`,
          body: `[${projectTitle}]: ${preview}`,
          link: `/projects/${message.projectId}/discussion`,
          isRead: false,
          createdAt: 'Just now'
        };

        this.addNotification(notif);

        try {
          window.dispatchEvent(new CustomEvent('collabx_new_notification', { detail: notif }));
        } catch {
          // no-op
        }
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return newMsg;
  }

  // --- PROJECT FILES ---
  getProjectFiles(projectId: string): ProjectFile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    const all: ProjectFile[] = raw ? JSON.parse(raw) : SEED_PROJECT_FILES;
    return all.filter(f => f.projectId === projectId);
  }

  addProjectFile(file: Omit<ProjectFile, 'id' | 'uploadedAt'>): ProjectFile {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    const all: ProjectFile[] = raw ? JSON.parse(raw) : SEED_PROJECT_FILES;
    const newFile: ProjectFile = {
      ...file,
      id: `file-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    all.unshift(newFile);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(all));
    this.dispatchChange('file_added');
    return newFile;
  }

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): NotificationItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    return all.filter(n => n.userId === userId);
  }

  markNotificationAsRead(id: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    const item = all.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      this.dispatchChange('notification_updated');
    }
  }

  markAllNotificationsAsRead(userId: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    all.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.dispatchChange('notification_updated');
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt'>): void {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    all.unshift({
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: 'Just now'
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.dispatchChange('notification_updated');
  }

  // --- CALENDAR EVENTS ---
  getEvents(userId?: string): CalendarEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const all: CalendarEvent[] = raw ? JSON.parse(raw) : SEED_EVENTS;
    return userId ? all.filter(e => !e.userId || e.userId === userId) : all;
  }

  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const all: CalendarEvent[] = raw ? JSON.parse(raw) : SEED_EVENTS;
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt-${Date.now()}`
    };
    all.push(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(all));
    this.dispatchChange('event_added');
    return newEvent;
  }

  deleteEvent(id: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const all: CalendarEvent[] = raw ? JSON.parse(raw) : SEED_EVENTS;
    const filtered = all.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
    this.dispatchChange('event_deleted');
  }

  // --- RESEARCH PAPERS ---
  getPapers(): Paper[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAPERS);
    return raw ? JSON.parse(raw) : SEED_PAPERS;
  }

  getPaper(id: string): Paper | undefined {
    return this.getPapers().find(p => p.id === id);
  }

  addPaper(paper: Omit<Paper, 'id' | 'views' | 'downloads' | 'likes' | 'createdAt'>): Paper {
    const papers = this.getPapers();
    const newPaper: Paper = {
      ...paper,
      id: `paper-${Date.now()}`,
      views: 1,
      downloads: 0,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    papers.unshift(newPaper);
    localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
    this.logActivity(newPaper.uploaderId, newPaper.uploaderName, newPaper.uploaderAvatar, 'published research paper', 'paper', newPaper.title);
    this.dispatchChange('paper_added');
    return newPaper;
  }

  likePaper(paperId: string): void {
    const papers = this.getPapers();
    const target = papers.find(p => p.id === paperId);
    if (target) {
      target.likes += 1;
      localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
      this.dispatchChange('paper_updated');
    }
  }

  incrementPaperDownload(paperId: string): void {
    const papers = this.getPapers();
    const target = papers.find(p => p.id === paperId);
    if (target) {
      target.downloads += 1;
      localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
      this.dispatchChange('paper_updated');
    }
  }

  // --- AI DRAFTS ---
  getAiDrafts(userId: string): AiDraft[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_DRAFTS);
    const all: AiDraft[] = raw ? JSON.parse(raw) : [];
    return all.filter(d => d.userId === userId);
  }

  saveAiDraft(draft: AiDraft): void {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_DRAFTS);
    const all: AiDraft[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex(d => d.id === draft.id);
    if (index >= 0) {
      all[index] = draft;
    } else {
      all.unshift(draft);
    }
    localStorage.setItem(STORAGE_KEYS.AI_DRAFTS, JSON.stringify(all));
    this.dispatchChange('ai_drafts_updated');
  }

  deleteAiDraft(id: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_DRAFTS);
    const all: AiDraft[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.AI_DRAFTS, JSON.stringify(filtered));
    this.dispatchChange('ai_drafts_updated');
  }

  // --- CONTACT & NEWSLETTER ---
  addContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): void {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACT);
    const all: ContactMessage[] = raw ? JSON.parse(raw) : SEED_CONTACT_MESSAGES;
    all.unshift({
      ...msg,
      id: `cmsg-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(all));
    this.dispatchChange('contact_updated');
  }

  getContactMessages(): ContactMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACT);
    return raw ? JSON.parse(raw) : SEED_CONTACT_MESSAGES;
  }

  subscribeNewsletter(email: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.NEWSLETTER);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      localStorage.setItem(STORAGE_KEYS.NEWSLETTER, JSON.stringify(list));
      return true;
    }
    return false;
  }

  // --- ACTIVITY LOGS ---
  getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return raw ? JSON.parse(raw) : SEED_ACTIVITY_LOGS;
  }

  private logActivity(userId: string, userName: string, userAvatar: string, action: string, entityType: string, entityTitle: string): void {
    const logs = this.getActivityLogs();
    logs.unshift({
      id: `act-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      action,
      entityType,
      entityTitle,
      createdAt: 'Just now'
    });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs.slice(0, 50)));
    this.dispatchChange('activity_logged');
  }

  private dispatchChange(eventType: string) {
    window.dispatchEvent(new CustomEvent('collabx_storage_change', { detail: { eventType } }));
  }
}

export const storage = new StorageService();
