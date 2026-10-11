import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Plus, 
  Edit3, 
  TrendingUp, 
  Sliders, 
  X,
  Sparkles
} from 'lucide-react';
import { User, Milestone, Project } from '../types';
import { storage } from '../services/storage';
import { PikachuMascot } from '../components/common/PikachuMascot';

interface ProjectProgressPageProps {
  projectId: string;
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const ProjectProgressPage: React.FC<ProjectProgressPageProps> = ({
  projectId,
  currentUser,
  onNavigate
}) => {
  const project = storage.getProject(projectId);
  const [milestones, setMilestones] = useState<Milestone[]>(storage.getMilestones(projectId));
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [newPercent, setNewPercent] = useState<number>(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  if (!project) return null;

  const isSupervisorOrOwner = project.supervisorId === currentUser.id || currentUser.role === 'admin';

  // Compute ring percentage
  const avgProgress = milestones.length > 0 
    ? Math.round(milestones.reduce((acc, m) => acc + m.percent, 0) / milestones.length)
    : project.progressPercent;

  const handleUpdatePercent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    storage.updateMilestone(editingMilestone.id, newPercent);
    setMilestones(storage.getMilestones(projectId));
    setEditingMilestone(null);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    storage.addMilestone({
      projectId,
      title: newTitle.trim(),
      percent: 0,
      sortOrder: milestones.length + 1,
      dueDate: newDueDate || project.deadline,
      completed: false
    });
    setMilestones(storage.getMilestones(projectId));
    setAddModalOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 14 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
            Milestones & Research Sprints
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            Project Progress: {project.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Supervised by {project.supervisorName} · CSE 222 Lab Track
          </p>
        </div>

        {isSupervisorOrOwner && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Add Milestone
          </button>
        )}
      </div>

      {/* Progress Card with Circular Ring & Pikachu Mascot matching Screenshot 14 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-8 shadow-xs flex flex-col md:flex-row items-center justify-around gap-8 relative overflow-hidden">
        {/* Left: 75% Circular Ring SVG */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background gray circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth="10"
              />
              {/* Foreground teal/green progress ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#0E9F6E"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * avgProgress) / 100}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-[#0B2A55]">{avgProgress}%</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Completed</span>
            </div>
          </div>

          <span className="text-xs font-bold text-gray-500">Overall Milestone Fulfillment</span>
        </div>

        {/* Mascot Center/Right matching Screenshot 14 */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <PikachuMascot size="lg" speechBubbleText={`${avgProgress}% Complete! Great work!`} />
          <span className="text-xs font-bold text-[#0B2A55]">Research Sprint Mascot</span>
        </div>
      </div>

      {/* Milestone Checklist matching Screenshot 14 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-extrabold text-base text-[#0B2A55]">Milestone Breakdown</h3>
          <span className="text-xs font-bold text-gray-400">{milestones.length} milestones tracked</span>
        </div>

        <div className="space-y-4">
          {milestones.map((m) => {
            const isCompleted = m.percent === 100;
            const isPartial = m.percent > 0 && m.percent < 100;

            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl border border-[#E3EAF3] bg-[#F5F8FC] hover:bg-white hover:border-[#0B6BE6] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon matching screenshot 14: green check (100%), partial yellow ring (60%), empty gray (0%) */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-[#0E9F6E]" />
                    ) : isPartial ? (
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-[#FFC83D] flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFC83D]" />
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[#0B2A55] truncate">{m.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: {m.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Percentage & Controls */}
                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="w-28 text-right">
                    <span className="font-black text-sm text-[#0B2A55]">{m.percent}%</span>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${isCompleted ? 'bg-[#0E9F6E]' : isPartial ? 'bg-[#FFC83D]' : 'bg-transparent'}`}
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                  </div>

                  {isSupervisorOrOwner && (
                    <button
                      onClick={() => {
                        setEditingMilestone(m);
                        setNewPercent(m.percent);
                      }}
                      className="p-2 rounded-xl bg-white border border-[#E3EAF3] hover:bg-gray-100 text-gray-600 transition-colors"
                      title="Adjust percentage"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start / End Dates bar at bottom matching Screenshot 14 */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0B6BE6]" />
            <span>Official Start Date: <strong className="text-[#0B2A55]">{project.startDate}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E53935]" />
            <span>Final Defense & Submission: <strong className="text-[#0B2A55]">{project.endDate}</strong></span>
          </div>
        </div>
      </div>

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-sm text-[#0B2A55]">Update Milestone Progress</h4>
              <button onClick={() => setEditingMilestone(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePercent} className="space-y-4 text-xs">
              <p className="font-semibold text-gray-700">{editingMilestone.title}</p>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-[#0B2A55]">
                  <span>Progress Percentage</span>
                  <span>{newPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newPercent}
                  onChange={(e) => setNewPercent(Number(e.target.value))}
                  className="w-full accent-[#0E9F6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-3 py-1.5 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0E9F6E] text-white rounded-xl font-bold"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-sm text-[#0B2A55]">Create New Milestone</h4>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hyperparameter Tuning & Benchmark"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Target Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0E9F6E] text-white rounded-xl font-bold"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
