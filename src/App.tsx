import React, { useState, useEffect, useRef } from 'react';
import { storage } from './services/storage';
import { messagingService } from './services/messagingService';
import { User, NotificationItem } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { SearchModal } from './components/layout/SearchModal';
import { ShieldAlert, ArrowRight, Bell, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompleteVerificationModal } from './components/auth/CompleteVerificationModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ResearchAreasPage } from './pages/ResearchAreasPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyPage } from './pages/VerifyPage';
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

function AppContent() {
  const { authStatus, currentUser, signOutUser } = useAuth();
  
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
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    body: string;
    isError?: boolean;
    link?: string;
  } | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Trigger toast alert: "You don't have access to that page"
  const showAccessDeniedToast = (customMessage?: string) => {
    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Access Restricted',
      body: customMessage || "You don't have access to that page",
      isError: true
    });
    setTimeout(() => {
      setActiveToast((prev) => prev?.title === 'Access Restricted' ? null : prev);
    }, 5000);
  };

  // Reset scroll to absolute top on route navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentPath]);

  // Real-time live notifications subscription for currentUser
  useEffect(() => {
    if (!currentUser) {
      setUnreadNotifications(0);
      return;
    }

    const unsubscribe = messagingService.subscribeToUserNotifications(currentUser.id, (notifs) => {
      const unread = notifs.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    });

    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail && customEvent.detail.userId === currentUser.id) {
        setActiveToast({
          id: customEvent.detail.id,
          title: customEvent.detail.title,
          body: customEvent.detail.body,
          link: customEvent.detail.link
        });
        setTimeout(() => {
          setActiveToast((prev) => prev?.id === customEvent.detail.id ? null : prev);
        }, 6000);
      }
    };

    window.addEventListener('collabx_new_notification', handleNewNotification);

    return () => {
      unsubscribe();
      window.removeEventListener('collabx_new_notification', handleNewNotification);
    };
  }, [currentUser?.id]);

  // Global toast listener for route events
  useEffect(() => {
    const handleGenericToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; title?: string; type?: string }>;
      if (customEvent.detail) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          title: customEvent.detail.title || 'Notification',
          body: customEvent.detail.message,
          isError: customEvent.detail.type === 'error'
        });
        setTimeout(() => {
          setActiveToast(null);
        }, 5000);
      }
    };

    window.addEventListener('collabx_toast', handleGenericToast);
    return () => window.removeEventListener('collabx_toast', handleGenericToast);
  }, []);

  // Navigation decided ONLY by authStatus:
  // - ready -> redirect to role dashboard if visitor is on login/register/verify
  useEffect(() => {
    if (authStatus === 'ready' && currentUser) {
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/verify') {
        const target = currentUser.role === 'admin'
          ? '/admin'
          : currentUser.role === 'supervisor' || currentUser.role === 'researcher'
            ? '/researcher'
            : '/dashboard';
        handleNavigate(target);
      }
    }
  }, [authStatus, currentUser, currentPath]);

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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    handleNavigate('/');
  };

  // Determine if current page is inside the app shell (with sidebar)
  const isAppShellRoute = 
    currentUser !== null && 
    currentPath !== '/' && 
    currentPath !== '/login' && 
    currentPath !== '/register' &&
    currentPath !== '/verify' &&
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

  // Render active page view with strict ProtectedRoute and RoleRoute enforcement
  const renderPage = () => {
    // ---------------------------------------------------------
    // PUBLIC ROUTES (No Login Required)
    // ---------------------------------------------------------
    if (currentPath === '/') {
      return <LandingPage onNavigate={handleNavigate} onOpenSearch={() => setSearchModalOpen(true)} />;
    }

    if (currentPath === '/login') {
      return (
        <LoginPage
          onLoginSuccess={(u) => {
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
            if (u.role === 'admin') handleNavigate('/admin');
            else if (u.role === 'supervisor' || u.role === 'researcher') handleNavigate('/researcher');
            else handleNavigate('/dashboard');
          }}
        />
      );
    }

    if (currentPath === '/verify') {
      if (currentUser && currentUser.profileComplete === true) {
        if (currentUser.role === 'admin') handleNavigate('/admin');
        else if (currentUser.role === 'supervisor' || currentUser.role === 'researcher') handleNavigate('/researcher');
        else handleNavigate('/dashboard');
      } else {
        handleNavigate('/');
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (currentPath === '/research-areas') {
      return <ResearchAreasPage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/about') {
      return <AboutPage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    if (currentPath === '/legal') {
      return <LegalPage />;
    }

    // Projects public discoverability & details (approved projects open to guests)
    if (currentPath.startsWith('/projects') && !isWorkspaceContext) {
      const parts = currentPath.split('/');
      if (parts.length === 3 && parts[2]) {
        return <ProjectDetailsPage projectId={parts[2]} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
      return <ProjectsPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Research Papers public catalog & details
    if (currentPath.startsWith('/papers')) {
      const parts = currentPath.split('/');
      if (parts.length === 3 && parts[2]) {
        return <PaperDetailsPage paperId={parts[2]} currentUser={currentUser} onNavigate={handleNavigate} />;
      }
      return <PapersPage currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    // Global Search
    if (currentPath.startsWith('/search')) {
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      return <GlobalSearchPage initialQuery={urlParams.get('q') || ''} onNavigate={handleNavigate} />;
    }

    // ---------------------------------------------------------
    // ADMIN EXCLUSIVE ROUTES (/admin, Manage Users, Manage Projects, Research Areas, Applications, Reports, Settings)
    // ProtectedRoute + RoleRoute strictly for ['admin'].
    // Unauthorized users are immediately redirected to their dashboard with toast.
    // ---------------------------------------------------------
    if (currentPath.startsWith('/admin')) {
      let adminComponent = <AdminDashboard currentUser={currentUser!} onNavigate={handleNavigate} />;
      if (currentPath === '/admin/projects') {
        adminComponent = <ManageProjectsPage onNavigate={handleNavigate} />;
      } else if (currentPath.startsWith('/admin/users')) {
        adminComponent = <ManageUsersPage onNavigate={handleNavigate} />;
      } else if (currentPath === '/admin/research-areas') {
        adminComponent = <ResearchAreasPage onNavigate={handleNavigate} />;
      } else if (currentPath === '/admin/applications') {
        adminComponent = <MyApplicationsPage currentUser={currentUser!} onNavigate={handleNavigate} initialFilter="all" />;
      } else if (currentPath === '/admin/reports') {
        adminComponent = <AdminDashboard currentUser={currentUser!} onNavigate={handleNavigate} />;
      } else if (currentPath === '/admin/settings') {
        adminComponent = <LegalPage />;
      } else if (currentPath === '/admin/messages') {
        adminComponent = <ContactPage />;
      }

      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Administrator authentication required."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            {adminComponent}
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    // ---------------------------------------------------------
    // FACULTY / RESEARCHER EXCLUSIVE ROUTES
    // Researcher Dashboard & Publish Project: Supervisor, Researcher, Admin only.
    // ---------------------------------------------------------
    if (currentPath === '/researcher') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in with faculty supervisor credentials."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['supervisor', 'researcher', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ResearcherDashboard currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/publish-project') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in with supervisor credentials to publish projects."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['supervisor', 'researcher', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <PublishProjectPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    // ---------------------------------------------------------
    // STUDENT EXCLUSIVE ROUTES
    // Student Welcome Dashboard & Saved Projects: Student, Admin only.
    // ---------------------------------------------------------
    if (currentPath === '/dashboard') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to access your student dashboard."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <StudentDashboard currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/saved') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view your saved projects."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <SavedProjectsPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    // ---------------------------------------------------------
    // AUTHENTICATED SHARED USER ROUTES
    // Applications, My Projects, User Profile, Notifications, Calendar, AI Writer, Workspace
    // ---------------------------------------------------------
    if (currentPath.startsWith('/applications')) {
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      const filter = urlParams.get('status') || 'all';
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to access your research applications."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <MyApplicationsPage currentUser={currentUser!} onNavigate={handleNavigate} initialFilter={filter} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/my-projects') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to access your collaborative projects."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <MyProjectsPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/profile' || currentPath.startsWith('/u/')) {
      const targetUserId = getProfileUserIdFromPath();
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to access academic profiles."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ProfilePage currentUser={currentUser!} profileUserId={targetUserId} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/notifications') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view your notifications."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <NotificationsPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/calendar') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view the research calendar."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <CalendarPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/ai-writer') {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to access the AI Paper Writer."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <AiWriterPage currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    // Project workspace sub-routes
    if (currentPath.includes('/discussion')) {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to join project discussions."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ProjectDiscussionPage projectId={getProjectIdFromPath()} currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath.includes('/progress')) {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view project progress milestones."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ProjectProgressPage projectId={getProjectIdFromPath()} currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath.includes('/team')) {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view project team members."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ProjectTeamPage projectId={getProjectIdFromPath()} currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath.includes('/files')) {
      return (
        <ProtectedRoute
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          message="Please log in to view project files."
        >
          <RoleRoute
            currentUser={currentUser}
            allowedRoles={['student', 'researcher', 'supervisor', 'admin']}
            onNavigate={handleNavigate}
            onAccessDenied={showAccessDeniedToast}
          >
            <ProjectDiscussionPage projectId={getProjectIdFromPath()} currentUser={currentUser!} onNavigate={handleNavigate} />
          </RoleRoute>
        </ProtectedRoute>
      );
    }

    if (currentPath === '/settings') {
      return <LegalPage />;
    }

    // Default Fallback
    return <LandingPage onNavigate={handleNavigate} onOpenSearch={() => setSearchModalOpen(true)} />;
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#0B2A55] tracking-wide animate-pulse">
          Verifying security credentials…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FD] text-[#0B1F4B] font-sans antialiased">
      {/* Global Academic Verification Modal (Mounts once via Portal when authStatus === 'needsProfile') */}
      <CompleteVerificationModal
        onSuccessRedirect={(role) => {
          const target = role === 'admin' 
            ? '/admin' 
            : role === 'supervisor' || role === 'researcher' 
              ? '/researcher' 
              : '/dashboard';
          handleNavigate(target);
        }}
      />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onNavigate={handleNavigate}
        currentPath={currentPath}
        onOpenSearch={() => setSearchModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadNotifications}
      />

      {/* Main Body */}
      {isAppShellRoute && currentUser ? (
        <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
          <TopBar
            currentUser={currentUser}
            currentPath={currentPath}
            onOpenSearch={() => setSearchModalOpen(true)}
            onNavigate={handleNavigate}
            unreadNotifications={unreadNotifications}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex">
            <Sidebar
              currentUser={currentUser}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              projectId={getProjectIdFromPath()}
              isProjectWorkspace={isWorkspaceContext}
            />

            <main ref={mainContentRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
              {renderPage()}
            </main>
          </div>
        </div>
      ) : (
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

      {/* Live In-App Notification / Route Guard Access Denied Toast */}
      {activeToast && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm w-full bg-white border shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-fade-in ${
          activeToast.isError ? 'border-[#E5393C]/50' : 'border-[#0B6BE6]/40'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            activeToast.isError ? 'bg-[#FBE4E4] text-[#E5393C]' : 'bg-[#DDF5EA] text-[#0E9F6E]'
          }`}>
            {activeToast.isError ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h5 className="font-bold text-xs text-[#0B2A55] truncate">{activeToast.title}</h5>
              <span className="text-[10px] text-gray-400 font-medium">Notice</span>
            </div>
            <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{activeToast.body}</p>
            {activeToast.link && (
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
              </div>
            )}
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

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
