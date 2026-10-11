import React, { useState, useEffect, useRef } from 'react';
import { storage } from './services/storage';
import { messagingService } from './services/messagingService';
import { User, NotificationItem } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { SearchModal } from './components/layout/SearchModal';
import { ShieldAlert, ArrowRight, UserCheck, Bell, X, MessageSquare } from 'lucide-react';
import { Button } from './components/common/Button';
import { signOut, onAuthStateChanged, initializeFirebaseAuth } from './services/firebaseAuth';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ResearchAreasPage } from './pages/ResearchAreasPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { SavedProjectsPage } from './pages/SavedProjectsPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResearcherDashboard } from './pages/ResearcherDashboard';
import { ProjectDiscussionPage } from './pages/ProjectDiscussionPage';
import { ProjectProgressPage } from './pages/ProjectProgressPage';
import { ProjectTeamPage } from './pages/ProjectTeamPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageProjectsPage } from './pages/ManageProjectsPage';
import { ManageUsersPage } from './pages/ManageUsersPage';
import { PapersPage } from './pages/PapersPage';
import { PaperDetailsPage } from './pages/PaperDetailsPage';
import { AiWriterPage } from './pages/AiWriterPage';
import { PublishProjectPage } from './pages/PublishProjectPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';
import { AboutPage, ContactPage, LegalPage } from './pages/AboutContactLegalPages';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  
  // Read path from URL Hash (HashRouter support) or query parameters
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      if (
        search.includes('oobCode') || 
        search.includes('mode=resetPassword') || 
        hash.includes('oobCode') || 
        hash.includes('mode=resetPassword') ||
        search.includes('passwordReset') ||
        hash.includes('passwordReset')
      ) {
        return '/login';
      }
      if (window.location.hash) {
        const hashPath = window.location.hash.replace('#', '').split('?')[0];
        return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
      }
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Reset scroll to absolute top on route navigation (instant, preventing any jump or scroll down)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentPath]);

  // Real-time live notifications subscription for currentUser (localStorage + Firestore)
  useEffect(() => {
    if (!currentUser) {
      setUnreadNotifications(0);
      return;
    }

    // Subscribe to live notifications updates
    const unsubscribe = messagingService.subscribeToUserNotifications(currentUser.id, (notifs) => {
      const unread = notifs.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    });

    // Listen for instant incoming notification toast
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail && customEvent.detail.userId === currentUser.id) {
        setActiveToast(customEvent.detail);
        setTimeout(() => {
          setActiveToast((prev: NotificationItem | null) => prev?.id === customEvent.detail.id ? null : prev);
        }, 6000);
      }
    };

    window.addEventListener('collabx_new_notification', handleNewNotification);

    return () => {
      unsubscribe();
      window.removeEventListener('collabx_new_notification', handleNewNotification);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    initializeFirebaseAuth();
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const handleStorageChange = () => {
      const user = storage.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('collabx_storage_change', handleStorageChange);
    return () => {
      unsubscribe();
      window.removeEventListener('collabx_storage_change', handleStorageChange);
    };
  }, []);

  // HashRouter hashchange event listener
  useEffect(() => {
    const handleHashChange = () => {
      const hashPath = window.location.hash.replace('#', '').split('?')[0];
      const clean = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
      setCurrentPath(clean || '/');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (path: string) => {
    const basePath = path.split('?')[0];
    setCurrentPath(basePath.startsWith('/') ? basePath : `/${basePath}`);
    window.location.hash = path;
    // Instant scroll to top on route change to prevent auto-scrolling to the bottom
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
    });
  };

  const handleSwitchUser = (userId: string) => {
    const switched = storage.setCurrentUser(userId);
    if (switched) {
      setCurrentUser(switched);
      // Route to role-specific dashboard per prompt
      if (switched.role === 'admin') handleNavigate('/admin');
      else if (switched.role === 'supervisor' || switched.role === 'researcher') handleNavigate('/researcher');
      else handleNavigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    handleNavigate('/');
  };

  // Determine if current page is inside the app shell (with sidebar)
  const isAppShellRoute = 
    currentUser !== null && 
    currentPath !== '/' && 
    currentPath !== '/login' && 
    currentPath !== '/register' &&
    currentPath !== '/about' &&
    currentPath !== '/contact' &&
    currentPath !== '/legal';

  // Workspace context checks
  const isWorkspaceContext = 
    currentPath.includes('/discussion') || 
    currentPath.includes('/progress') || 
    currentPath.includes('/team') ||
    currentPath.includes('/files');

  // Extract ID if dynamic route
  const getProjectIdFromPath = () => {
    const match = currentPath.match(/\/projects\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : 'proj-1';
  };

  const getProfileUserIdFromPath = () => {
    const match = currentPath.match(/\/u\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : undefined;
  };

  // Route Guard Access Denied Component
  const renderAccessDenied = (requiredRole: string, switchUserId: string, switchName: string) => {
    return (
      <div className="bg-white rounded-2xl border border-[#D5DDEB] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-12 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#FBE4E4] text-[#E5393C] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1F4B]">Restricted Route Access</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          This portal section requires <span className="font-bold text-[#0B1F4B] capitalize">{requiredRole}</span> privileges. Your current active role is <span className="font-bold text-[#1565E8] capitalize">{currentUser?.role || 'Guest'}</span>.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSwitchUser(switchUserId)}
            icon={<UserCheck className="w-4 h-4" />}
          >
            Switch to {switchName}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate(currentUser?.role === 'admin' ? '/admin' : currentUser?.role === 'supervisor' ? '/researcher' : '/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  // Render active page view with role protection
  const renderPage = () => {
    if (currentPath === '/') {
      return <LandingPage onNavigate={handleNavigate} onOpenSearch={() => setSearchModalOpen(true)} />;
    }
    if (currentPath === '/login') {
      return (
        <LoginPage
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            if (u.role === 'admin') handleNavigate('/admin');
            else if (u.role === 'supervisor' || u.role === 'researcher') handleNavigate('/researcher');
            else handleNavigate('/dashboard');
          }}
          onNavigate={handleNavigate}
        />
      );
    }
    if (currentPath === '/register') {
      return (
        <RegisterPage
          onNavigate={handleNavigate}
          onRegistered={() => handleNavigate('/login')}
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            if (u.role === 'admin') handleNavigate('/admin');
            else if (u.role === 'supervisor' || u.role === 'researcher') handleNavigate('/researcher');
            else handleNavigate('/dashboard');
          }}
        />
      );
    }
    if (currentPath === '/research-areas') {
      return <ResearchAreasPage onNavigate={handleNavigate} />;
    }

    // Projects public/authenticated listing & details
    if (currentPath.startsWith('/projects') && !isWorkspaceContext) {
      const parts = currentPath.split('/');
      if (parts.length === 3 && parts[2]) {
        return <ProjectDetailsPage projectId={parts[2]} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
      return <ProjectsPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Project workspace sub-routes (Requires Authentication)
    if (currentPath.includes('/discussion')) {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate(currentPath); }}
            onNavigate={handleNavigate}
            message="Please log in to join project discussions."
          />
        );
      }
      return <ProjectDiscussionPage projectId={getProjectIdFromPath()} currentUser={currentUser} onNavigate={handleNavigate} />;
    }
    if (currentPath.includes('/progress')) {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate(currentPath); }}
            onNavigate={handleNavigate}
            message="Please log in to view project progress milestones."
          />
        );
      }
      return <ProjectProgressPage projectId={getProjectIdFromPath()} currentUser={currentUser} onNavigate={handleNavigate} />;
    }
    if (currentPath.includes('/team')) {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate(currentPath); }}
            onNavigate={handleNavigate}
            message="Please log in to view project team members."
          />
        );
      }
      return <ProjectTeamPage projectId={getProjectIdFromPath()} currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Student Dashboard
    if (currentPath === '/dashboard') {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              handleNavigate(u.role === 'admin' ? '/admin' : u.role === 'supervisor' || u.role === 'researcher' ? '/researcher' : '/dashboard');
            }}
            onNavigate={handleNavigate}
            message="Please log in to access your student dashboard."
          />
        );
      }
      return <StudentDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Applications Page (Requires Authentication)
    if (currentPath.startsWith('/applications')) {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/applications'); }}
            onNavigate={handleNavigate}
            message="Please log in to access your research applications."
          />
        );
      }
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      const filter = urlParams.get('status') || 'all';
      return <MyApplicationsPage currentUser={currentUser} onNavigate={handleNavigate} initialFilter={filter} />;
    }

    // Saved Projects Page (Requires Authentication)
    if (currentPath === '/saved') {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/saved'); }}
            onNavigate={handleNavigate}
            message="Please log in to view your saved projects."
          />
        );
      }
      return <SavedProjectsPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // My Projects Page (Requires Authentication)
    if (currentPath === '/my-projects') {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/my-projects'); }}
            onNavigate={handleNavigate}
            message="Please log in to access your collaborative projects."
          />
        );
      }
      return <MyProjectsPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // User Profile
    if (currentPath === '/profile' || currentPath.startsWith('/u/')) {
      const targetUserId = getProfileUserIdFromPath();
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate(currentPath); }}
            onNavigate={handleNavigate}
            message="Please log in to access academic profiles."
          />
        );
      }
      return <ProfilePage currentUser={currentUser} profileUserId={targetUserId} onNavigate={handleNavigate} />;
    }

    // Researcher / Supervisor Dashboard (Role Protected)
    if (currentPath === '/researcher') {
      if (!currentUser) {
        return (
          <LoginPage 
            onLoginSuccess={(u) => { 
              setCurrentUser(u); 
              handleNavigate(u.role === 'admin' ? '/admin' : u.role === 'supervisor' || u.role === 'researcher' ? '/researcher' : '/dashboard'); 
            }} 
            onNavigate={handleNavigate} 
            message="Please log in with faculty supervisor credentials."
          />
        );
      }
      if (currentUser.role === 'student') {
        return renderAccessDenied('supervisor or researcher', 'user-fahim', 'Dr. Fahim Rahman');
      }
      return <ResearcherDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Notifications Page (Requires Authentication)
    if (currentPath === '/notifications') {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/notifications'); }}
            onNavigate={handleNavigate}
            message="Please log in to view your notifications."
          />
        );
      }
      return <NotificationsPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Calendar Page (Requires Authentication)
    if (currentPath === '/calendar') {
      if (!currentUser) {
        return (
          <LoginPage
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/calendar'); }}
            onNavigate={handleNavigate}
            message="Please log in to view the research calendar."
          />
        );
      }
      return <CalendarPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Admin Dashboard & Admin Sub-Routes (Role Protected)
    if (currentPath === '/admin') {
      if (!currentUser) {
        return (
          <LoginPage 
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/admin'); }} 
            onNavigate={handleNavigate} 
            message="Administrator authentication required."
          />
        );
      }
      if (currentUser.role !== 'admin') {
        return renderAccessDenied('admin', 'user-admin', 'Administrator');
      }
      return <AdminDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
    }
    if (currentPath === '/admin/projects') {
      if (!currentUser) {
        return (
          <LoginPage 
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/admin/projects'); }} 
            onNavigate={handleNavigate} 
            message="Administrator authentication required."
          />
        );
      }
      if (currentUser?.role !== 'admin') {
        return renderAccessDenied('admin', 'user-admin', 'Administrator');
      }
      return <ManageProjectsPage onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/admin/users')) {
      if (!currentUser) {
        return (
          <LoginPage 
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/admin/users'); }} 
            onNavigate={handleNavigate} 
            message="Administrator authentication required."
          />
        );
      }
      if (currentUser?.role !== 'admin') {
        return renderAccessDenied('admin', 'user-admin', 'Administrator');
      }
      return <ManageUsersPage onNavigate={handleNavigate} />;
    }

    // Papers Page & Details
    if (currentPath.startsWith('/papers')) {
      const parts = currentPath.split('/');
      if (parts.length === 3 && parts[2]) {
        return <PaperDetailsPage paperId={parts[2]} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
      return <PapersPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // AI Writer Page
    if (currentPath === '/ai-writer') {
      return <AiWriterPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Publish Project Page (Requires Supervisor/Researcher/Admin)
    if (currentPath === '/publish-project') {
      if (!currentUser) {
        return (
          <LoginPage 
            onLoginSuccess={(u) => { setCurrentUser(u); handleNavigate('/publish-project'); }} 
            onNavigate={handleNavigate} 
            message="Please log in with supervisor credentials to publish projects."
          />
        );
      }
      if (currentUser.role !== 'supervisor' && currentUser.role !== 'researcher' && currentUser.role !== 'admin') {
        return renderAccessDenied('supervisor or researcher', 'user-fahim', 'Dr. Fahim Rahman');
      }
      return <PublishProjectPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Global Search Page
    if (currentPath.startsWith('/search')) {
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      return <GlobalSearchPage initialQuery={urlParams.get('q') || ''} onNavigate={handleNavigate} />;
    }

    // Static Pages
    if (currentPath === '/about') {
      return <AboutPage onNavigate={handleNavigate} />;
    }
    if (currentPath === '/contact' || currentPath === '/admin/messages') {
      return <ContactPage />;
    }
    if (currentPath === '/legal' || currentPath === '/settings') {
      return <LegalPage />;
    }

    // Default Fallback: Landing Page
    return <LandingPage onNavigate={handleNavigate} onOpenSearch={() => setSearchModalOpen(true)} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FD] text-[#0B1F4B] font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onNavigate={handleNavigate}
        currentPath={currentPath}
        onOpenSearch={() => setSearchModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        unreadCount={unreadNotifications}
      />

      {/* Main Body */}
      {isAppShellRoute && currentUser ? (
        /* App Shell Layout for Logged-In Pages (Pages 7-20) */
        <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Top Bar with dynamic search input, notifications, mascot */}
          <TopBar
            currentUser={currentUser}
            currentPath={currentPath}
            onOpenSearch={() => setSearchModalOpen(true)}
            onNavigate={handleNavigate}
            unreadNotifications={unreadNotifications}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex">
            {/* Role-Specific or Workspace Sidebar */}
            <Sidebar
              currentUser={currentUser}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              projectId={getProjectIdFromPath()}
              isProjectWorkspace={isWorkspaceContext}
            />

            {/* Scrollable Main Content Area */}
            <main ref={mainContentRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
              {renderPage()}
            </main>
          </div>
        </div>
      ) : (
        /* Public Full-Width Layout (Landing, Login, Register, Research Areas, About, etc.) */
        <main className="flex-1">
          {renderPage()}
        </main>
      )}

      {/* Full Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Full-Screen Search Modal (Ctrl+K or /) */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Live In-App Notification Toast */}
      {activeToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white border border-[#0B6BE6]/40 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#0E9F6E] flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h5 className="font-bold text-xs text-[#0B2A55] truncate">{activeToast.title}</h5>
              <span className="text-[10px] text-gray-400 font-medium">Just now</span>
            </div>
            <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{activeToast.body}</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  if (activeToast.link) handleNavigate(activeToast.link);
                  setActiveToast(null);
                }}
                className="text-xs font-bold text-[#0B6BE6] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setActiveToast(null)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
