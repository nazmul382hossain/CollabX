import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  X,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink,
  Download,
  Copy,
  Check,
  ArrowRight,
  FolderKanban,
  Scale
} from 'lucide-react';
import { storage } from '../services/storage';
import { RecommendationService } from '../services/recommendationService';
import { ExternalSearchService } from '../services/externalSearchService';
import { ConsensusService } from '../services/consensusService';
import { RESEARCH_AREAS } from '../data/seedData';
import { Project, User, ExternalScholarlyResult, Paper } from '../types';
import { Badge } from '../components/common/Badge';

interface ProjectsPageProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  initialAreaSlug?: string;
  initialSearchQuery?: string;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  currentUser,
  onNavigate,
  initialAreaSlug,
  initialSearchQuery
}) => {
  const allProjects = storage.getProjects();
  const allPapers = storage.getPapers();
  const savedProjectIds = currentUser ? storage.getSavedProjectIds(currentUser.id) : [];

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedArea, setSelectedArea] = useState<string>(initialAreaSlug || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['active']);
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'popular' | 'match'>('latest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync props changes
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialAreaSlug !== undefined) {
      setSelectedArea(initialAreaSlug);
    }
  }, [initialAreaSlug]);

  // Search Results & Active Tab
  const [activeSearchTab, setActiveSearchTab] = useState<'all' | 'consensus' | 'projects' | 'scholarly' | 'papers'>('all');
  const [studyDesignFilter, setStudyDesignFilter] = useState<string>('all');
  const [scholarlyResults, setScholarlyResults] = useState<ExternalScholarlyResult[]>([]);
  const [loadingScholarly, setLoadingScholarly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Consensus Analysis calculation
  const consensusAnalysis = useMemo(() => {
    if (!searchQuery.trim() || scholarlyResults.length === 0) return null;
    return ConsensusService.generateConsensusAnalysis(searchQuery, scholarlyResults);
  }, [searchQuery, scholarlyResults]);

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
    setScholarlyResults([]);
  };

  // Debounced search for global research papers and theses whenever user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setScholarlyResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingScholarly(true);
      const res = await ExternalSearchService.searchScholarly(searchQuery);
      setScholarlyResults(res);
      setLoadingScholarly(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allProjects, searchQuery, selectedArea, selectedType, selectedSkills, selectedStatus, sortBy, currentUser, recommendationsMap]);

  // Local matching papers
  const matchedLocalPapers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPapers.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.abstract.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q)) ||
      p.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [allPapers, searchQuery]);

  const copyCitation = (item: ExternalScholarlyResult) => {
    const { apa } = ExternalSearchService.generateCitation(item);
    navigator.clipboard.writeText(apa);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hasSearch = Boolean(searchQuery.trim());
  const totalCombinedResults = filteredProjects.length + scholarlyResults.length + matchedLocalPapers.length;

  // Filter Panel Component
  const FilterPanel = (
    <div className="bg-white rounded-2xl border border-[#E3EAF3] p-5 space-y-6 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
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

      {/* Apply Filters Yellow Button */}
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
      {/* Top Bar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
            Browse Research Projects & Literature
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {hasSearch 
              ? `Found ${totalCombinedResults} research works and positions matching "${searchQuery}"`
              : `Showing ${filteredProjects.length} available research positions across faculty departments`
            }
          </p>
        </div>

        {/* Search input in top bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any topic, paper, thesis, or keyword…"
              className="w-full bg-white border border-[#CBD5E1] rounded-full py-2.5 pl-4 pr-11 text-xs sm:text-sm font-semibold text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6] focus:ring-2 focus:ring-[#0B6BE6]/20 shadow-2xs placeholder-gray-400"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-8 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#E3EAF3] text-gray-600 hover:text-[#0B6BE6] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Results Category Tabs (Shown when search is active) */}
      {hasSearch && (
        <div className="bg-white p-2.5 rounded-2xl border border-[#E3EAF3] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveSearchTab('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSearchTab === 'all'
                  ? 'bg-[#0B2A55] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Matches ({totalCombinedResults})
            </button>

            <button
              onClick={() => setActiveSearchTab('scholarly')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSearchTab === 'scholarly'
                  ? 'bg-[#0B6BE6] text-white shadow-xs'
                  : 'bg-blue-50 text-[#0B6BE6] hover:bg-blue-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" />
              Global Research Papers & Theses ({scholarlyResults.length})
            </button>

            <button
              onClick={() => setActiveSearchTab('consensus')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSearchTab === 'consensus'
                  ? 'bg-gradient-to-r from-[#1565E8] to-[#4F46E5] text-white shadow-xs'
                  : 'bg-indigo-50 text-[#4338CA] hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Consensus AI Meter</span>
            </button>

            <button
              onClick={() => setActiveSearchTab('projects')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSearchTab === 'projects'
                  ? 'bg-[#0B2A55] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#0B6BE6]" />
              University Projects ({filteredProjects.length})
            </button>

            {matchedLocalPapers.length > 0 && (
              <button
                onClick={() => setActiveSearchTab('papers')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSearchTab === 'papers'
                    ? 'bg-[#0B2A55] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Institutional Papers ({matchedLocalPapers.length})
              </button>
            )}
          </div>

          <button
            onClick={() => onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
            className="text-xs font-bold text-[#0B6BE6] hover:underline flex items-center gap-1 cursor-pointer pr-2"
          >
            <span>Open in Full Dedicated Search Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Filters, Right Content */}
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
        <div className="lg:col-span-3 space-y-6">
          {/* Sort bar */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-[#E3EAF3] flex items-center justify-between text-xs font-semibold text-gray-600 shadow-2xs">
            <span className="text-gray-500">
              Showing <span className="text-[#0B2A55] font-bold">
                {hasSearch 
                  ? activeSearchTab === 'scholarly' 
                    ? scholarlyResults.length 
                    : activeSearchTab === 'projects'
                      ? filteredProjects.length
                      : totalCombinedResults
                  : filteredProjects.length
                }
              </span> results
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

          {/* Loading indicator for scholarly query */}
          {loadingScholarly && (
            <div className="p-4 rounded-2xl bg-[#EBF3FE] border border-[#BFDBFE] flex items-center gap-3 text-xs text-[#0B6BE6]">
              <div className="w-4 h-4 border-2 border-[#0B6BE6] border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-bold">
                Querying 250M+ global works for "{searchQuery}" across OpenAlex, Europe PMC, and Crossref...
              </span>
            </div>
          )}

          {/* 1. Global Scholarly Research Papers & Theses Section */}
          {hasSearch && (activeSearchTab === 'all' || activeSearchTab === 'consensus' || activeSearchTab === 'scholarly') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFC83D]" />
                  Global Research Papers & Consensus Evidence for "{searchQuery}" ({scholarlyResults.length})
                </h3>
                <span className="text-[11px] text-gray-400">Indexed globally</span>
              </div>

              {scholarlyResults.length > 0 ? (
                <div className="space-y-3.5">
                  {scholarlyResults.map((s) => {
                    const isExpanded = Boolean(expandedAbstracts[s.id]);
                    const isThesis = s.documentType === 'Thesis' || s.documentType === 'Dissertation';

                    return (
                      <div
                        key={s.id}
                        className="bg-white p-5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] transition-all space-y-3 shadow-2xs group"
                      >
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                              isThesis
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : s.documentType === 'Preprint'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-[#DCE6FB] text-[#0B6BE6] border border-[#BFDBFE]'
                            }`}>
                              {isThesis ? <GraduationCap className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              <span>{s.documentType || 'Research Paper'}</span>
                            </span>

                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              {s.source}
                            </span>

                            <span className="text-xs font-bold text-gray-400">
                              {s.year}
                            </span>

                            {s.citedByCount ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                ★ {s.citedByCount.toLocaleString()} Citations
                              </span>
                            ) : null}

                            {/* Study Design Badge */}
                            {s.studyDesign && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]">
                                {s.studyDesign}
                              </span>
                            )}

                            {/* Sample Size Badge */}
                            {s.sampleSize && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                                {s.sampleSize}
                              </span>
                            )}

                            {/* Consensus Agreement Stance Badge */}
                            {s.consensusStance && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                s.consensusStance === 'supports' 
                                  ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                                  : s.consensusStance === 'neutral'
                                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                    : 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  s.consensusStance === 'supports' ? 'bg-[#10B981]' : s.consensusStance === 'neutral' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                                }`} />
                                {s.consensusStance === 'supports' ? 'Supports' : s.consensusStance === 'neutral' ? 'Context Dependent' : 'Disputes'}
                              </span>
                            )}
                          </div>

                          {s.doi && (
                            <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              DOI: {s.doi}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-extrabold text-sm sm:text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors leading-snug">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                            <span>{s.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 inline" />
                          </a>
                        </h4>

                        {/* Venue */}
                        {s.venue && (
                          <div className="text-xs font-bold text-[#0B6BE6] flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{s.venue}</span>
                          </div>
                        )}

                        {/* CONSENSUS KEY TAKEAWAY CALLOUT BOX */}
                        {s.keyTakeaway && (
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#F0F7FF] via-[#EEF4FF] to-[#FAF5FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] flex items-start gap-2.5 shadow-2xs">
                            <div className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#1565E8] text-white shrink-0 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#FCD34D]" />
                              Consensus Takeaway
                            </div>
                            <span className="font-medium text-gray-800 leading-relaxed italic">
                              "{s.keyTakeaway}"
                            </span>
                          </div>
                        )}

                        {/* Abstract */}
                        <div className="text-xs text-gray-600 leading-relaxed">
                          <p className={isExpanded ? '' : 'line-clamp-2'}>
                            {s.abstract}
                          </p>
                          {s.abstract.length > 180 && (
                            <button
                              type="button"
                              onClick={() => toggleAbstract(s.id)}
                              className="text-xs font-bold text-[#0B6BE6] hover:underline mt-1 cursor-pointer"
                            >
                              {isExpanded ? 'Show less ▲' : 'Read full abstract ▼'}
                            </button>
                          )}
                        </div>

                        {/* Authors */}
                        <p className="text-[11px] text-gray-400">
                          Authors: <span className="text-gray-700 font-semibold">{s.authors.join(', ')}</span>
                        </p>

                        {/* Card Footer Actions */}
                        <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyCitation(s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5F8FC] hover:bg-gray-200 text-[#0B2A55] font-bold cursor-pointer transition-colors"
                            >
                              {copiedId === s.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied APA!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Copy Citation</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onNavigate(`/ai-writer`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[#0B6BE6] hover:bg-blue-50 font-bold transition-colors cursor-pointer"
                            >
                              <span>Use in AI Writer</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {s.oaPdfUrl && (
                              <a
                                href={s.oaPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors border border-emerald-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Open Access PDF</span>
                              </a>
                            )}

                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white font-bold transition-colors"
                            >
                              <span>Repository View</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !loadingScholarly ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-[#CBD5E1] text-center text-xs text-gray-500">
                  No scholarly publications found for this keyword.
                </div>
              ) : null}
            </div>
          )}

          {/* 2. University Faculty Research Projects Section */}
          {(activeSearchTab === 'all' || activeSearchTab === 'projects') && (
            <div className="space-y-4">
              {hasSearch && (
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[#0B6BE6]" />
                    University Research Projects ({filteredProjects.length})
                  </h3>
                </div>
              )}

              {filteredProjects.length > 0 ? (
                <div className="space-y-4">
                  {filteredProjects.map((p) => {
                    const isFull = p.filledPositions >= p.totalPositions;
                    const matchScore = currentUser ? recommendationsMap.get(p.id) : undefined;

                    return (
                      <div
                        key={p.id}
                        onClick={() => onNavigate(`/projects/${p.id}`)}
                        className="bg-white rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] p-5 sm:p-6 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                      >
                        {/* Left column: Thumbnail & Information */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-[#E3EAF3] group-hover:scale-102 transition-transform"
                          />

                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Area and Match score */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3FE] text-[#0B6BE6]">
                                {p.areaName}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                • {p.projectType}
                              </span>
                              {matchScore !== undefined && matchScore > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF5EA] text-[#0E9F6E]">
                                  <Sparkles className="w-3 h-3" />
                                  {matchScore}% match
                                </span>
                              )}
                            </div>

                            {/* Project Title */}
                            <h3 className="font-extrabold text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors line-clamp-1">
                              {p.title}
                            </h3>

                            {/* Summary */}
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {p.summary}
                            </p>

                            {/* Meta info: Supervisor, positions */}
                            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5 font-medium">
                                <img
                                  src={p.supervisorAvatar}
                                  alt={p.supervisorName}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-gray-700 font-semibold">{p.supervisorName}</span>
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
              ) : hasSearch ? (
                scholarlyResults.length === 0 && !loadingScholarly ? (
                  <div className="bg-white rounded-2xl border border-[#E3EAF3] p-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-gray-500">
                      No university research projects or papers matching "{searchQuery}".
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8] transition-colors cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-[#0B6BE6] flex items-center justify-between">
                    <span>
                      No departmental campus project vacancies currently open for "{searchQuery}". See the {scholarlyResults.length} global research papers, theses, and dissertations above.
                    </span>
                    <button
                      onClick={() => onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                      className="font-bold underline cursor-pointer shrink-0 ml-2"
                    >
                      Open Full Search
                    </button>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-2xl border border-[#E3EAF3] p-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-gray-500">
                    No projects match the selected filters.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold hover:bg-[#0956b8] transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. CollabX Local Institutional Papers */}
          {hasSearch && matchedLocalPapers.length > 0 && (activeSearchTab === 'all' || activeSearchTab === 'papers') && (
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
                Institutional Repository Papers ({matchedLocalPapers.length})
              </h3>
              <div className="space-y-3">
                {matchedLocalPapers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate(`/papers/${p.id}`)}
                    className="bg-white p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] transition-all cursor-pointer flex items-start justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF3FE] text-[#0B6BE6]">
                          {p.paperType}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">{p.year}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors mt-1">
                        {p.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.abstract}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                        <span>{p.authors.join(', ')}</span>
                        <span>•</span>
                        <span>{p.views} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B6BE6] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
