import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Download, 
  Search, 
  Info, 
  Settings, 
  CheckCheck, 
  ArrowLeft,
  X,
  Eye,
  Users,
  MessageSquare,
  Lock,
  Globe
} from 'lucide-react';
import { User, Message, Project } from '../types';
import { storage } from '../services/storage';
import { messagingService } from '../services/messagingService';
import { Avatar } from '../components/common/Avatar';
import { publicProfileService } from '../services/publicProfileService';

interface ProjectDiscussionPageProps {
  projectId: string;
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const ProjectDiscussionPage: React.FC<ProjectDiscussionPageProps> = ({
  projectId,
  currentUser,
  onNavigate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<{ name: string; url: string } | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null); // null = all team group chat
  const [isSending, setIsSending] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const project = storage.getProject(projectId);
  const teamMembers = storage.getTeamMembers(projectId);

  // Real-time subscription to project messages (localStorage + Firestore)
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;

    const unsubscribe = messagingService.subscribeToProjectMessages(projectId, (list) => {
      setMessages(list);
    });

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  // Scroll ONLY the inner chat bubble container, never scroll the browser window or outer layout
  useEffect(() => {
    if (chatScrollRef.current) {
      if (isInitialLoadRef.current && messages.length > 0) {
        isInitialLoadRef.current = false;
        prevMsgCountRef.current = messages.length;
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      } else if (messages.length > prevMsgCountRef.current) {
        prevMsgCountRef.current = messages.length;
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  // Filter messages based on active recipient or show all if group chat
  const filteredMessages = messages.filter(msg => {
    if (!selectedRecipientId) {
      // Group chat view: show all group messages (those without recipientId)
      // or messages where current user is sender/recipient
      return !msg.recipientId || msg.senderId === currentUser.id || msg.recipientId === currentUser.id;
    }
    // Direct chat view with selectedRecipientId:
    // show 1-on-1 messages between currentUser and selectedRecipientId
    return (
      (msg.senderId === currentUser.id && msg.recipientId === selectedRecipientId) ||
      (msg.senderId === selectedRecipientId && msg.recipientId === currentUser.id)
    );
  });

  const selectedRecipientMember = selectedRecipientId 
    ? teamMembers.find(m => m.userId === selectedRecipientId)
    : null;
  const selectedRecipientProfile = selectedRecipientId 
    ? publicProfileService.getPublicProfileById(selectedRecipientId)
    : null;
  const recipientDisplayName = selectedRecipientProfile?.name || selectedRecipientMember?.name || 'Collaborator';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const bodyText = inputText.trim();
    setInputText('');

    try {
      await messagingService.sendMessage({
        projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        recipientId: selectedRecipientId || undefined,
        isSupervisor: project?.supervisorId === currentUser.id,
        body: bodyText
      });

      // Smooth scroll inside chat box only
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await messagingService.sendMessage({
          projectId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          recipientId: selectedRecipientId || undefined,
          isSupervisor: project?.supervisorId === currentUser.id,
          body: `Shared file: ${file.name}`,
          attachment: {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type,
            dataUrl
          }
        });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAttachment = (att: { name: string; dataUrl?: string }) => {
    if (att.dataUrl) {
      const link = document.createElement('a');
      link.href = att.dataUrl;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blob = new Blob([`CollabX Attachment Content for: ${att.name}`], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const filteredTeamMembers = teamMembers.filter(m => {
    if (!searchMember.trim()) return true;
    const prof = publicProfileService.getPublicProfileById(m.userId);
    const name = prof?.name || m.name;
    return name.toLowerCase().includes(searchMember.toLowerCase()) || 
           m.positionTitle.toLowerCase().includes(searchMember.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-13.5rem)] min-h-[520px] flex bg-white rounded-3xl border border-[#E3EAF3] overflow-hidden shadow-xs animate-fade-in">
      {/* 2nd Pane: Members & Discussions List matching Screenshot 13 */}
      <div className="w-72 bg-[#F5F8FC] border-r border-[#E3EAF3] flex flex-col shrink-0 hidden md:flex">
        {/* Search Bar */}
        <div className="p-3.5 border-b border-[#E3EAF3]">
          <div className="relative">
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Search collaborators…"
              className="w-full bg-white border border-[#E3EAF3] rounded-xl py-1.5 pl-8 pr-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Channels / Recipient Selector */}
        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 flex items-center justify-between">
          <span>Channels & Members</span>
          <span className="text-[10px] font-semibold text-[#0B6BE6]">{teamMembers.length} active</span>
        </div>

        {/* Member Conversation Rows */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Main Project Group Chat Channel */}
          <div
            onClick={() => setSelectedRecipientId(null)}
            className={`p-2.5 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer ${
              selectedRecipientId === null ? 'bg-[#DCE6FB] text-[#0B2A55] font-bold shadow-2xs' : 'hover:bg-white text-gray-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedRecipientId === null ? 'bg-[#0B6BE6] text-white' : 'bg-[#E3EAF3] text-[#0B2A55]'}`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs truncate">Group Discussion</span>
                <span className="text-[10px] font-bold text-[#0E9F6E]">All</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">Entire research team</p>
            </div>
          </div>

          <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Direct Messages
          </div>

          {filteredTeamMembers.map(member => {
            const isMe = member.userId === currentUser.id;
            const mProf = publicProfileService.getPublicProfileById(member.userId);
            const mName = isMe ? `${currentUser.name} (You)` : (mProf?.name || member.name);
            const mAvatar = isMe ? currentUser.avatar : (mProf?.avatar || member.avatar);
            const isSelected = selectedRecipientId === member.userId;

            return (
              <div
                key={member.id}
                onClick={() => {
                  if (!isMe) setSelectedRecipientId(member.userId);
                }}
                className={`p-2.5 rounded-2xl flex items-center gap-3 transition-colors ${
                  isMe ? 'opacity-85 cursor-default' : 'cursor-pointer'
                } ${
                  isSelected ? 'bg-[#DCE6FB] shadow-2xs' : 'hover:bg-white'
                }`}
              >
                <Avatar src={mAvatar} name={mName} size="sm" showStatus={true} />
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs truncate ${isSelected ? 'font-black text-[#0B2A55]' : 'font-bold text-[#0B2A55]'}`}>
                      {mName}
                    </span>
                    {member.role === 'supervisor' && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#DEEBFB] text-[#0B6BE6] rounded font-bold">PI</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{member.positionTitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3rd Pane: Active Chat Panel matching Screenshot 13 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#E3EAF3] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(`/projects/${projectId}`)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0B2A55] truncate max-w-sm sm:max-w-md">
                  {selectedRecipientId ? (
                    <span className="flex items-center gap-1.5 text-[#0B6BE6]">
                      <Lock className="w-3.5 h-3.5" />
                      Direct Message: {recipientDisplayName}
                    </span>
                  ) : (
                    <span>{project?.title || 'Project Workspace Discussion'}</span>
                  )}
                </h3>
              </div>
              <p className="text-[11px] text-[#0E9F6E] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0E9F6E] inline-block animate-pulse" />
                {selectedRecipientId ? (
                  <span>Direct conversation &bull; Notifications delivered directly</span>
                ) : (
                  <span>{teamMembers.length} active collaborators &bull; Group discussion</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedRecipientId && (
              <button
                onClick={() => setSelectedRecipientId(null)}
                className="px-3 py-1 text-xs font-bold bg-[#F4F8FD] border border-[#D5DDEB] hover:bg-[#eaf1fb] text-[#0B6BE6] rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Back to Group
              </button>
            )}
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-[#0B6BE6] hover:bg-gray-100 transition-colors"
              title="Project Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Bubble History */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/30">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#DCE6FB] text-[#0B6BE6] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#0B2A55]">
                {selectedRecipientId ? `Start direct conversation with ${recipientDisplayName}` : 'No messages yet in this discussion'}
              </p>
              <p className="text-xs text-gray-500 max-w-xs">
                {selectedRecipientId 
                  ? 'Messages sent here will notify them directly and appear in their notifications.'
                  : 'Send a message below. All team collaborators and the project supervisor will be notified immediately.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const sProf = publicProfileService.getPublicProfileById(msg.senderId);
              const senderName = isMe ? currentUser.name : (sProf?.name || msg.senderName);
              const senderAvatar = isMe ? currentUser.avatar : (sProf?.avatar || msg.senderAvatar);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar src={senderAvatar} name={senderName} size="sm" />

                  <div className={`max-w-[75%] sm:max-w-[65%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-bold text-[#0B2A55]">{senderName}</span>
                      {msg.isSupervisor && (
                        <span className="px-1.5 py-0.2 bg-[#DCE6FB] text-[#0B6BE6] rounded font-bold text-[9px]">
                          Supervisor
                        </span>
                      )}
                      {msg.recipientId && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded font-bold text-[9px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Direct
                        </span>
                      )}
                      <span className="text-gray-400">{msg.timestamp}</span>
                    </div>

                    {/* Message Bubble (Pale blue for team members matching screenshot) */}
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0B6BE6] text-white rounded-tr-none'
                          : 'bg-[#DCE6FB] text-[#0B2A55] rounded-tl-none border border-[#BFDBFE]/40'
                      }`}
                    >
                      <p>{msg.body}</p>

                      {/* File Attachment Bubble matching screenshot (dataset.zip) */}
                      {msg.attachment && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-white/90 border border-black/10 flex items-center justify-between gap-3 text-xs text-[#0B2A55]">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-[#0B6BE6] shrink-0" />
                            <div className="overflow-hidden">
                              <span className="font-bold block truncate">{msg.attachment.name}</span>
                              <span className="text-[10px] text-gray-500">{msg.attachment.size}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {msg.attachment.name.toLowerCase().endsWith('.pdf') && msg.attachment.dataUrl && (
                              <button
                                onClick={() => setPreviewPdfUrl({ name: msg.attachment!.name, url: msg.attachment!.dataUrl! })}
                                className="p-1 rounded-lg hover:bg-gray-200 text-[#0B6BE6] transition-colors cursor-pointer"
                                title="Preview PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadAttachment(msg.attachment!)}
                              className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recipient Notice Banner if in Direct Message Mode */}
        {selectedRecipientId && (
          <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <Lock className="w-3 h-3 text-amber-600" />
              Messaging {recipientDisplayName} directly. They will receive an instant notification.
            </span>
            <button
              onClick={() => setSelectedRecipientId(null)}
              className="text-[10px] font-bold text-amber-700 underline cursor-pointer"
            >
              Switch to All Team
            </button>
          </div>
        )}

        {/* Message Composer matching Screenshot 13: Type a message... + Send */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-[#E3EAF3] bg-white flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.csv,.zip,.tar,.gz,.png,.jpg"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-[#0B6BE6] hover:bg-gray-100 transition-colors cursor-pointer"
            title="Attach file (dataset, PDF, zip)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedRecipientId ? `Type a direct message to ${recipientDisplayName}…` : "Type a message to project team…"}
            className="flex-1 bg-[#F5F8FC] border border-[#E3EAF3] rounded-2xl px-4 py-2.5 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-5 py-2.5 bg-[#0E9F6E] hover:bg-[#0b8259] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending…' : 'Send'}</span>
          </button>
        </form>
      </div>

      {/* PDF Attachment Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0B6BE6]" />
                <h3 className="font-bold text-sm text-[#0B2A55]">{previewPdfUrl.name}</h3>
              </div>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-2">
              <iframe
                src={previewPdfUrl.url}
                title="PDF Preview"
                className="w-full h-full rounded-2xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
