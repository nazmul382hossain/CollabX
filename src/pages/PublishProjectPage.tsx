import React, { useState } from 'react';
import { 
  FolderGit2, 
  ArrowLeft, 
  Check, 
  Upload, 
  Plus, 
  X, 
  Calendar, 
  Users, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { User, ProjectType, ProjectDifficulty } from '../types';
import { storage } from '../services/storage';
import { RESEARCH_AREAS } from '../data/seedData';

interface PublishProjectPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const PublishProjectPage: React.FC<PublishProjectPageProps> = ({ currentUser, onNavigate }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [areaId, setAreaId] = useState('area-ai');
  const [projectType, setProjectType] = useState<ProjectType>('Thesis');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>('Intermediate');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>([
    'Design and validate high-accuracy prediction baseline',
    'Evaluate latency performance on resource-constrained hardware'
  ]);
  const [newObjective, setNewObjective] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('Conference paper submission and open-source benchmark repository.');
  const [durationMonths, setDurationMonths] = useState(6);
  const [totalPositions, setTotalPositions] = useState(4);
  const [deadline, setDeadline] = useState('2026-12-30');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-02-01');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Python', 'Machine Learning']);
  const [newSkill, setNewSkill] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80');
  const [successToast, setSuccessToast] = useState('');

  const selectedAreaObj = RESEARCH_AREAS.find(a => a.id === areaId) || RESEARCH_AREAS[0];

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (s: string) => {
    setRequiredSkills(requiredSkills.filter(item => item !== s));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newProject = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: summary.trim() || title.trim(),
      description: description.trim(),
      objectives,
      expectedOutcome,
      areaId,
      areaName: selectedAreaObj.name,
      projectType,
      difficulty,
      durationMonths,
      totalPositions,
      filledPositions: 1, // supervisor is member
      deadline,
      startDate,
      endDate,
      status: 'active' as const,
      supervisorId: currentUser.id,
      supervisorName: currentUser.name,
      supervisorAvatar: currentUser.avatar,
      supervisorDesignation: currentUser.headline,
      requiredSkills,
      tags: [selectedAreaObj.name, projectType],
      thumbnail,
      views: 1,
      progressPercent: 0,
      createdAt: new Date().toISOString()
    };

    storage.addProject(newProject);
    setSuccessToast(`Project "${title}" has been published and opened for applications!`);

    setTimeout(() => {
      onNavigate(`/projects/${newProject.id}`);
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <button
        onClick={() => onNavigate('/my-projects')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6BE6] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Projects
      </button>

      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-10 space-y-8 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B6BE6]">
            Faculty & Researcher Publishing Wizard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            Publish New Research Project
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Specify technical objectives, seats, required student qualifications, and milestones
          </p>
        </div>

        {successToast && (
          <div className="p-4 bg-[#DDF5EA] border border-[#A7F3D0] rounded-2xl text-xs font-bold text-[#0E9F6E] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-6 text-xs">
          {/* Step 1: Basics */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0B2A55] border-b pb-2">1. Basic Information</h3>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Project Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Multi-Modal Vision Transformers for Thoracic Diagnostics"
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-4 py-2.5 text-sm text-[#0B2A55] font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Short Summary (1-2 sentences) *</label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief high-level description for cards and search results..."
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Research Domain</label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                >
                  {RESEARCH_AREAS.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                >
                  <option value="Thesis">Thesis</option>
                  <option value="Funded Research">Funded Research</option>
                  <option value="Course Project">Course Project</option>
                  <option value="Open Source">Open Source</option>
                  <option value="Competition">Competition</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Problem Statement & Objectives */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0B2A55] border-b pb-2">2. Research Details & Objectives</h3>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Full Description & Problem Statement *</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the scientific background, problem motivations, methodology, dataset, and expectations..."
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-[#0B2A55]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block">Key Objectives</label>
              <div className="space-y-1.5">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3]">
                    <span>• {obj}</span>
                    <button type="button" onClick={() => handleRemoveObjective(i)} className="text-gray-400 hover:text-red-600">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add another objective..."
                  className="flex-1 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="px-4 py-1.5 bg-[#0B6BE6] text-white rounded-xl font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Expected Deliverable / Publication</label>
              <input
                type="text"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              />
            </div>
          </div>

          {/* Step 3: Requirements & Seats */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0B2A55] border-b pb-2">3. Team Capacity & Requirements</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Total Positions / Seats</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={totalPositions}
                  onChange={(e) => setTotalPositions(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Duration (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Application Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block">Required Technical Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {requiredSkills.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-[#DCE6FB] text-[#0B6BE6] font-bold flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. PyTorch, ROS, React, C++"
                  className="flex-1 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-1.5 bg-[#0B6BE6] text-white rounded-xl font-bold"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onNavigate('/my-projects')}
              className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Publish Project Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
