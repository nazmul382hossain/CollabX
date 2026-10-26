import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';
import { storage } from '../services/storage';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { publicProfileService } from '../services/publicProfileService';

interface ManageUsersPageProps {
  onNavigate: (path: string) => void;
  initialRoleFilter?: string;
}

export const ManageUsersPage: React.FC<ManageUsersPageProps> = ({ onNavigate, initialRoleFilter = 'all' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialRoleFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // New user form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newDepartment, setNewDepartment] = useState('Computer Science and Engineering');

  const users = storage.getUsers();

  const totalCount = users.length;
  const studentsCount = users.filter(u => u.role === 'student').length;
  const researchersCount = users.filter(u => u.role === 'researcher').length;
  const supervisorsCount = users.filter(u => u.role === 'supervisor').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  const filtered = users.filter(u => {
    if (activeTab === 'students' && u.role !== 'student') return false;
    if (activeTab === 'researchers' && u.role !== 'researcher') return false;
    if (activeTab === 'supervisors' && u.role !== 'supervisor') return false;
    if (activeTab === 'admins' && u.role !== 'admin') return false;

    if (searchQuery.trim()) {
      return (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleToggleStatus = (targetUser: User) => {
    const updated: User = {
      ...targetUser,
      status: targetUser.status === 'active' ? 'inactive' : 'active'
    };
    storage.updateUser(updated);
    publicProfileService.syncUserProfile(updated);
  };

  const handleUpdateVerification = (targetUser: User, status: 'verified' | 'rejected') => {
    const updated: User = {
      ...targetUser,
      verificationStatus: status,
      verified: status === 'verified'
    };
    storage.updateUser(updated);
    publicProfileService.syncUserProfile(updated);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const safeRole: UserRole = (newRole === 'supervisor' || newRole === 'researcher') ? newRole : 'student';

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: safeRole,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      headline: `${safeRole === 'student' ? 'Student' : 'Faculty Researcher'} · ${newDepartment}`,
      department: newDepartment,
      institution: 'Port City International University',
      bio: 'Enrolled academic researcher.',
      interests: ['Artificial Intelligence'],
      skills: ['Python'],
      links: {},
      createdAt: new Date().toISOString()
    };

    storage.addUser(newUser);
    publicProfileService.syncUserProfile(newUser);

    setAddModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,Email,Role,Department,Status,Created\n';
    const rows = filtered.map(u => `"${u.id}","${u.name}","${u.email}","${u.role}","${u.department}","${u.status}","${u.createdAt}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollabX_Users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 20 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Manage Users</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Accounts, academic permissions, and verification status across departments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#E3EAF3] hover:bg-gray-50 text-[#0B2A55] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Add User
          </button>
        </div>
      </div>

      {/* Tabs matching Screenshot 20 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3EAF3] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          {[
            { key: 'all', label: `All Users (${totalCount})` },
            { key: 'students', label: `Students (${studentsCount})` },
            { key: 'researchers', label: `Researchers (${researchersCount})` },
            { key: 'supervisors', label: `Supervisors (${supervisorsCount})` },
            { key: 'admins', label: `Admins (${adminsCount})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#0E9F6E] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scholars or email…"
            className="w-full bg-white border border-[#E3EAF3] rounded-full py-1.5 pl-8 pr-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table matching Screenshot 20 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DEEBFB]/50 text-[#0B2A55] font-bold border-b border-[#E3EAF3]">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Verification</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAF3]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[#F5F8FC] transition-colors">
                  {/* Name + Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="sm" />
                      <div>
                        <span 
                          onClick={() => onNavigate(`/u/${u.id}`)}
                          className="font-bold text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer block truncate"
                        >
                          {u.name}
                        </span>
                        <span className="text-[10px] text-gray-400">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-800 capitalize">
                      {u.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-4 px-6 font-semibold text-gray-600 truncate max-w-xs">
                    {u.department}
                  </td>

                  {/* Verification Status */}
                  <td className="py-4 px-6">
                    {u.verificationStatus === 'pending' ? (
                      <Badge variant="yellow" dot={true}>Pending ID Review</Badge>
                    ) : u.verificationStatus === 'rejected' ? (
                      <Badge variant="red">Rejected</Badge>
                    ) : (
                      <Badge variant="green" dot={true}>Verified</Badge>
                    )}
                  </td>

                  {/* Status: Active green / Inactive pink */}
                  <td className="py-4 px-6">
                    {u.status === 'active' ? (
                      <Badge variant="green" dot={true}>Active</Badge>
                    ) : (
                      <Badge variant="red">Inactive</Badge>
                    )}
                  </td>

                  {/* Actions: View, Approve/Reject, Edit/Toggle, Delete */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      {u.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateVerification(u, 'verified')}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Approve Institutional ID"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateVerification(u, 'rejected')}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Reject Institutional ID"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onNavigate(`/u/${u.id}`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B6BE6] hover:bg-gray-100"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.status === 'active' 
                            ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50' 
                            : 'text-[#0E9F6E] hover:bg-green-50'
                        }`}
                        title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmUser(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#E53935] hover:bg-red-50"
                        title="Delete user"
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

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#0B2A55]">Provision New User Account</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Prof. Alex Mercer"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Academic Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@pciu.edu.bd"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="student">Student</option>
                    <option value="researcher">Researcher</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="Computer Science and Engineering">CSE</option>
                    <option value="Electrical and Electronic Engineering">EEE</option>
                    <option value="Civil Engineering">Civil</option>
                    <option value="Business Administration">BBA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6BE6] text-white rounded-xl font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center gap-3 text-[#E53935]">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-sm text-[#0B2A55]">Revoke User Access?</h4>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to deactivate and remove <strong>{deleteConfirmUser.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(deleteConfirmUser);
                  setDeleteConfirmUser(null);
                }}
                className="px-4 py-2 bg-[#E53935] text-white rounded-xl text-xs font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
