import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { storage } from '../services/storage';
import { RecommendationService } from '../services/recommendationService';
import { RESEARCH_AREAS } from '../data/seedData';
import { Project, User } from '../types';
import { Badge } from '../components/common/Badge';

interface ProjectsPageProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  initialAreaSlug?: string;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  currentUser,
  onNavigate,
  initialAreaSlug
}) => {
  const allProjects = storage.getProjects();
  const savedProjectIds = currentUser ? storage.getSavedProjectIds(currentUser.id) : [];

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>(initialAreaSlug || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['active']);
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'popular' | 'match'>('latest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const availableSkills = [
    'Python', 
    'Machine Learning', 
    'Data Analysis', 
    'Web Development', 
    'Cyber Security', 
    'PyTorch', 
    'Arduino', 
    'TypeScript',
    'Cryptography',
    'IoT Protocols'
  ];

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleStatusToggle = (status: string) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter(s => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  const resetFilters = () => {
    setSelectedArea('all');
    setSelectedType('all');
    setSelectedSkills([]);
    setSelectedStatus(['active']);
    setSearchQuery('');
  };

  // Recommendations mapping
  const recommendationsMap = useMemo(() => {
    if (!currentUser) return new Map<string, number>();
    const recs = RecommendationService.getRecommendedProjects(currentUser, allProjects, savedProjectIds);
    const map = new Map<string, number>();
    recs.forEach(r => map.set(r.project.id, r.matchScore));
    return map;
  }, [currentUser, allProjects, savedProjectIds]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.supervisorName.toLowerCase().includes(q) ||
          p.areaName.toLowerCase().includes(q) ||
          p.requiredSkills.some(s => s.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Area
      if (selectedArea !== 'all') {
        const targetArea = RESEARCH_AREAS.find(a => a.slug === selectedArea || a.name.toLowerCase() === selectedArea.toLowerCase());
        if (targetArea && p.areaId !== targetArea.id && p.areaName.toLowerCase() !== targetArea.name.toLowerCase()) {
          return false;
        }
      }

      // Type
      if (selectedType !== 'all' && p.projectType !== selectedType) {
        return false;
      }

      // Skills
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some(req => 
          p.requiredSkills.some(ps => ps.toLowerCase().includes(req.toLowerCase()))
        );
        if (!hasSkill) return false;
      }

      // Status
      if (selectedStatus.length > 0) {
        if (!selectedStatus.includes(p.status)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match' && currentUser) {
        const scoreA = recommendationsMap.get(a.id) || 0;
        const scoreB = recommendationsMap.get(b.id) || 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'popular') {
        return b.views - a.views;
      }
      // default: latest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allProjects, searchQuery, selectedArea, selectedType, selectedSkills, selectedStatus, sortBy, recommendationsMap, currentUser]);

  const FilterPanel = (
    <div className="bg-white rounded-2xl border border-[#E3EAF3] p-5 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-sm text-[#0B2A55] flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0B6BE6]" />
          Filters
        </h3>
        <button
          onClick={resetFilters}
          className="text-xs text-[#0B6BE6] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Research Area Select */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">Research Area</label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
        >
          <option value="all">All Research Areas</option>
          {RESEARCH_AREAS.map(a => (
            <option key={a.id} value={a.slug}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Project Type Select */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">Project Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
        >
          <option value="all">All Project Types</option>
          <option value="Thesis">Thesis</option>
          <option value="Funded Research">Funded Research</option>
          <option value="Course Project">Course Project</option>
          <option value="Open Source">Open Source</option>
          <option value="Competition">Competition</option>
          <option value="Industry">Industry</option>
        </select>
      </div>

      {/* Required Skills Checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">Required Skills</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {availableSkills.map((skill) => (
            <label key={skill} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[#0B2A55]">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill)}
                onChange={() => handleSkillToggle(skill)}
                className="rounded border-gray-300 text-[#0B6BE6] focus:ring-[#0B6BE6]"
              />
              <span>{skill}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">Project Status</label>
        <div className="space-y-1.5">
          {[
            { label: 'Active (Open for applications)', val: 'active' },
            { label: 'Completed', val: 'completed' }
          ].map(st => (
            <label key={st.val} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatus.includes(st.val)}
                onChange={() => handleStatusToggle(st.val)}
                className="rounded border-gray-300 text-[#0B6BE6] focus:ring-[#0B6BE6]"
              />
              <span>{st.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Filters Yellow Button matching screenshot */}
      <button
        onClick={() => setMobileFilterOpen(false)}
        className="w-full py-2.5 bg-[#FFC83D] hover:bg-[#f5bc28] text-[#0B2A55] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
      >
        Apply Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Bar Section matching Page 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Browse Research Projects</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Showing {filteredProjects.length} available research positions across faculty departments
          </p>
        </div>

        {/* Search input in top bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, labs, areas, researchers…"
              className="w-full bg-white border border-[#E3EAF3] rounded-full py-2 pl-4 pr-10 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6] shadow-2xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#E3EAF3] text-gray-600 hover:text-[#0B6BE6] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Filters, Right Project Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Left Filter Panel */}
        <div className="hidden lg:block lg:col-span-1">
          {FilterPanel}
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 lg:hidden">
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 relative shadow-2xl">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              {FilterPanel}
            </div>
          </div>
        )}

        {/* Right Listing Column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sort bar */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-[#E3EAF3] flex items-center justify-between text-xs font-semibold text-gray-600 shadow-2xs">
            <span className="text-gray-500">
              Showing <span className="text-[#0B2A55] font-bold">{filteredProjects.length}</span> results
            </span>

            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F5F8FC] border border-[#E3EAF3] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0B2A55] focus:outline-hidden cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="deadline">Deadline soon</option>
                <option value="popular">Most popular</option>
                {currentUser && <option value="match">Best match (AI)</option>}
              </select>
            </div>
          </div>

          {/* Project Rows (Screenshot 3 style) */}
          {filteredProjects.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#E3EAF3] divide-y divide-[#E3EAF3] shadow-xs overflow-hidden">
              {filteredProjects.map((p) => {
                const isFull = p.filledPositions >= p.totalPositions;
                const matchScore = recommendationsMap.get(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigate(`/projects/${p.id}`)}
                    className="p-4 sm:p-5 hover:bg-[#F5F8FC] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: 140x105 rounded thumbnail + details */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* 140x105 Aspect Thumbnail */}
                      <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {matchScore && matchScore > 75 && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0E9F6E] text-white">
                            {matchScore}% match
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCE6FB] text-[#0B6BE6]">
                            {p.areaName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                            {p.projectType}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#D97706]">
                            {p.difficulty}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors truncate">
                          {p.title}
                        </h3>

                        <p className="text-xs text-gray-500 line-clamp-1">
                          {p.summary}
                        </p>

                        {/* Supervisor row with seats */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <img src={p.supervisorAvatar} alt={p.supervisorName} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-semibold text-gray-700">{p.supervisorName}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[#0E9F6E] font-semibold">
                            <Users className="w-3.5 h-3.5" />
                            <span>{p.filledPositions}/{p.totalPositions} seats</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column: Status badge & deadline date */}
                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div>
                        {isFull ? (
                          <Badge variant="gray">Full</Badge>
                        ) : p.status === 'completed' ? (
                          <Badge variant="teal">Completed</Badge>
                        ) : (
                          <Badge variant="green" dot={true}>Open</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#E53935] font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deadline: {p.deadline}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E3EAF3] p-12 text-center space-y-3">
              <p className="text-sm font-semibold text-gray-500">No projects match the selected filters.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8] transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
