import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  MapPin, 
  Building2, 
  Github, 
  Linkedin, 
  Globe, 
  BookOpen, 
  Award, 
  FolderGit2, 
  CheckCircle2, 
  Plus, 
  X, 
  Camera, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { User, Project, Paper, PublicProfile } from '../types';
import { storage } from '../services/storage';
import { ImageCropModal } from '../components/common/ImageCropModal';
import { RESEARCH_AREAS } from '../data/seedData';
import { CvAttachmentField, CvAttachmentData } from '../components/common/CvAttachmentField';
import { publicProfileService } from '../services/publicProfileService';

interface ProfilePageProps {
  currentUser: User;
  profileUserId?: string;
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  profileUserId,
  onNavigate
}) => {
  const isOwnProfile = !profileUserId || profileUserId === currentUser.id;
  
  // When viewing OTHER user, read strictly from publicProfiles collection (never from users)
  const [otherPublicProfile, setOtherPublicProfile] = useState<PublicProfile | null>(
    !isOwnProfile && profileUserId ? (publicProfileService.getPublicProfileById(profileUserId) || null) : null
  );

  useEffect(() => {
    if (!isOwnProfile && profileUserId) {
      // Load and subscribe from publicProfiles
      publicProfileService.fetchPublicProfileFromFirestore(profileUserId).then((prof) => {
        if (prof) setOtherPublicProfile(prof);
      });
      const unsubscribe = publicProfileService.subscribe(() => {
        const p = publicProfileService.getPublicProfileById(profileUserId);
        if (p) setOtherPublicProfile(p);
      });
      return unsubscribe;
    }
  }, [isOwnProfile, profileUserId]);

  const activeUser = isOwnProfile ? currentUser : (otherPublicProfile || {
    id: profileUserId || '',
    name: 'Researcher Profile',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    headline: 'CollabX Researcher',
    department: 'Research & Innovation',
    institution: 'Port City International University',
    role: 'researcher',
    interests: [],
    skills: [],
    bio: '',
    links: {}
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoCropOpen, setPhotoCropOpen] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState(currentUser.name);
  const [editHeadline, setEditHeadline] = useState(currentUser.headline || '');
  const [editDepartment, setEditDepartment] = useState(currentUser.department || '');
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editInterests, setEditInterests] = useState<string[]>([...(currentUser.interests || [])]);
  const [editSkills, setEditSkills] = useState<string[]>([...(currentUser.skills || [])]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [editGithub, setEditGithub] = useState(currentUser.links?.github || '');
  const [editLinkedin, setEditLinkedin] = useState(currentUser.links?.linkedin || '');
  const [editScholar, setEditScholar] = useState(currentUser.links?.scholar || '');

  // User's projects and papers
  const allProjects = storage.getProjects();
  const allTeam = storage.getTeamMembers();
  const userProjectIds = allTeam.filter(t => t.userId === activeUser.id).map(t => t.projectId);
  const userProjects = allProjects.filter(p => userProjectIds.includes(p.id) || p.supervisorId === activeUser.id);
  const userPapers = storage.getPapers().filter(p => p.uploaderId === activeUser.id || p.authors.some(a => a.toLowerCase().includes(activeUser.name.toLowerCase())));
  const userApplications = isOwnProfile ? storage.getUserApplications(currentUser.id) : [];

  // 3 Stat tiles matching Screenshot 11
  const projectCount = userProjects.length;
  const completedCount = userProjects.filter(p => p.status === 'completed').length;
  const applicationCount = userApplications.length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    const updated: User = {
      ...currentUser,
      name: editName,
      headline: editHeadline,
      department: editDepartment,
      bio: editBio,
      interests: editInterests,
      skills: editSkills,
      links: {
        ...currentUser.links,
        github: editGithub,
        linkedin: editLinkedin,
        scholar: editScholar
      }
    };
    // Sync to BOTH users/{uid} and publicProfiles/{uid}
    await publicProfileService.syncUserProfile(updated);
    setEditModalOpen(false);
  };

  const handleAvatarSaved = async (croppedDataUrl: string) => {
    if (!isOwnProfile) return;
    const updated: User = {
      ...currentUser,
      avatar: croppedDataUrl
    };
    // Sync to BOTH users/{uid} and publicProfiles/{uid}
    await publicProfileService.syncUserProfile(updated);
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !editSkills.includes(newSkillInput.trim())) {
      setEditSkills([...editSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setEditSkills(editSkills.filter(s => s !== skill));
  };

  const toggleInterest = (areaName: string) => {
    if (editInterests.includes(areaName)) {
      setEditInterests(editInterests.filter(i => i !== areaName));
    } else {
      setEditInterests([...editInterests, areaName]);
    }
  };

  const user = activeUser;

  const [cvProfileData, setCvProfileData] = useState<CvAttachmentData>({
    fileName: currentUser.cvFileName || `${currentUser.name.replace(/\s+/g, '_')}_Academic_CV.pdf`,
    fileSize: currentUser.cvFileSize || '1.2 MB',
    fileData: currentUser.cvFileData,
    isCustom: !!currentUser.cvFileData
  });

  const handleCvChange = async (cv: CvAttachmentData) => {
    if (!isOwnProfile) return;
    setCvProfileData(cv);
    const updated: User = {
      ...currentUser,
      cvFileName: cv.fileName,
      cvFileSize: cv.fileSize,
      cvFileData: cv.fileData
    };
    await publicProfileService.syncUserProfile(updated);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Profile Card matching Screenshot 11 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* 116px Big Round Avatar with Photo Picker Button */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0B6BE6]/20 shadow-md">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setPhotoCropOpen(true)}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#0B6BE6] hover:bg-[#0956b8] text-white shadow-md transition-all cursor-pointer"
                title="Change Photo from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name, Headline & Metadata */}
          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
                {user.name}
              </h1>

              {isOwnProfile && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-5 py-2.5 bg-[#FFC83D] hover:bg-[#f5bc28] text-[#0B2A55] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 self-center sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-700">{user.headline}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-500 pt-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0B6BE6]" />
                <span>{user.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E53935]" />
                <span>{user.institution}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
              {user.links?.github && (
                <a href={user.links.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#0B2A55]">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {user.links?.linkedin && (
                <a href={user.links.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#0B6BE6]">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {user.links?.scholar && (
                <a href={user.links.scholar} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#0E9F6E]" title="Google Scholar">
                  <BookOpen className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 3 Stat Tiles matching Screenshot 11 */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100 text-center">
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3]">
            <span className="text-xs text-gray-500 font-semibold block">Projects</span>
            <span className="text-xl sm:text-2xl font-black text-[#0B2A55]">{projectCount}</span>
          </div>
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3]">
            <span className="text-xs text-gray-500 font-semibold block">Completed</span>
            <span className="text-xl sm:text-2xl font-black text-[#0E9F6E]">{completedCount}</span>
          </div>
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3]">
            <span className="text-xs text-gray-500 font-semibold block">Applications</span>
            <span className="text-xl sm:text-2xl font-black text-[#0B6BE6]">{applicationCount}</span>
          </div>
        </div>
      </div>

      {/* Grid: Bio, Research Interests & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Bio + Papers + Projects */}
        <div className="md:col-span-2 space-y-6">
          {/* About / Bio */}
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-3 shadow-xs">
            <h3 className="font-bold text-base text-[#0B2A55]">About Researcher</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {user.bio || 'No biography written yet.'}
            </p>
          </div>

          {/* Research Papers by user */}
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#0B2A55] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
                Research Papers ({userPapers.length})
              </h3>
              {isOwnProfile && (
                <button
                  onClick={() => onNavigate('/papers')}
                  className="text-xs font-bold text-[#0B6BE6] hover:underline"
                >
                  + Upload Paper
                </button>
              )}
            </div>

            {userPapers.length > 0 ? (
              <div className="space-y-3">
                {userPapers.map(paper => (
                  <div
                    key={paper.id}
                    onClick={() => onNavigate(`/papers/${paper.id}`)}
                    className="p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded font-bold bg-[#DCE6FB] text-[#0B6BE6]">{paper.paperType}</span>
                      <span>{paper.year} • {paper.views} reads</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors">{paper.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{paper.abstract}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-2">No research papers published yet.</p>
            )}
          </div>

          {/* Joined / Published Projects */}
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-[#0B2A55] flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#0E9F6E]" />
              Joined & Collaborative Projects ({userProjects.length})
            </h3>

            {userProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate(`/projects/${p.id}`)}
                    className="p-3.5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all space-y-1.5 group"
                  >
                    <img src={p.thumbnail} alt={p.title} className="w-full h-24 object-cover rounded-xl" />
                    <h4 className="font-bold text-xs text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{p.title}</h4>
                    <span className="text-[11px] text-gray-400 block">{p.areaName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-2">No active project memberships.</p>
            )}
          </div>
        </div>

        {/* Right Column: Interests & Skills Chips matching Screenshot 11 */}
        <div className="space-y-6">
          {/* Research Interests */}
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-[#0B2A55]">Research Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map(interest => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E9E9FB] text-[#5C54E5]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Technical Skills */}
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-[#0B2A55]">Skills & Methodologies</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF5EA] text-[#0E9F6E]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Curriculum Vitae (Private to account owner) */}
          {isOwnProfile && (
            <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-3 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-[#0B2A55]">Academic Curriculum Vitae</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Attached to research project applications for supervisor review.
                </p>
              </div>
              <CvAttachmentField
                currentUser={currentUser}
                value={cvProfileData}
                onChange={handleCvChange}
                readOnly={false}
                label=""
              />
            </div>
          )}

          {/* Quick AI Thesis Tip */}
          <div className="bg-[#DEEBFB]/60 p-5 rounded-3xl border border-[#BFDBFE] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#0B6BE6]">
              <Sparkles className="w-4 h-4" />
              <span>AI Research Matching</span>
            </div>
            <p className="text-gray-600">
              CollabX calculates match percentages against available thesis openings using your verified interests and skills.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Full Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-[#0B2A55]">Edit Research Profile</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Academic Headline</label>
                  <input
                    type="text"
                    required
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Department</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Bio & Academic Interests</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-[#0B2A55]"
                />
              </div>

              {/* Research Interests Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Research Interests (Click to toggle)</label>
                <div className="flex flex-wrap gap-1.5">
                  {RESEARCH_AREAS.map(a => {
                    const isSelected = editInterests.includes(a.name);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => toggleInterest(a.name)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#0B6BE6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills Tags input */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Technical Skills & Tools</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editSkills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-[#DDF5EA] text-[#0E9F6E] font-bold flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. PyTorch, Docker, C++)"
                    className="flex-1 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-1.5 bg-[#0B6BE6] text-white rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Google Scholar</label>
                  <input
                    type="url"
                    value={editScholar}
                    onChange={(e) => setEditScholar(e.target.value)}
                    placeholder="https://scholar.google.com/..."
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl font-bold shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper & Device Media Picker Modal */}
      <ImageCropModal
        isOpen={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        onSave={handleAvatarSaved}
        currentAvatar={user.avatar}
      />
    </div>
  );
};
