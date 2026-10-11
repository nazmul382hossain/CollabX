import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  MessageSquare, 
  Trash2, 
  ShieldCheck, 
  Search, 
  X, 
  Check,
  Plus
} from 'lucide-react';
import { User, TeamMember, Project, PublicProfile } from '../types';
import { storage } from '../services/storage';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { publicProfileService } from '../services/publicProfileService';

interface ProjectTeamPageProps {
  projectId: string;
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const ProjectTeamPage: React.FC<ProjectTeamPageProps> = ({
  projectId,
  currentUser,
  onNavigate
}) => {
  const project = storage.getProject(projectId);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(storage.getTeamMembers(projectId));
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<PublicProfile | null>(null);
  const [positionTitle, setPositionTitle] = useState('Research Assistant');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (!project) return null;

  const isSupervisor = project.supervisorId === currentUser.id || currentUser.role === 'admin';
  const openSeats = Math.max(0, project.totalPositions - project.filledPositions);

  // Read strictly from publicProfiles collection (never from users)
  const availableUsersToInvite = publicProfileService.getPublicProfiles().filter(u => 
    !teamMembers.some(tm => tm.userId === u.id) &&
    (userSearchQuery.trim() === '' || 
     u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
     u.department.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
     u.skills.some(s => s.toLowerCase().includes(userSearchQuery.toLowerCase())))
  );

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToInvite) return;

    storage.inviteTeamMember(projectId, selectedUserToInvite as any, positionTitle);
    setTeamMembers(storage.getTeamMembers(projectId));
    setInviteModalOpen(false);
    setSelectedUserToInvite(null);
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the project team?')) {
      storage.removeTeamMember(projectId, userId);
      setTeamMembers(storage.getTeamMembers(projectId));
      setActiveMenuId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 15 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B6BE6]">
            Collaborative Research Group
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            Project Team ({teamMembers.length}/{project.totalPositions})
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Members collaborate on code, datasets, and co-authorship for "{project.title}"
          </p>
        </div>

        {isSupervisor && openSeats > 0 && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Member Rows matching Screenshot 15 */}
      <div className="space-y-3">
        {teamMembers.map((member) => {
          const mProf = publicProfileService.getPublicProfileById(member.userId);
          const mName = mProf?.name || member.name;
          const mAvatar = mProf?.avatar || member.avatar;
          const mDept = mProf?.department || mProf?.headline;
          return (
            <div
              key={member.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar src={mAvatar} name={mName} size="md" showStatus={true} />

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 
                      onClick={() => onNavigate(`/u/${member.userId}`)}
                      className="font-bold text-sm sm:text-base text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer truncate transition-colors"
                    >
                      {mName}
                    </h4>
                    <span className="text-xs text-gray-400 capitalize">({member.role})</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="text-gray-700 font-medium">{member.positionTitle}</span>
                    {mDept && (
                      <>
                        <span>•</span>
                        <span>{mDept}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Badges & Menu matching Screenshot 15 */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              {member.role === 'supervisor' ? (
                <Badge variant="blue">Supervisor</Badge>
              ) : (
                <Badge variant="green" dot={true}>Active</Badge>
              )}

              {/* Three dots dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuId === member.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#E3EAF3] py-1.5 z-20 text-xs">
                    <button
                      onClick={() => { onNavigate(`/u/${member.userId}`); setActiveMenuId(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F5F8FC] font-semibold text-gray-700"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => { onNavigate(`/projects/${projectId}/discussion`); setActiveMenuId(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F5F8FC] font-semibold text-gray-700"
                    >
                      Send Message
                    </button>
                    {isSupervisor && member.role !== 'supervisor' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 font-semibold text-[#E53935]"
                      >
                        Remove from Team
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

        {/* Last Row: Dashed Open Seat Card matching Screenshot 15 */}
        {openSeats > 0 && (
          <div className="p-5 rounded-2xl border-2 border-dashed border-[#BFDBFE] bg-[#DEEBFB]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#0B6BE6] flex items-center justify-center text-[#0B6BE6]">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B2A55]">Open Seat ({openSeats} position{openSeats > 1 ? 's' : ''} available)</h4>
                <p className="text-xs text-gray-500">Accepting applications from qualified undergraduate & graduate scholars</p>
              </div>
            </div>

            {isSupervisor && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                Invite
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#0B2A55]">Invite Scholar to Research Team</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Search Scholar by Name, Email or Skills</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl pl-8 pr-3 py-2 text-[#0B2A55]"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Users list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                {availableUsersToInvite.map(u => {
                  const isSelected = selectedUserToInvite?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserToInvite(u)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#DCE6FB] border border-[#0B6BE6]' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar} name={u.name} size="xs" />
                        <div>
                          <span className="font-bold text-[#0B2A55] block">{u.name}</span>
                          <span className="text-[10px] text-gray-400">{u.department}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#0B6BE6]" />}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Assigned Position / Role Title</label>
                <input
                  type="text"
                  required
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="e.g. ML Vision Specialist / Research Assistant"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserToInvite}
                  className="px-5 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] disabled:opacity-50 text-white rounded-xl font-bold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
