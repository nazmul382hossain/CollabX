import React, { useState } from 'react';
import { 
  Heart, 
  Search, 
  Bookmark, 
  Users, 
  Calendar, 
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { User, Project } from '../types';
import { storage } from '../services/storage';

interface SavedProjectsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const SavedProjectsPage: React.FC<SavedProjectsPageProps> = ({ currentUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProject, setQuickViewProject] = useState<Project | null>(null);
  const [undoToast, setUndoToast] = useState('');

  const savedIds = storage.getSavedProjectIds(currentUser.id);
  const allProjects = storage.getProjects();
  const savedProjects = allProjects.filter(p => savedIds.includes(p.id));

  const filtered = savedProjects.filter(p => {
    if (searchQuery.trim()) {
      return (
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleUnsave = (projectId: string, projectTitle: string) => {
    storage.toggleSaveProject(currentUser.id, projectId);
    setUndoToast(`Removed "${projectTitle}" from saved.`);
    setTimeout(() => setUndoToast(''), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">My Saved Projects</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Bookmarked thesis and research opportunities to review and apply
          </p>
        </div>

        {/* Search input matching placeholder in screenshot */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Saved Projects"
            className="w-full bg-white border border-[#E3EAF3] rounded-full py-2 pl-4 pr-10 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {undoToast && (
        <div className="p-3 bg-[#FDE3E3] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#E53935] flex items-center justify-between">
          <span>{undoToast}</span>
        </div>
      )}

      {/* Rows matching Screenshot 9 */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] divide-y divide-[#E3EAF3] shadow-xs overflow-hidden">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-5 hover:bg-[#F5F8FC] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Red filled heart icon from Screenshot 9 */}
                <button
                  onClick={() => handleUnsave(p.id, p.title)}
                  className="p-2 rounded-full hover:bg-red-50 text-[#E53935] transition-colors cursor-pointer shrink-0"
                  title="Remove from saved"
                >
                  <Heart className="w-6 h-6 fill-current" />
                </button>

                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className="w-16 h-12 rounded-xl object-cover shrink-0 shadow-2xs"
                />

                <div className="space-y-1 min-w-0">
                  <h3
                    onClick={() => onNavigate(`/projects/${p.id}`)}
                    className="font-bold text-sm sm:text-base text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer truncate transition-colors"
                  >
                    {p.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{p.supervisorName}</span>
                    <span>•</span>
                    <span>{p.areaName}</span>
                    <span>•</span>
                    <span className="text-[#0E9F6E] font-semibold">{p.filledPositions}/{p.totalPositions} seats</span>
                  </div>
                </div>
              </div>

              {/* Action buttons: "View" (quick modal) and "View Details" (navigate) */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <button
                  onClick={() => setQuickViewProject(p)}
                  className="px-3.5 py-1.5 bg-[#F5F8FC] hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Quick View
                </button>

                <button
                  onClick={() => onNavigate(`/projects/${p.id}`)}
                  className="px-4 py-1.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600">No saved projects found.</p>
          <button
            onClick={() => onNavigate('/projects')}
            className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8]"
          >
            Explore Projects
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B6BE6]">{quickViewProject.areaName}</span>
                <h3 className="font-bold text-base text-[#0B2A55]">{quickViewProject.title}</h3>
              </div>
              <button onClick={() => setQuickViewProject(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {quickViewProject.description}
            </p>

            <div className="p-3 bg-[#F5F8FC] rounded-2xl flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Supervisor: {quickViewProject.supervisorName}</span>
              <span className="text-[#0E9F6E] font-bold">{quickViewProject.filledPositions}/{quickViewProject.totalPositions} Seats</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setQuickViewProject(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onNavigate(`/projects/${quickViewProject.id}`);
                  setQuickViewProject(null);
                }}
                className="px-5 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold"
              >
                Open Project Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
