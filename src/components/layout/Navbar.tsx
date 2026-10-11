import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  FolderGit2, 
  ShieldCheck,
  Bell
} from 'lucide-react';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Logo } from '../common/Logo';
import { MOCK_USERS } from '../../data/mock';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  currentPath: string;
  onOpenSearch: () => void;
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  currentPath,
  onOpenSearch,
  onSwitchUser,
  onLogout,
  unreadCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Exact centered links from prompt & screenshot: Home, Research Areas, Projects, About
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Research Areas', path: '/research-areas' },
    { label: 'Projects', path: '/projects' },
    { label: 'About', path: '/about' }
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setRoleSwitcherOpen(false);
  };

  const getDashboardPath = (user: User) => {
    if (user.role === 'admin') return '/admin';
    if (user.role === 'supervisor' || user.role === 'researcher') return '/researcher';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-[#D5DDEB]/80 h-16 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Brand Logo: Pokéball icon + CollabX */}
        <Logo 
          onClick={() => handleNav('/')}
          size="md"
        />

        {/* Center: Clean links matching screenshot */}
        <div className="hidden md:flex items-center gap-9">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className="text-[15px] font-normal text-[#1A202C] hover:text-[#1565E8] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3.5">
          {/* Search Trigger Icon */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 text-gray-700 hover:text-[#1565E8] transition-colors cursor-pointer flex items-center justify-center"
            title="Search projects, areas or skills..."
          >
            <Search className="w-5 h-5 text-gray-800" strokeWidth={2.2} />
          </button>

          {/* Notifications Trigger Icon for logged-in users */}
          {currentUser && (
            <button
              onClick={() => handleNav('/notifications')}
              className="relative p-1.5 text-gray-700 hover:text-[#1565E8] transition-colors cursor-pointer flex items-center justify-center"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-800" strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E5393C] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User profile if logged in, or exact Solid Blue Login + Outlined Blue Sign Up */}
          {currentUser ? (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#D5DDEB] py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#0B1F4B] truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDF5EA] text-[#0F9D6B] capitalize">
                      {currentUser.role}
                    </span>
                  </div>

                  <button
                    onClick={() => handleNav(getDashboardPath(currentUser))}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0B1F4B] hover:bg-[#F4F8FD] hover:text-[#1565E8] flex items-center gap-2 cursor-pointer"
                  >
                    <FolderGit2 className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNav('/profile')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0B1F4B] hover:bg-[#F4F8FD] hover:text-[#1565E8] flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={() => handleNav('/settings')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0B1F4B] hover:bg-[#F4F8FD] hover:text-[#1565E8] flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#E5393C] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Solid blue Login button */}
              <button
                onClick={() => handleNav('/login')}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#1565E8] hover:bg-[#0f52bf] text-white shadow-2xs transition-colors cursor-pointer"
              >
                Login
              </button>
              {/* Outlined blue Sign Up button */}
              <button
                onClick={() => handleNav('/register')}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#1565E8] text-[#1565E8] hover:bg-[#1565E8]/5 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D5DDEB] px-4 pt-2 pb-6 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[#1A202C] hover:bg-[#F4F8FD]"
            >
              {link.label}
            </button>
          ))}

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {!currentUser ? (
              <>
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#1565E8] text-white text-center cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border border-[#1565E8] text-[#1565E8] text-center cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#E5393C] text-white text-center cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
