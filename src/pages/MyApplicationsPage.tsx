import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ArrowRight, 
  X,
  AlertTriangle
} from 'lucide-react';
import { User, Application } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';
import { CvAttachmentField } from '../components/common/CvAttachmentField';

interface MyApplicationsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  initialFilter?: string;
}

export const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({
  currentUser,
  onNavigate,
  initialFilter = 'all'
}) => {
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const applications = storage.getUserApplications(currentUser.id);

  // Live counts for the filter pills matching Screenshot 8
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const filteredApps = applications.filter(app => {
    if (activeFilter !== 'all' && app.status !== activeFilter) return false;
    if (searchQuery.trim()) {
      return app.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleWithdraw = (appId: string) => {
    storage.withdrawApplication(appId);
    setWithdrawModalOpen(false);
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Top Header matching Screenshot 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">My Applications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track status and feedback for your research project applications
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-white border border-[#E3EAF3] rounded-full py-2 pl-4 pr-10 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* Filter Pills matching Screenshot 8 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'all', label: `All (${totalCount})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'approved', label: `Approved (${approvedCount})` },
          { key: 'rejected', label: `Rejected (${rejectedCount})` }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === filter.key
                ? 'bg-[#0B6BE6] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-[#E3EAF3] hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Application Rows matching Screenshot 8 */}
      {filteredApps.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] divide-y divide-[#E3EAF3] shadow-xs overflow-hidden">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-5 hover:bg-[#F5F8FC] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={app.projectThumbnail}
                  alt={app.projectTitle}
                  className="w-16 h-12 rounded-xl object-cover shrink-0 shadow-2xs"
                />

                <div className="space-y-1 min-w-0">
                  <h3 
                    onClick={() => onNavigate(`/projects/${app.projectId}`)}
                    className="font-bold text-sm sm:text-base text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer truncate transition-colors"
                  >
                    {app.projectTitle}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Application Date: {new Date(app.appliedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status pill & View button */}
              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div>
                  {app.status === 'approved' && <Badge variant="green" dot={true}>Approved</Badge>}
                  {app.status === 'pending' && <Badge variant="amber" dot={true}>Pending</Badge>}
                  {app.status === 'rejected' && <Badge variant="red" dot={true}>Rejected</Badge>}
                  {app.status === 'withdrawn' && <Badge variant="gray">Withdrawn</Badge>}
                </div>

                <button
                  onClick={() => setSelectedApp(app)}
                  className="px-4 py-2 bg-[#DCE6FB] hover:bg-[#c8d9f9] text-[#0B6BE6] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600">No applications found in this category.</p>
          <button
            onClick={() => onNavigate('/projects')}
            className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8]"
          >
            Explore Open Projects
          </button>
        </div>
      )}

      {/* Application Detail Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Application Record</span>
                <h3 className="font-bold text-base text-[#0B2A55] truncate max-w-xs">{selectedApp.projectTitle}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-gray-700 block mb-1">Status</span>
                <div className="inline-block">
                  {selectedApp.status === 'approved' && <Badge variant="green" dot={true}>Approved</Badge>}
                  {selectedApp.status === 'pending' && <Badge variant="amber" dot={true}>Pending Review</Badge>}
                  {selectedApp.status === 'rejected' && <Badge variant="red" dot={true}>Rejected</Badge>}
                  {selectedApp.status === 'withdrawn' && <Badge variant="gray">Withdrawn</Badge>}
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-700 block mb-1">Your Motivation Letter</span>
                <p className="p-3 bg-[#F5F8FC] rounded-xl text-gray-600 border border-[#E3EAF3]">
                  {selectedApp.message}
                </p>
              </div>

              {selectedApp.skillsNote && (
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Skills Highlighted</span>
                  <p className="text-gray-600">{selectedApp.skillsNote}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-gray-700 block mb-1">Attached Academic CV</span>
                <CvAttachmentField
                  currentUser={currentUser}
                  value={{
                    fileName: selectedApp.cvFileName || `${selectedApp.userName.replace(/\s+/g, '_')}_Academic_CV.pdf`,
                    fileSize: selectedApp.cvFileSize || '1.2 MB',
                    fileData: selectedApp.cvFileData,
                    isCustom: !!selectedApp.cvFileData
                  }}
                  readOnly={true}
                  label=""
                />
              </div>

              {selectedApp.responseNote && (
                <div className="p-3 bg-[#DDF5EA] rounded-xl border border-[#A7F3D0] space-y-1">
                  <span className="font-bold text-[#0E9F6E] block">Supervisor Response:</span>
                  <p className="text-gray-700">{selectedApp.responseNote}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {selectedApp.status === 'pending' ? (
                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="text-xs font-bold text-[#E53935] hover:underline cursor-pointer"
                >
                  Withdraw Application
                </button>
              ) : <div />}

              <button
                onClick={() => {
                  onNavigate(`/projects/${selectedApp.projectId}`);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8]"
              >
                Go to Project Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {withdrawModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center gap-3 text-[#E53935]">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-sm text-[#0B2A55]">Withdraw Application?</h4>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to withdraw your application for "{selectedApp.projectTitle}"? You may reapply later if seats remain open.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdraw(selectedApp.id)}
                className="px-4 py-1.5 bg-[#E53935] text-white rounded-xl text-xs font-bold"
              >
                Confirm Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
