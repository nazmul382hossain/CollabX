import React from 'react';
import { 
  Users, 
  FolderGit2, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { User, ActivityLog } from '../types';
import { storage } from '../services/storage';
import { RESEARCH_AREAS } from '../data/seedData';
import { Avatar } from '../components/common/Avatar';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate }) => {
  const users = storage.getUsers();
  const projects = storage.getProjects();
  const papers = storage.getPapers();
  const activities = storage.getActivityLogs();

  const totalUsers = users.length;
  const studentCount = users.filter(u => u.role === 'student').length;
  const researcherCount = users.filter(u => u.role === 'researcher').length;
  const supervisorCount = users.filter(u => u.role === 'supervisor').length;

  return (
    <div className="space-y-8 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 18 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E9F6E]">
            University Portal Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            System Overview & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            CSE 222 DBMS Sessional Administration · Port City International University
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/projects')}
            className="px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Manage Projects
          </button>
          <button
            onClick={() => onNavigate('/admin/users')}
            className="px-4 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Manage Users
          </button>
        </div>
      </div>

      {/* 4 Main Stat Cards matching Screenshot 18 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigate('/admin/users')}
          className="p-5 rounded-2xl bg-[#E9E9FB] border border-[#DDD6FE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C54E5]">Total Users</span>
            <Users className="w-4 h-4 text-[#5C54E5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{totalUsers}</div>
          <span className="text-[11px] font-semibold text-gray-500">Students & Faculty</span>
        </div>

        {/* Researchers */}
        <div
          onClick={() => onNavigate('/admin/users?role=researcher')}
          className="p-5 rounded-2xl bg-[#DDF5EA] border border-[#A7F3D0]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0E9F6E]">Researchers</span>
            <Briefcase className="w-4 h-4 text-[#0E9F6E]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0E9F6E]">{researcherCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Active PIs</span>
        </div>

        {/* Students */}
        <div
          onClick={() => onNavigate('/admin/users?role=student')}
          className="p-5 rounded-2xl bg-[#DEEBFB] border border-[#BFDBFE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B6BE6]">Students</span>
            <Users className="w-4 h-4 text-[#0B6BE6]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B6BE6]">{studentCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Enrolled Scholars</span>
        </div>

        {/* Research Areas */}
        <div
          onClick={() => onNavigate('/research-areas')}
          className="p-5 rounded-2xl bg-[#FFE9DC] border border-[#FED7AA]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F05A28]">Research Areas</span>
            <Layers className="w-4 h-4 text-[#F05A28]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F05A28]">{RESEARCH_AREAS.length}</div>
          <span className="text-[11px] font-semibold text-gray-500">50+ subfields mapped</span>
        </div>
      </div>

      {/* Grid: Project Status Donut Chart & Recent Activity Stream matching Screenshot 18 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-base text-[#0B2A55]">Project Status Distribution</h3>
            <p className="text-xs text-gray-400">Moderation and lifecycle breakdown</p>
          </div>

          {/* SVG Donut Chart matching Screenshot 18:
              Active 60% green, Pending 25% blue, Rejected 10% red, Completed 5% yellow */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Active 60% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#0E9F6E"
                  strokeWidth="3.6"
                  strokeDasharray="60 40"
                  strokeDashoffset="0"
                />
                {/* Pending 25% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#0B6BE6"
                  strokeWidth="3.6"
                  strokeDasharray="25 75"
                  strokeDashoffset="-60"
                />
                {/* Rejected 10% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#E53935"
                  strokeWidth="3.6"
                  strokeDasharray="10 90"
                  strokeDashoffset="-85"
                />
                {/* Completed 5% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#FFC83D"
                  strokeWidth="3.6"
                  strokeDasharray="5 95"
                  strokeDashoffset="-95"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-[#0B2A55]">{projects.length}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Projects</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E9F6E]" />
                Active (60%)
              </span>
              <span className="font-bold text-[#0B2A55]">Approved & Live</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B6BE6]" />
                Pending (25%)
              </span>
              <span className="font-bold text-[#0B2A55]">Needs Review</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                Rejected (10%)
              </span>
              <span className="font-bold text-[#0B2A55]">Declined</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC83D]" />
                Completed (5%)
              </span>
              <span className="font-bold text-[#0B2A55]">Archived</span>
            </div>
          </div>
        </div>

        {/* Recent Activities Stream (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-base text-[#0B2A55]">Recent System Activities</h3>
            <span className="text-xs font-bold text-gray-400">Live Activity Feed</span>
          </div>

          <div className="space-y-4">
            {activities.map(act => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl border border-[#E3EAF3] bg-[#F5F8FC]/50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={act.userAvatar} name={act.userName} size="sm" />
                  <div className="min-w-0 text-xs">
                    <p className="text-gray-800">
                      <strong className="text-[#0B2A55]">{act.userName}</strong>{' '}
                      {act.action}{' '}
                      <strong className="text-[#0B6BE6]">{act.entityTitle}</strong>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                  {act.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
