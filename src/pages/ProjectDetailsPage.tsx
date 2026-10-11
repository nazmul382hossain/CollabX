import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  Calendar, 
  Clock, 
  Gauge, 
  Users, 
  CheckCircle2, 
  Send, 
  Mail, 
  FileText, 
  X, 
  Upload, 
  Sparkles, 
  Lock,
  MessageSquare,
  TrendingUp,
  FolderArchive
} from 'lucide-react';
import { storage } from '../services/storage';
import { RecommendationService } from '../services/recommendationService';
import { Project, User, Application } from '../types';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { CvAttachmentField, CvAttachmentData } from '../components/common/CvAttachmentField';
import { publicProfileService } from '../services/publicProfileService';
import { messagingService } from '../services/messagingService';

interface ProjectDetailsPageProps {
  projectId: string;
  currentUser: User | null;
  onNavigate: (path: string) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  projectId,
  currentUser,
  onNavigate
}) => {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'team' | 'progress' | 'discussion' | 'files'>('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // Application form states
  const [motivationMessage, setMotivationMessage] = useState('');
  const [skillsNote, setSkillsNote] = useState('');
  const [cvData, setCvData] = useState<CvAttachmentData>({});
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Sync form state strictly when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setSkillsNote(currentUser.skills?.join(', ') || '');
      if (currentUser.cvFileName || currentUser.cvUrl || currentUser.cvFileData) {
        setCvData({
          fileName: currentUser.cvFileName || `${currentUser.name.replace(/\s+/g, '_')}_CV.pdf`,
          fileSize: currentUser.cvFileSize || '1.2 MB',
          fileData: currentUser.cvFileData || currentUser.cvUrl,
          isCustom: true
        });
      } else {
        setCvData({});
      }
    } else {
      setCvData({});
      setSkillsNote('');
    }
  }, [currentUser]);

  // Contact form state
  const [directMsg, setDirectMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const p = storage.getProject(projectId);
    setProject(p);
    if (p) {
      storage.incrementProjectView(p.id);
    }
    if (currentUser && p) {
      const saved = storage.getSavedProjectIds(currentUser.id).includes(p.id);
      setIsSaved(saved);
    } else {
      setIsSaved(false);
    }
  }, [projectId, currentUser]);

  const requireAuth = (returnPath?: string, customMsg?: string): boolean => {
    if (!currentUser) {
      const target = returnPath || `/projects/${projectId}`;
      const msg = customMsg || 'Please login to your account';
      onNavigate(`/login?returnUrl=${encodeURIComponent(target)}&message=${encodeURIComponent(msg)}`);
      return false;
    }
    return true;
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0B2A55]">Project Not Found</h2>
        <button
          onClick={() => onNavigate('/projects')}
          className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  // Check if user already applied
  const existingApp = currentUser 
    ? storage.getUserApplications(currentUser.id).find(a => a.projectId === project.id) 
    : undefined;

  const isOwner = currentUser ? project.supervisorId === currentUser.id : false;
  const isPositionsFilled = project.filledPositions >= project.totalPositions || project.status === 'closed';

  const handleToggleSave = () => {
    if (!requireAuth()) return;
    if (!currentUser) return;
    const saved = storage.toggleSaveProject(currentUser.id, project.id);
    setIsSaved(saved);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!currentUser) return;
    if (!motivationMessage.trim()) return;

    // Enforce rule: cannot apply twice
    const alreadyApplied = storage.getUserApplications(currentUser.id).some(a => a.projectId === project.id);
    if (alreadyApplied) {
      setApplyError('You have already submitted an application for this project.');
      return;
    }

    storage.createApplication({
      projectId: project.id,
      projectTitle: project.title,
      projectThumbnail: project.thumbnail,
      userId: currentUser.id,
      applicantUid: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userEmail: currentUser.email,
      userDepartment: currentUser.department,
      message: motivationMessage.trim(),
      skills: skillsNote.trim(),
      skillsNote: skillsNote.trim(),
      cvUrl: cvData.fileData || currentUser.cvUrl,
      cvFileName: cvData.fileName,
      cvFileSize: cvData.fileSize,
      cvFileData: cvData.fileData,
      createdAt: new Date().toISOString()
    });

    setApplicationSubmitted(true);
    setToastMessage('Application submitted successfully!');
    setApplyModalOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!directMsg.trim() || !currentUser) return;
    await messagingService.sendMessage({
      projectId: project.id,
      recipientId: project.supervisorId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      body: `[Direct Inquiry]: ${directMsg}`
    });
    setContactSent(true);
    setTimeout(() => {
      setContactModalOpen(false);
      setContactSent(false);
      setDirectMsg('');
    }, 1500);
  };

  // Similar projects recommendations
  const allProjects = storage.getProjects();
  const similarProjects = allProjects.filter(p => p.id !== project.id && p.areaId === project.areaId).slice(0, 3);

  const teamMembers = storage.getTeamMembers(project.id);
  const isMember = currentUser ? teamMembers.some(tm => tm.userId === currentUser.id) : false;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/projects')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6BE6] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Hero Header matching Screenshot Page 4 */}
      <div className="relative bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 overflow-hidden shadow-xs">
        {/* Faded Top-Right Banner Image from Screenshot */}
        <div 
          className="absolute right-0 top-0 w-1/3 h-full bg-cover bg-center opacity-15 pointer-events-none"
          style={{ backgroundImage: `url('${project.thumbnail}')` }}
        />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCE6FB] text-[#0B6BE6]">
              {project.areaName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
              {project.projectType}
            </span>
            <Badge variant="green" dot={true}>
              {project.status === 'active' ? 'Open for Applications' : project.status}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B2A55] tracking-tight leading-snug">
            {project.title}
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed">
            {project.summary}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {project.tags.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F8FC] text-gray-600 border border-[#E3EAF3]">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Supervisor Card Block (Read from publicProfiles) */}
        {(() => {
          const supProfile = publicProfileService.getPublicProfileById(project.supervisorId);
          const sName = supProfile?.name || project.supervisorName;
          const sAvatar = supProfile?.avatar || project.supervisorAvatar;
          const sDesig = supProfile?.headline || project.supervisorDesignation;
          return (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar src={sAvatar} name={sName} size="md" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Project Supervisor</span>
                  <h4 className="font-bold text-sm sm:text-base text-[#0B2A55]">{sName}</h4>
                  <p className="text-xs text-gray-500">{sDesig}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!requireAuth(`/u/${project.supervisorId}`)) return;
                    onNavigate(`/u/${project.supervisorId}`);
                  }}
                  className="px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    if (!requireAuth()) return;
                    setContactModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-[#0B2A55] border border-[#E3EAF3] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs Navigation (Pill style matching screenshot) */}
      <div className="flex items-center gap-2 border-b border-[#E3EAF3] pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'requirements', label: 'Requirements' },
          { key: 'team', label: `Team (${teamMembers.length}/${project.totalPositions})`, locked: !currentUser },
          { key: 'progress', label: `Progress (${project.progressPercent}%)`, locked: !currentUser },
          { key: 'discussion', label: 'Discussion', locked: !currentUser || !isMember },
          { key: 'files', label: 'Files', locked: !currentUser || !isMember }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key !== 'overview' && t.key !== 'requirements') {
                if (!requireAuth()) return;
              }
              if ((t.key === 'discussion' || t.key === 'files') && !isMember) {
                alert('Discussion and Files are accessible to approved team members.');
                return;
              }
              setActiveTab(t.key as any);
            }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-[#FFC83D] text-[#0B2A55] shadow-xs'
                : 'text-gray-600 hover:bg-[#F5F8FC]'
            }`}
          >
            {t.locked && <Lock className="w-3 h-3 text-gray-400" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="font-bold text-lg text-[#0B2A55] mb-3">Project Description & Problem Statement</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {project.objectives && project.objectives.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-[#0B2A55] mb-3">Key Research Objectives</h4>
                  <ul className="space-y-2">
                    {project.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-[#0E9F6E] shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.expectedOutcome && (
                <div className="bg-[#DDF5EA]/40 p-4 rounded-2xl border border-[#A7F3D0]/50 space-y-1">
                  <h4 className="font-bold text-xs text-[#0E9F6E] uppercase tracking-wider">Expected Deliverable / Publication</h4>
                  <p className="text-xs sm:text-sm text-gray-700">{project.expectedOutcome}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
              <h3 className="font-bold text-lg text-[#0B2A55]">Prerequisites & Required Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DCE6FB] text-[#0B6BE6]">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-600">
                <p>• Prior coursework or project familiarity with {project.areaName} is strongly recommended.</p>
                <p>• Commitment: Approximately 10–15 hours weekly for collaborative lab syncs, implementation, and paper drafting.</p>
                <p>• Department preference: Students enrolled in CSE, EEE, or Data Science degrees.</p>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="font-bold text-lg text-[#0B2A55]">Lab Research Team ({teamMembers.length})</h3>
              <div className="space-y-3">
                {teamMembers.map(m => {
                  const mProf = publicProfileService.getPublicProfileById(m.userId);
                  const mName = mProf?.name || m.name;
                  const mAvatar = mProf?.avatar || m.avatar;
                  return (
                    <div key={m.id} className="p-4 rounded-2xl border border-[#E3EAF3] bg-[#F5F8FC] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={mAvatar} name={mName} size="sm" />
                        <div>
                          <h4 className="font-bold text-sm text-[#0B2A55]">{mName}</h4>
                          <p className="text-xs text-gray-500">{m.positionTitle}</p>
                        </div>
                      </div>
                      <Badge variant={m.role === 'supervisor' ? 'blue' : 'green'}>
                        {m.role === 'supervisor' ? 'Supervisor' : 'Active'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#0B2A55]">Project Milestones</h3>
                <span className="font-bold text-sm text-[#0E9F6E]">{project.progressPercent}% Overall</span>
              </div>
              <button
                onClick={() => onNavigate(`/projects/${project.id}/progress`)}
                className="w-full py-2.5 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8] transition-colors"
              >
                Open Full Interactive Progress Tracker →
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: 4 Info Cards + Action Buttons matching Screenshot */}
        <div className="space-y-6">
          {/* 4 Info Cards Grid matching Page 4 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] text-center space-y-1 shadow-2xs">
              <Users className="w-5 h-5 text-[#0B6BE6] mx-auto" />
              <span className="text-[11px] text-gray-500 font-semibold block">Positions</span>
              <span className="text-base font-extrabold text-[#0B2A55]">
                {project.filledPositions}/{project.totalPositions}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] text-center space-y-1 shadow-2xs">
              <Gauge className="w-5 h-5 text-[#D97706] mx-auto" />
              <span className="text-[11px] text-gray-500 font-semibold block">Difficulty</span>
              <span className="text-base font-extrabold text-[#0B2A55]">
                {project.difficulty}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] text-center space-y-1 shadow-2xs">
              <Clock className="w-5 h-5 text-[#0E9F6E] mx-auto" />
              <span className="text-[11px] text-gray-500 font-semibold block">Duration</span>
              <span className="text-base font-extrabold text-[#0B2A55]">
                {project.durationMonths} Months
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] text-center space-y-1 shadow-2xs">
              <Calendar className="w-5 h-5 text-[#E53935] mx-auto" />
              <span className="text-[11px] text-gray-500 font-semibold block">Deadline</span>
              <span className="text-xs font-extrabold text-[#0B2A55]">
                {project.deadline}
              </span>
            </div>
          </div>

          {/* Action Buttons Box */}
          <div className="bg-white p-6 rounded-3xl border border-[#E3EAF3] space-y-3 shadow-xs">
            {toastMessage && (
              <div className="p-3 bg-[#DDF5EA] text-[#0E9F6E] rounded-xl text-xs font-bold border border-[#A7F3D0] flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Orange "Apply to Join" button with strict state evaluation */}
            {isOwner ? (
              <div className="w-full py-3 bg-[#DCE6FB] text-[#0B6BE6] border border-[#BFDBFE] rounded-xl text-center font-bold text-xs">
                You are the Project Supervisor
              </div>
            ) : existingApp ? (
              <div className="w-full py-3 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-xl text-center font-bold text-xs">
                Applied - {existingApp.status === 'pending' ? 'Pending' : existingApp.status.toUpperCase()}
              </div>
            ) : isPositionsFilled ? (
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-center font-bold text-xs">
                Positions Filled
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!requireAuth()) return;
                  setApplyError(null);
                  setApplyModalOpen(true);
                }}
                className="w-full py-3 bg-[#F05A28] hover:bg-[#d94e20] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Apply to Join Project
              </button>
            )}

            {/* Save Project Toggle */}
            <button
              onClick={handleToggleSave}
              className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-[#FDE3E3] border-[#FECACA] text-[#E53935]'
                  : 'bg-[#F5F8FC] border-[#E3EAF3] text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Project Saved in Bookmarks' : 'Save Project'}
            </button>
          </div>

          {/* Workspace Quick Links if Member */}
          {isMember && (
            <div className="bg-[#DDF5EA]/50 p-4 rounded-2xl border border-[#A7F3D0] space-y-2 text-xs">
              <span className="font-bold text-[#0E9F6E] block">You are a team member</span>
              <button
                onClick={() => onNavigate(`/projects/${project.id}/discussion`)}
                className="w-full py-1.5 bg-white border border-[#A7F3D0] rounded-lg font-semibold text-[#0B2A55] hover:bg-white/80 cursor-pointer"
              >
                Go to Team Discussion →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Similar Projects Section at Bottom */}
      {similarProjects.length > 0 && (
        <div className="pt-8 border-t border-[#E3EAF3] space-y-4">
          <h3 className="font-bold text-lg text-[#0B2A55]">Similar Projects in {project.areaName}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {similarProjects.map(sp => (
              <div
                key={sp.id}
                onClick={() => onNavigate(`/projects/${sp.id}`)}
                className="bg-white p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all space-y-2 group"
              >
                <img src={sp.thumbnail} alt={sp.title} className="w-full h-28 object-cover rounded-xl" />
                <h4 className="font-bold text-xs text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{sp.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{sp.supervisorName}</span>
                  <span className="text-[#0E9F6E] font-bold">{sp.filledPositions}/{sp.totalPositions} seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply to Join Modal - Strictly Logged-In Users Only */}
      {applyModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0B2A55]">Apply to Join Research Project</h3>
                <p className="text-[11px] text-gray-500">{project.title}</p>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real logged-in user profile identity card */}
            <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                <div>
                  <span className="font-bold text-[#0B2A55] block">{currentUser.name}</span>
                  <span className="text-gray-500 text-[11px]">{currentUser.email} • {currentUser.department}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE6FB] text-[#0B6BE6] capitalize">
                {currentUser.role}
              </span>
            </div>

            {applyError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Motivation Letter & Relevant Background *</label>
                <textarea
                  required
                  rows={4}
                  value={motivationMessage}
                  onChange={(e) => setMotivationMessage(e.target.value)}
                  placeholder="Explain why you are interested in this research, your academic preparation, and what specific sub-module you hope to tackle..."
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Verified Technical Skills Summary</label>
                <input
                  type="text"
                  value={skillsNote}
                  onChange={(e) => setSkillsNote(e.target.value)}
                  placeholder="e.g. PyTorch, OpenCV, Git, Fast inference"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
                />
              </div>

              <CvAttachmentField
                currentUser={currentUser}
                value={cvData}
                onChange={setCvData}
                label="Attached Academic CV"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#F05A28] hover:bg-[#d94e20] rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Supervisor Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-[#0B2A55]">Inquire with {project.supervisorName}</h3>
              <button onClick={() => setContactModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSent ? (
              <div className="py-6 text-center text-xs font-bold text-[#0E9F6E]">
                Message transmitted successfully!
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <textarea
                  required
                  rows={4}
                  value={directMsg}
                  onChange={(e) => setDirectMsg(e.target.value)}
                  placeholder="Type your message or inquiry regarding lab requirements..."
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
