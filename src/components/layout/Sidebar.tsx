import React from 'react';
import { 
  Home, 
  FileText, 
  Bookmark, 
  FolderGit2, 
  Bell, 
  Calendar, 
  Settings, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  UserCheck, 
  BarChart3, 
  Inbox, 
  TrendingUp, 
  BookOpen
} from 'lucide-react';
import { User } from '../../types';
import { Logo } from '../common/Logo';

interface SidebarProps {
  currentUser: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  projectId?: string;
  isProjectWorkspace?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentPath,
  onNavigate,
  projectId,
  isProjectWorkspace = false
}) => {
  // Navigation items based on role or workspace context
  const getNavItems = () => {
    if (isProjectWorkspace && projectId) {
      return [
        { label: 'Overview', path: `/projects/${projectId}`, icon: Home, activeStyle: 'green' },
        { label: 'Project Progress', path: `/projects/${projectId}/progress`, icon: TrendingUp, activeStyle: 'teal' },
        { label: 'Project Discussion', path: `/projects/${projectId}/discussion`, icon: MessageSquare, activeStyle: 'blue' },
        { label: 'Team Members', path: `/projects/${projectId}/team`, icon: Users, activeStyle: 'paleBlue' },
        { label: 'Project Files', path: `/projects/${projectId}/files`, icon: FileText, activeStyle: 'blue' }
      ];
    }

    if (currentUser.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: Home, activeStyle: 'green' },
        { label: 'Manage Users', path: '/admin/users', icon: Users, activeStyle: 'green' },
        { label: 'Manage Projects', path: '/admin/projects', icon: FolderGit2, activeStyle: 'navy' },
        { label: 'Research Areas', path: '/research-areas', icon: Layers, activeStyle: 'green' },
        { label: 'Research Papers', path: '/papers', icon: BookOpen, activeStyle: 'blue' },
        { label: 'Contact Messages', path: '/contact', icon: Inbox, activeStyle: 'blue' },
        { label: 'Settings', path: '/settings', icon: Settings, activeStyle: 'gray' }
      ];
    }

    if (currentUser.role === 'supervisor' || currentUser.role === 'researcher') {
      return [
        { label: 'Dashboard', path: '/researcher', icon: Home, activeStyle: 'green' },
        { label: 'My Projects', path: '/my-projects', icon: FolderGit2, activeStyle: 'blue' },
        { label: 'Applications', path: '/applications', icon: UserCheck, activeStyle: 'blue' },
        { label: 'Research Papers', path: '/papers', icon: BookOpen, activeStyle: 'blue' },
        { label: 'AI Paper Writer', path: '/ai-writer', icon: Sparkles, activeStyle: 'gold', highlight: true },
        { label: 'Calendar', path: '/calendar', icon: Calendar, activeStyle: 'green' },
        { label: 'Notifications', path: '/notifications', icon: Bell, activeStyle: 'green' },
        { label: 'Settings', path: '/settings', icon: Settings, activeStyle: 'gray' }
      ];
    }

    // Student default
    return [
      { label: 'Welcome', path: '/dashboard', icon: Home, activeStyle: 'green' },
      { label: 'My Applications', path: '/applications', icon: FileText, activeStyle: 'blue' },
      { label: 'Saved Projects', path: '/saved', icon: Bookmark, activeStyle: 'blue' },
      { label: 'My Projects', path: '/my-projects', icon: FolderGit2, activeStyle: 'blue' },
      { label: 'Research Papers', path: '/papers', icon: BookOpen, activeStyle: 'blue' },
      { label: 'AI Paper Writer', path: '/ai-writer', icon: Sparkles, activeStyle: 'gold', highlight: true },
      { label: 'Calendar', path: '/calendar', icon: Calendar, activeStyle: 'green' },
      { label: 'Notifications', path: '/notifications', icon: Bell, activeStyle: 'green' },
      { label: 'Settings', path: '/settings', icon: Settings, activeStyle: 'gray' }
    ];
  };

  const navItems = getNavItems();

  // Active filled pill colors per page specifications
  const getActiveStyles = (style: string) => {
    switch (style) {
      case 'green':
        return 'bg-[#0F9D6B] text-white shadow-xs font-bold';
      case 'blue':
        return 'bg-[#1565E8] text-white shadow-xs font-bold';
      case 'paleBlue':
        return 'bg-[#DDE5FB] text-[#1565E8] font-bold';
      case 'teal':
        return 'bg-[#0E4A5C] text-white shadow-xs font-bold';
      case 'navy':
        return 'bg-[#0B1F4B] text-white shadow-xs font-bold';
      case 'gold':
        return 'bg-[#FFC83D] text-[#0B1F4B] font-bold shadow-xs';
      default:
        return 'bg-[#0F9D6B] text-white shadow-xs font-bold';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#D5DDEB] shrink-0 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-4">
        {/* Logo at the top of the sidebar */}
        <div className="pb-3 border-b border-[#D5DDEB]/60 flex items-center justify-between">
          <Logo size="sm" onClick={() => onNavigate('/')} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#F4F8FD] px-2 py-0.5 rounded-full border border-[#D5DDEB]">
            {currentUser.role}
          </span>
        </div>

        {/* Workspace banner if inside project */}
        {isProjectWorkspace && (
          <div className="px-3 py-2 bg-[#F4F8FD] rounded-xl border border-[#D5DDEB] text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Workspace</span>
            <p className="font-bold text-[#0B1F4B] truncate">Active Project View</p>
          </div>
        )}

        {/* Navigation Items (active item = filled pill) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path) && item.path !== '/dashboard' && item.path !== '/researcher' && item.path !== '/admin');
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all cursor-pointer select-none ${
                  isActive
                    ? getActiveStyles(item.activeStyle)
                    : 'text-gray-600 hover:text-[#0B1F4B] hover:bg-[#F4F8FD]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="pt-4 border-t border-[#D5DDEB] space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#F4F8FD]">
          <div className="w-2 h-2 rounded-full bg-[#0F9D6B] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#0B1F4B] truncate">
            {currentUser.institution.split(' ')[0]} Academic Portal
          </span>
        </div>
      </div>
    </aside>
  );
};
