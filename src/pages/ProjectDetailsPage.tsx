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
  FolderArchive,
  Star,
  MessageSquarePlus,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { storage } from '../services/storage';
import { RecommendationService } from '../services/recommendationService';
import { Project, User, Application, MentorFeedback } from '../types';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { CvAttachmentField, CvAttachmentData } from '../components/common/CvAttachmentField';
import { publicProfileService } from '../services/publicProfileService';
import { messagingService } from '../services/messagingService';
import { feedbackService, FEEDBACK_ASPECT_TAGS } from '../services/feedbackService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'team' | 'progress' | 'discussion' | 'files' | 'feedback'>('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // Application form states
  const [motivationMessage, setMotivationMessage] = useState('');
  const [skillsNote, setSkillsNote] = useState('');
  const [cvData, setCvData] = useState<CvAttachmentData>({});
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tabNotice, setTabNotice] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Mentor / Researcher feedback states
  const [projectFeedbacks, setProjectFeedbacks] = useState<MentorFeedback[]>([]);
  const [mentorFeedbacks, setMentorFeedbacks] = useState<MentorFeedback[]>([]);
  const [fbRating, setFbRating] = useState<number>(0);
  const [fbHoverRating, setFbHoverRating] = useState<number>(0);
  const [fbTags, setFbTags] = useState<string[]>([]);
  const [fbComment, setFbComment] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [fbSuccess, setFbSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    if (!project) return;
    let active = true;

    const syncFromList = (projList: MentorFeedback[]) => {
      if (!active) return;
      setProjectFeedbacks(projList);
      if (currentUser) {
        const mine = projList.find(f => f.authorId === currentUser.id);
        if (mine) {
          setFbRating(mine.rating);
          setFbTags(mine.tags || []);
          setFbComment(mine.comment || '');
        }
      }
    };

    syncFromList(feedbackService.getCachedFeedbackForProject(project.id));
    setMentorFeedbacks(feedbackService.getCachedFeedbackForMentor(project.supervisorId));

    feedbackService.fetchFeedbackForProject(project.id).then(syncFromList);
    feedbackService.fetchFeedbackForMentor(project.supervisorId).then(list => {
      if (active) setMentorFeedbacks(list);
    });

    const unsub = feedbackService.subscribe(() => {
      syncFromList(feedbackService.getCachedFeedbackForProject(project.id));
      setMentorFeedbacks(feedbackService.getCachedFeedbackForMentor(project.supervisorId));
    });

    return () => {
      active = false;
      unsub();
    };
  }, [project?.id, project?.supervisorId, currentUser?.id]);

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

  const handleToggleFeedbackTag = (tag: string) => {
    setFbTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!currentUser || !project) return;

    setFbError(null);
    setFbSuccess(null);

    if (fbRating < 1 || fbRating > 5) {
      setFbError('Please select a star rating between 1 and 5.');
      return;
    }
    if (fbComment.trim().length < 5) {
      setFbError('Please write a brief feedback note (at least 5 characters).');
      return;
    }

    setFbSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        project,
        author: currentUser,
        rating: fbRating,
        tags: fbTags,
        comment: fbComment
      });
      setFbSuccess('Your feedback has been saved.');
      setTimeout(() => setFbSuccess(null), 4000);
    } catch {
      setFbError('Unable to submit feedback right now. Please try again.');
    } finally {
      setFbSubmitting(false);
    }
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

        {/* Supervisor Card Block (Read from publicProfiles / seed user fallback) */}
        {(() => {
          const supProfile = publicProfileService.getPublicProfileById(project.supervisorId);
          const supUser = storage.getUser(project.supervisorId);
          const sName = supProfile?.name || supUser?.name || project.supervisorName;
          const sAvatar = supProfile?.avatar || supUser?.avatar || project.supervisorAvatar;
          const sDesig = supProfile?.headline || supUser?.headline || project.supervisorDesignation;
          const mentorSummary = feedbackService.computeSummary(mentorFeedbacks);
          return (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar src={sAvatar} name={sName} size="md" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Project Supervisor</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('feedback')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7]/70 text-[#B45309] hover:bg-[#FEF3C7] transition-colors cursor-pointer"
                      title="View or submit collaborator feedback"
                    >
                      <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      {mentorSummary.count > 0
                        ? `${mentorSummary.average.toFixed(1)} (${mentorSummary.count})`
                        : 'Feedback'}
                    </button>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#0B2A55]">{sName}</h4>
                  <p className="text-xs text-gray-500">{sDesig}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 border-b border-[#E3EAF3] pb-2 overflow-x-auto text-xs font-bold">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'requirements', label: 'Requirements' },
            { key: 'team', label: `Team (${teamMembers.length}/${project.totalPositions})`, locked: !currentUser },
            { key: 'progress', label: `Progress (${project.progressPercent}%)`, locked: !currentUser },
            { key: 'discussion', label: 'Discussion', locked: !currentUser || !isMember },
            { key: 'files', label: 'Files', locked: !currentUser || !isMember },
            {
              key: 'feedback',
              label: projectFeedbacks.length > 0 ? `Feedback (${projectFeedbacks.length})` : 'Feedback'
            }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTabNotice(null);
                if (t.key !== 'overview' && t.key !== 'requirements' && t.key !== 'feedback') {
                  if (!requireAuth()) return;
                }
                if ((t.key === 'discussion' || t.key === 'files') && !isMember) {
                  setTabNotice('Discussion and Files are accessible to approved team members.');
                  setTimeout(() => setTabNotice(null), 4000);
                  return;
                }
                if ((t.key === 'discussion' || t.key === 'files') && isMember) {
                  onNavigate(`/projects/${project.id}/${t.key}`);
                  return;
                }
                setActiveTab(t.key as typeof activeTab);
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-[#FFC83D] text-[#0B2A55] shadow-xs'
                  : 'text-gray-600 hover:bg-[#F5F8FC]'
              }`}
            >
              {t.locked && <Lock className="w-3 h-3 text-gray-400" />}
              {t.key === 'feedback' && (
                <MessageSquarePlus className="w-3.5 h-3.5 text-[#0B6BE6]" />
              )}
              {t.label}
            </button>
          ))}
        </div>

        {tabNotice && (
          <div className="px-4 py-2.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{tabNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setTabNotice(null)}
              className="text-[#92400E] hover:opacity-70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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

          {activeTab === 'feedback' && (() => {
            const supProfile = publicProfileService.getPublicProfileById(project.supervisorId);
            const supUser = storage.getUser(project.supervisorId);
            const sName = supProfile?.name || supUser?.name || project.supervisorName;
            const sAvatar = supProfile?.avatar || supUser?.avatar || project.supervisorAvatar;
            const sDesig = supProfile?.headline || supUser?.headline || project.supervisorDesignation;

            const projSummary = feedbackService.computeSummary(projectFeedbacks);
            const mentorSummary = feedbackService.computeSummary(mentorFeedbacks);
            const eligibility = feedbackService.canCollaboratorLeaveFeedback(currentUser, project, teamMembers);
            const hasExisting = currentUser
              ? projectFeedbacks.some(f => f.authorId === currentUser.id)
              : false;
            const displayRating = fbHoverRating || fbRating;
            const ratingLabels: Record<number, string> = {
              1: 'Needs Improvement',
              2: 'Fair',
              3: 'Good',
              4: 'Very Supportive',
              5: 'Outstanding Mentor'
            };

            return (
              <div className="space-y-6">
                {/* Supervisor Feedback Overview Header */}
                <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={sAvatar} name={sName} size="lg" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Supervisor & Research Mentor
                      </span>
                      <h3 className="font-bold text-lg text-[#0B2A55]">{sName}</h3>
                      <p className="text-xs text-gray-500">{sDesig}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right bg-[#F5F8FC] px-4 py-3 rounded-2xl border border-[#E3EAF3]">
                    <div>
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                        {mentorSummary.count > 0 ? (
                          <span className="text-lg font-extrabold text-[#0B2A55]">
                            {mentorSummary.average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-gray-500">No feedback yet</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 block">
                        {mentorSummary.count > 0
                          ? `${mentorSummary.count} collaborator review${mentorSummary.count > 1 ? 's' : ''} overall`
                          : 'Verified team feedback appears here'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit / Update Feedback Form */}
                <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-[#0B2A55]">
                        {hasExisting ? 'Update Your Feedback' : 'Give Feedback to Supervisor / Researcher'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Collaborators working under {sName} can rate mentorship, communication, and research guidance.
                      </p>
                    </div>
                  </div>

                  {!currentUser ? (
                    <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E3EAF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-gray-600">
                        Log in with your team account to share mentorship feedback for {sName}.
                      </p>
                      <button
                        type="button"
                        onClick={() => requireAuth(`/projects/${project.id}`, 'Please log in to submit mentorship feedback.')}
                        className="px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                      >
                        Log in to Give Feedback
                      </button>
                    </div>
                  ) : eligibility.allowed ? (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      {fbError && (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                          {fbError}
                        </div>
                      )}
                      {fbSuccess && (
                        <div className="p-3 bg-[#DDF5EA] text-[#0E9F6E] border border-[#A7F3D0] rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{fbSuccess}</span>
                        </div>
                      )}

                      {/* Star Rating Picker */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">
                          Overall Mentorship Rating *
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => {
                              const filled = star <= displayRating;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFbRating(star)}
                                  onMouseEnter={() => setFbHoverRating(star)}
                                  onMouseLeave={() => setFbHoverRating(0)}
                                  className="p-1 rounded-lg hover:bg-[#FEF3C7]/40 transition-colors cursor-pointer"
                                  aria-label={`Rate ${star} out of 5 stars`}
                                >
                                  <Star
                                    className={`w-6 h-6 transition-colors ${
                                      filled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          {displayRating > 0 && (
                            <span className="text-xs font-bold text-[#B45309] bg-[#FEF3C7]/70 px-2.5 py-1 rounded-lg">
                              {displayRating}/5 • {ratingLabels[displayRating]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Feedback Tags */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">
                          Highlights (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {FEEDBACK_ASPECT_TAGS.map(tag => {
                            const selected = fbTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleFeedbackTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-[#DCE6FB] border-[#0B6BE6] text-[#0B6BE6]'
                                    : 'bg-[#F5F8FC] border-[#E3EAF3] text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">
                          Your Feedback *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={fbComment}
                          onChange={(e) => setFbComment(e.target.value)}
                          placeholder={`Share your experience collaborating with ${sName} on guidance, responsiveness, and lab support...`}
                          className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={fbSubmitting}
                          className="px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                        >
                          {fbSubmitting
                            ? 'Saving...'
                            : hasExisting
                            ? 'Update Feedback'
                            : 'Submit Feedback'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E3EAF3] flex items-start gap-3 text-xs text-gray-600">
                      <ShieldCheck className="w-4 h-4 text-[#0B6BE6] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0B2A55]">{eligibility.reason}</p>
                        {!isOwner && !existingApp && !isPositionsFilled && (
                          <p className="text-gray-500">
                            Once your application to work under {sName} is approved, you can submit feedback here.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Feedback List */}
                <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-base text-[#0B2A55]">
                      Project Collaborator Feedback ({projectFeedbacks.length})
                    </h4>
                    {projSummary.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] bg-[#FEF3C7]/70 px-2.5 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        {projSummary.average.toFixed(1)} avg
                      </span>
                    )}
                  </div>

                  {projectFeedbacks.length > 0 ? (
                    <div className="space-y-3">
                      {projectFeedbacks.map(fb => {
                        const authorProf = publicProfileService.getPublicProfileById(fb.authorId);
                        const authorUser = storage.getUser(fb.authorId);
                        const aAvatar = authorProf?.avatar || authorUser?.avatar || fb.authorAvatar;
                        const aName = authorProf?.name || authorUser?.name || fb.authorName;
                        return (
                          <div
                            key={fb.id}
                            className="p-4 rounded-2xl border border-[#E3EAF3] bg-[#F5F8FC] space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <Avatar src={aAvatar} name={aName} size="sm" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs sm:text-sm text-[#0B2A55]">{aName}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF5EA] text-[#0E9F6E]">
                                      Collaborator
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-500">
                                    {fb.authorDepartment || 'Research Team'} • {new Date(fb.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= fb.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {fb.tags && fb.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {fb.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#E3EAF3] text-[#0B2A55]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                              {fb.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-4 text-center">
                      No collaborator feedback has been submitted for this project yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
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
