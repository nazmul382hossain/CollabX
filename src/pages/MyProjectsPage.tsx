import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Download,
  LogOut
} from 'lucide-react';
import { User, Project } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';

interface MyProjectsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const MyProjectsPage: React.FC<MyProjectsPageProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'joined' | 'completed' | 'published'>('joined');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const allProjects = storage.getProjects();
  const allTeamMembers = storage.getTeamMembers();

  // Projects user is part of
  const joinedProjectIds = allTeamMembers
    .filter(tm => tm.userId === currentUser.id && tm.status === 'active')
    .map(tm => tm.projectId);

  const joinedProjects = allProjects.filter(p => joinedProjectIds.includes(p.id) && p.status === 'active');
  const completedProjects = allProjects.filter(p => joinedProjectIds.includes(p.id) && p.status === 'completed');
  const publishedProjects = allProjects.filter(p => p.supervisorId === currentUser.id);

  const currentList = activeTab === 'joined' 
    ? joinedProjects 
    : activeTab === 'completed' 
    ? completedProjects 
    : publishedProjects;

  const handleToggleSelect = (id: string) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(i => i !== id));
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  const handleBulkLeave = () => {
    if (selectedProjectIds.length === 0) return;
    if (confirm(`Leave selected ${selectedProjectIds.length} project(s)?`)) {
      selectedProjectIds.forEach(id => {
        storage.removeTeamMember(id, currentUser.id);
      });
      setSelectedProjectIds([]);
    }
  };

  const canPublish = currentUser.role === 'supervisor' || currentUser.role === 'researcher' || currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">My Projects & Collaborations</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Active lab cohorts, milestone deliverables, and team memberships
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => onNavigate('/publish-project')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish Project
          </button>
        )}
      </div>

      {/* Tabs matching Screenshot 10: Joined Projects (green) / Completed Projects / Published */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3EAF3] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'joined'
                ? 'bg-[#0E9F6E] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
            }`}
          >
            Joined Projects ({joinedProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-[#0E9F6E] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
            }`}
          >
            Completed Projects ({completedProjects.length})
          </button>

          {canPublish && (
            <button
              onClick={() => setActiveTab('published')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'published'
                  ? 'bg-[#0E9F6E] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
              }`}
            >
              Published by Me ({publishedProjects.length})
            </button>
          )}
        </div>

        {/* Bulk Action Controls */}
        {selectedProjectIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-600">{selectedProjectIds.length} selected</span>
            <button
              onClick={handleBulkLeave}
              className="px-3 py-1 bg-red-50 text-[#E53935] border border-red-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave Project(s)
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid / Cards matching Screenshot 10 */}
      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((p) => {
            const isSelected = selectedProjectIds.includes(p.id);
            const userMember = allTeamMembers.find(tm => tm.projectId === p.id && tm.userId === currentUser.id);
            const roleLabel = p.supervisorId === currentUser.id ? 'Supervisor / PI' : userMember?.positionTitle || 'Member';

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                  isSelected ? 'border-[#0B6BE6] ring-2 ring-[#0B6BE6]/20' : 'border-[#E3EAF3]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Selection circle from Screenshot 10 */}
                    <div
                      onClick={() => handleToggleSelect(p.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0B6BE6] border-[#0B6BE6] text-white' : 'border-gray-300 hover:border-[#0B6BE6]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <Badge variant={p.status === 'completed' ? 'teal' : 'green'} dot={true}>
                      {p.status === 'completed' ? 'Completed' : 'Active'}
                    </Badge>
                  </div>

                  <div className="relative h-36 rounded-2xl overflow-hidden mb-4">
                    <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                      {p.areaName}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-[#0B2A55] line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.summary}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{roleLabel}</span>
                    <span className="text-[#0E9F6E] font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {p.filledPositions}/{p.totalPositions} members
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                      <span>Overall Milestone Progress</span>
                      <span>{p.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0E9F6E] transition-all"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Workspace Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onNavigate(`/projects/${p.id}/progress`)}
                      className="py-2 px-3 bg-[#F5F8FC] hover:bg-gray-100 text-[#0B2A55] text-xs font-bold rounded-xl text-center transition-colors"
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => onNavigate(`/projects/${p.id}/discussion`)}
                      className="py-2 px-3 bg-[#0B6BE6] hover:bg-[#0956b8] text-white text-xs font-bold rounded-xl text-center transition-colors"
                    >
                      Workspace →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-12 text-center space-y-3">
          <FolderGit2 className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600">No projects found in this tab.</p>
          <button
            onClick={() => onNavigate('/projects')}
            className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8]"
          >
            Explore Projects to Join
          </button>
        </div>
      )}
    </div>
  );
};
