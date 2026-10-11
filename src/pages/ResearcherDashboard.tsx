import React, { useState } from 'react';
import { 
  FolderGit2, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  TrendingUp, 
  ArrowRight,
  BookOpen,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { User, Application } from '../types';
import { storage } from '../services/storage';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { AcademicCvModal } from '../components/common/AcademicCvModal';
import { publicProfileService } from '../services/publicProfileService';

interface ResearcherDashboardProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({ currentUser, onNavigate }) => {
  const [previewApp, setPreviewApp] = useState<Application | null>(null);
  const allProjects = storage.getProjects();
  const myProjects = allProjects.filter(p => p.supervisorId === currentUser.id);
  const myProjectIds = myProjects.map(p => p.id);

  const allApplications = storage.getApplications();
  const labApplications = allApplications.filter(a => myProjectIds.includes(a.projectId));
  const pendingApplications = labApplications.filter(a => a.status === 'pending');

  const allTeamMembers = storage.getTeamMembers();
  const labTeamMembers = allTeamMembers.filter(tm => myProjectIds.includes(tm.projectId));

  const myPapers = storage.getPapers().filter(p => p.uploaderId === currentUser.id);

  // 4 Stat metrics matching Screenshot 12
  const projectsCount = myProjects.length;
  const applicationsCount = labApplications.length;
  const teamMembersCount = labTeamMembers.length;
  const pendingCount = pendingApplications.length;

  const handleApprove = (appId: string) => {
    storage.updateApplicationStatus(appId, 'approved', 'Approved by principal supervisor.');
  };

  const handleReject = (appId: string) => {
    storage.updateApplicationStatus(appId, 'rejected', 'Candidate requirements not matched for current cohort.');
  };

  const lastName = currentUser.name.split(' ').slice(1).join(' ') || currentUser.name;

  return (
    <div className="space-y-8 animate-fade-in p-2 sm:p-4">
      {/* Header Banner matching Screenshot 12 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B6BE6]">
            Principal Investigator & Faculty Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            Welcome back, Dr. {lastName}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {currentUser.department} · Intelligent Systems Research Lab
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/publish-project')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Publish New Project
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Screenshot 12 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projects (sky) */}
        <div
          onClick={() => onNavigate('/my-projects')}
          className="p-5 rounded-2xl bg-[#DEEBFB] border border-[#BFDBFE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B6BE6]">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-[#0B6BE6]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{projectsCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Supervised cohorts</span>
        </div>

        {/* Card 2: Applications (sky-blue) */}
        <div
          onClick={() => onNavigate('/applications')}
          className="p-5 rounded-2xl bg-[#DCE6FB] border border-[#BFDBFE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B6BE6]">Applications</span>
            <FileText className="w-4 h-4 text-[#0B6BE6]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{applicationsCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Total received</span>
        </div>

        {/* Card 3: Team Members (lavender) */}
        <div
          onClick={() => onNavigate('/my-projects')}
          className="p-5 rounded-2xl bg-[#E9E9FB] border border-[#DDD6FE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C54E5]">Team Members</span>
            <Users className="w-4 h-4 text-[#5C54E5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{teamMembersCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Researchers active</span>
        </div>

        {/* Card 4: Pending (peach with RED number matching screenshot) */}
        <div
          onClick={() => onNavigate('/applications')}
          className="p-5 rounded-2xl bg-[#FFE9DC] border border-[#FED7AA]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F05A28]">Pending</span>
            <Clock className="w-4 h-4 text-[#E53935]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E53935]">{pendingCount}</div>
          <span className="text-[11px] font-semibold text-[#E53935]">Awaiting your review</span>
        </div>
      </div>

      {/* 2 Charts Grid matching Screenshot 12: Bar Chart + Status Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Applications Overview Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[#0B2A55]">Applications Overview</h3>
              <p className="text-xs text-gray-400">Monthly applicant volume over the past 5 months</p>
            </div>
            <span className="text-xs font-bold text-[#0B6BE6] bg-[#DCE6FB] px-2.5 py-1 rounded-lg">
              Term 2026
            </span>
          </div>

          {/* SVG Bar Chart matching visual style */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 px-4">
            {[
              { month: 'Jun', count: 12, height: '40%' },
              { month: 'Jul', count: 24, height: '80%' },
              { month: 'Aug', count: 18, height: '60%' },
              { month: 'Sep', count: 28, height: '95%' },
              { month: 'Oct', count: 14, height: '48%' }
            ].map(col => (
              <div key={col.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.count}
                </span>
                <div
                  style={{ height: col.height }}
                  className="w-full max-w-[48px] bg-[#0B6BE6] group-hover:bg-[#0956b8] rounded-t-xl transition-all shadow-xs"
                />
                <span className="text-xs font-semibold text-gray-600">{col.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Project Status Pie Chart (1 col) */}
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-base text-[#0B2A55]">Project Status</h3>
            <p className="text-xs text-gray-400">Current allocation across lifecycle</p>
          </div>

          {/* SVG Donut / Pie Visualization */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Active 65% (Green) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#0E9F6E"
                  strokeWidth="3.8"
                  strokeDasharray="65 35"
                  strokeDashoffset="0"
                />
                {/* Pending 20% (Yellow) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#FFC83D"
                  strokeWidth="3.8"
                  strokeDasharray="20 80"
                  strokeDashoffset="-65"
                />
                {/* Completed 15% (Teal) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke="#0D9488"
                  strokeWidth="3.8"
                  strokeDasharray="15 85"
                  strokeDashoffset="-85"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-[#0B2A55]">{myProjects.length}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Projects</span>
              </div>
            </div>
          </div>

          {/* Legend matching Screenshot 12 */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E9F6E]" />
                Active (65%)
              </span>
              <span className="font-bold text-[#0B2A55]">Open</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC83D]" />
                Pending Review (20%)
              </span>
              <span className="font-bold text-[#0B2A55]">Review</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                Completed (15%)
              </span>
              <span className="font-bold text-[#0B2A55]">Archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Applications Table with Approve / Reject Controls */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-[#0B2A55]">Recent Student Applications</h3>
          <span className="text-xs font-bold text-gray-500">{labApplications.length} total</span>
        </div>

        {labApplications.length > 0 ? (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {labApplications.slice(0, 5).map(app => {
              const aProf = publicProfileService.getPublicProfileById(app.userId);
              const aName = aProf?.name || app.userName;
              const aAvatar = aProf?.avatar || app.userAvatar;
              return (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={aAvatar} name={aName} size="sm" />
                    <div>
                      <h4 className="font-bold text-sm text-[#0B2A55]">{aName}</h4>
                      <p className="text-xs text-gray-500">Applied for: <span className="font-semibold text-gray-700">{app.projectTitle}</span></p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 italic mt-0.5">"{app.message}"</p>
                    </div>
                  </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setPreviewApp(app)}
                    className="px-3 py-1.5 bg-[#DCE6FB] hover:bg-[#c8d9f9] text-[#0B6BE6] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Inspect Attached Academic CV"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View CV</span>
                  </button>

                  {app.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3.5 py-1.5 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#E53935] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <Badge variant={app.status === 'approved' ? 'green' : 'red'}>
                      {app.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-3">No student applications submitted yet.</p>
        )}
      </div>

      {/* CV Modal for reviewing student application CV */}
      {previewApp && (
        <AcademicCvModal
          isOpen={true}
          onClose={() => setPreviewApp(null)}
          user={{
            id: previewApp.userId,
            name: previewApp.userName,
            email: previewApp.userEmail,
            department: previewApp.userDepartment,
            avatar: previewApp.userAvatar
          }}
          fileName={previewApp.cvFileName || `${previewApp.userName.replace(/\s+/g, '_')}_Academic_CV.pdf`}
          fileSize={previewApp.cvFileSize || '1.2 MB'}
          fileData={previewApp.cvFileData}
        />
      )}
    </div>
  );
};
