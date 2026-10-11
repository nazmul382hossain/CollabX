import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Check, 
  X, 
  Trash2, 
  CheckCheck,
  AlertTriangle
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';

interface ManageProjectsPageProps {
  onNavigate: (path: string) => void;
}

export const ManageProjectsPage: React.FC<ManageProjectsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const projects = storage.getProjects();

  const totalCount = projects.length;
  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const approvedCount = projects.filter(p => p.status === 'active' || p.status === 'approved').length;
  const rejectedCount = projects.filter(p => p.status === 'rejected').length;

  const filtered = projects.filter(p => {
    if (activeTab === 'pending' && p.status !== 'pending') return false;
    if (activeTab === 'approved' && p.status !== 'active' && p.status !== 'approved') return false;
    if (activeTab === 'rejected' && p.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      return (
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleUpdateStatus = (projectId: string, status: ProjectStatus) => {
    const target = storage.getProject(projectId);
    if (target) {
      target.status = status;
      storage.updateProject(target);
    }
  };

  const handleDelete = (projectId: string) => {
    storage.deleteProject(projectId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 19 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Manage Projects</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Faculty research review, moderation, and departmental approval
          </p>
        </div>

        <button
          onClick={() => onNavigate('/publish-project')}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Project
        </button>
      </div>

      {/* Tabs matching Screenshot 19 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3EAF3] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          {[
            { key: 'all', label: `All (${totalCount})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'rejected', label: `Rejected (${rejectedCount})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#0B2A55] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or faculty…"
            className="w-full bg-white border border-[#E3EAF3] rounded-full py-1.5 pl-8 pr-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table matching Screenshot 19 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DEEBFB]/50 text-[#0B2A55] font-bold border-b border-[#E3EAF3]">
              <tr>
                <th className="py-3.5 px-6">Title</th>
                <th className="py-3.5 px-6">Area</th>
                <th className="py-3.5 px-6">Supervisor</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAF3]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#F5F8FC] transition-colors">
                  {/* Thumbnail + Title */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.title} className="w-12 h-9 rounded-lg object-cover shrink-0" />
                      <div className="max-w-xs sm:max-w-md">
                        <span 
                          onClick={() => onNavigate(`/projects/${p.id}`)}
                          className="font-bold text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer block truncate"
                        >
                          {p.title}
                        </span>
                        <span className="text-[10px] text-gray-400">{p.projectType} • {p.filledPositions}/{p.totalPositions} seats</span>
                      </div>
                    </div>
                  </td>

                  {/* Area */}
                  <td className="py-4 px-6 font-semibold text-gray-700">
                    {p.areaName}
                  </td>

                  {/* Supervisor */}
                  <td className="py-4 px-6 font-semibold text-gray-700">
                    {p.supervisorName}
                  </td>

                  {/* Status Pill */}
                  <td className="py-4 px-6">
                    {p.status === 'active' || p.status === 'approved' ? (
                      <Badge variant="green" dot={true}>Approved</Badge>
                    ) : p.status === 'pending' ? (
                      <Badge variant="amber" dot={true}>Pending</Badge>
                    ) : p.status === 'rejected' ? (
                      <Badge variant="red" dot={true}>Rejected</Badge>
                    ) : (
                      <Badge variant="gray">{p.status}</Badge>
                    )}
                  </td>

                  {/* Actions (View, Edit, Approve/Reject, Delete) matching Screenshot 19 */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onNavigate(`/projects/${p.id}`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B6BE6] hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {p.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'active')}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve Project"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'rejected')}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject Project"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(p.id, p.status === 'active' ? 'pending' : 'active')}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B6BE6] hover:bg-gray-100 transition-colors"
                          title="Toggle Status"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#E53935] hover:bg-red-50 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center gap-3 text-[#E53935]">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-sm text-[#0B2A55]">Delete Research Project?</h4>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently remove this project? This will also archive linked student applications.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-[#E53935] text-white rounded-xl text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
