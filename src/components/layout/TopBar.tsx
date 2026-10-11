import React, { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  Bell, 
  MessageSquare, 
  ChevronDown,
  User as UserIcon,
  LogOut,
  FolderGit2
} from 'lucide-react';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { PikachuMascot } from '../common/PikachuMascot';

interface TopBarProps {
  currentUser: User;
  currentPath: string;
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
  unreadNotifications: number;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  currentPath,
  onOpenSearch,
  onNavigate,
  unreadNotifications,
  onLogout
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dynamic search placeholder per page
  const getSearchPlaceholder = () => {
    if (currentPath === '/projects') return 'Search projects, labs, areas, researchers…';
    if (currentPath === '/dashboard') return 'Search projects, areas, papers…';
    if (currentPath === '/saved') return 'Search saved projects…';
    if (currentPath === '/researcher') return 'Search to match by fields, members…';
    if (currentPath.includes('/discussion')) return 'Search discussions…';
    if (currentPath.includes('/progress')) return 'Search research by title, supervisor…';
    if (currentPath.startsWith('/admin')) return 'Search users, projects…';
    if (currentPath === '/papers') return 'Search research papers, DOIs, authors…';
    return 'Search projects, areas, papers…';
  };

  const showHeaderPikachu = currentPath === '/dashboard';

  return (
    <div className="bg-white border-b border-[#D5DDEB] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 sticky top-16 z-30 shadow-2xs">
      {/* Search Input Bar with magnifier icon */}
      <div 
        onClick={onOpenSearch}
        className="flex-1 max-w-xl relative cursor-pointer group"
      >
        <div className="w-full bg-[#F4F8FD] hover:bg-[#eaf1fb] border border-[#D5DDEB] group-hover:border-[#1565E8] rounded-full py-2 pl-4 pr-10 text-xs sm:text-sm font-medium text-gray-500 transition-colors flex items-center justify-between shadow-2xs">
          <span className="truncate">{getSearchPlaceholder()}</span>
          <Search className="w-4 h-4 text-gray-400 group-hover:text-[#1565E8] transition-colors shrink-0" />
        </div>
      </div>

      {/* Right Tools & Profile */}
      <div className="flex items-center gap-3">
        {/* Help Tooltip Button */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-full text-gray-400 hover:text-[#1565E8] hover:bg-[#F4F8FD] transition-colors cursor-pointer"
            title="Help & FAQ"
          >
            <HelpCircle className="w-5 h-5 text-[#0B1F4B]" />
          </button>

          {showHelp && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#D5DDEB] p-4 z-50 text-xs space-y-2 animate-fade-in">
              <h4 className="font-bold text-[#0B1F4B] text-sm">CollabX Help Center</h4>
              <p className="text-gray-600">
                Need guidance? Discover research areas, apply to open projects, chat with supervisors, or draft your paper using the AI Writer.
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => { onNavigate('/about'); setShowHelp(false); }}
                  className="font-semibold text-[#1565E8] hover:underline"
                >
                  View FAQ & Guidelines →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon with unread badge */}
        <button
          onClick={() => onNavigate('/notifications')}
          className="relative p-2 rounded-full text-gray-500 hover:text-[#1565E8] hover:bg-[#F4F8FD] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#0B1F4B]" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#E5393C] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Project Messages / Chat Shortcut */}
        <button
          onClick={() => onNavigate('/projects/proj-1/discussion')}
          className="p-2 rounded-full text-gray-500 hover:text-[#1565E8] hover:bg-[#F4F8FD] transition-colors cursor-pointer hidden sm:block"
          title="Project Messages"
        >
          <MessageSquare className="w-5 h-5 text-[#0B1F4B]" />
        </button>

        {/* Header Mascot on Student Dashboard */}
        {showHeaderPikachu && (
          <div className="hidden lg:block -my-3">
            <PikachuMascot size="sm" speechBubbleText={`Hi ${currentUser.name.split(' ')[0]}!`} />
          </div>
        )}

        {/* User Avatar with Chevron */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 cursor-pointer p-1 rounded-full hover:bg-[#F4F8FD] transition-colors"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" showStatus={true} />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#D5DDEB] py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-[#0B1F4B] truncate">{currentUser.name}</p>
                <span className="text-[10px] font-semibold text-[#0F9D6B] uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={() => { onNavigate('/profile'); setDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F4F8FD] hover:text-[#1565E8] flex items-center gap-2 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => { onNavigate('/my-projects'); setDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F4F8FD] hover:text-[#1565E8] flex items-center gap-2 cursor-pointer"
              >
                <FolderGit2 className="w-4 h-4" />
                My Projects
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => { onLogout(); setDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-[#E5393C] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
