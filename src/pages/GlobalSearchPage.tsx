import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  FolderKanban, 
  Users, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight,
  Filter,
  GraduationCap,
  Download,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Quote,
  Share2
} from 'lucide-react';
import { storage } from '../services/storage';
import { ExternalSearchService } from '../services/externalSearchService';
import { ExternalScholarlyResult, Project, Paper, PublicProfile } from '../types';
import { publicProfileService } from '../services/publicProfileService';

interface GlobalSearchPageProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
}

export const GlobalSearchPage: React.FC<GlobalSearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [scholarlyResults, setScholarlyResults] = useState<ExternalScholarlyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [citationFormat, setCitationFormat] = useState<'apa' | 'ieee' | 'harvard' | 'bibtex'>('apa');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Filters
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [studyDesignFilter, setStudyDesignFilter] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [openAccessOnly, setOpenAccessOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'year'>('relevance');
  const [activeTab, setActiveTab] = useState<'global' | 'local_papers' | 'local_projects' | 'scholars'>('global');

  const projects = storage.getProjects();
  const papers = storage.getPapers();
  const publicProfiles = publicProfileService.getPublicProfiles();

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await ExternalSearchService.searchScholarly(q);
    setScholarlyResults(res);
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    } else {
      // Default initial query for immediate rich scholarly showcase
      handleSearch('Artificial Intelligence');
    }
  }, [initialQuery]);

  const qLower = query.toLowerCase().trim();

  // Local Institutional items matching query
  const matchedProjects = qLower ? projects.filter(p => 
    p.title.toLowerCase().includes(qLower) ||
    p.summary.toLowerCase().includes(qLower) ||
    p.areaName.toLowerCase().includes(qLower) ||
    p.requiredSkills.some(s => s.toLowerCase().includes(qLower))
  ) : projects;

  const matchedPapers = qLower ? papers.filter(p =>
    p.title.toLowerCase().includes(qLower) ||
    p.abstract.toLowerCase().includes(qLower) ||
    p.authors.some(a => a.toLowerCase().includes(qLower)) ||
    p.keywords.some(k => k.toLowerCase().includes(qLower))
  ) : papers;

  const matchedPeople = qLower ? publicProfiles.filter(u =>
    u.name.toLowerCase().includes(qLower) ||
    u.headline.toLowerCase().includes(qLower) ||
    u.department.toLowerCase().includes(qLower) ||
    u.skills.some(s => s.toLowerCase().includes(qLower))
  ) : publicProfiles;

  // Filter & Sort Global Scholarly Results
  const filteredScholarly = scholarlyResults.filter(item => {
    // Document Type filter
    if (selectedDocType !== 'all') {
      if (selectedDocType === 'thesis') {
        const isThesis = item.documentType === 'Thesis' || item.documentType === 'Dissertation' || 
          item.title.toLowerCase().includes('thesis') || item.title.toLowerCase().includes('dissertation');
        if (!isThesis) return false;
      } else if (selectedDocType === 'paper') {
        const isPaper = item.documentType === 'Research Paper' || item.documentType === 'Conference Proceeding' || item.documentType === 'Review Article';
        if (!isPaper) return false;
      } else if (selectedDocType === 'preprint') {
        if (item.documentType !== 'Preprint' && item.source !== 'arXiv') return false;
      }
    }

    // Consensus Study Design filter
    if (studyDesignFilter !== 'all') {
      if (studyDesignFilter === 'meta') {
        const isMeta = item.studyDesign?.includes('Meta') || item.studyDesign?.includes('Systematic');
        if (!isMeta) return false;
      } else if (studyDesignFilter === 'rct') {
        const isRct = item.studyDesign?.includes('RCT') || item.studyDesign?.includes('Trial');
        if (!isRct) return false;
      } else if (studyDesignFilter === 'theses') {
        const isTh = item.documentType === 'Thesis' || item.documentType === 'Dissertation' || item.studyDesign?.includes('Dissertation');
        if (!isTh) return false;
      }
    }

    // Source filter
    if (selectedSource !== 'all' && item.source.toLowerCase() !== selectedSource.toLowerCase()) {
      return false;
    }

    // Open Access filter
    if (openAccessOnly && !item.oaPdfUrl) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'citations') {
      return (b.citedByCount || 0) - (a.citedByCount || 0);
    }
    if (sortBy === 'year') {
      return (b.year || 0) - (a.year || 0);
    }
    return 0; // relevance preserves API order
  });

  const copyCitation = (item: ExternalScholarlyResult) => {
    const citations = ExternalSearchService.generateCitation(item);
    let textToCopy = citations.apa;
    if (citationFormat === 'ieee') textToCopy = citations.ieee;
    if (citationFormat === 'harvard') textToCopy = citations.harvard;
    if (citationFormat === 'bibtex') textToCopy = citations.bibtex;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const topicPills = [
    'Thesis on Machine Learning',
    'Quantum Cryptography',
    'Structural Concrete Analysis',
    'VLSI Digital Signal Processing',
    'Renewable Energy Microgrids',
    'Natural Language Processing',
    'Cancer Immunotherapy',
    'Blockchain in Supply Chain',
    'Bangla Speech Recognition',
    'Internet of Things (IoT)'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Search Hero Header */}
      <div className="bg-gradient-to-r from-[#0B2A55] to-[#154687] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-[#60A5FA] border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" />
            Universal Global Academic Search
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Explore All Research Papers, Theses & Dissertations Worldwide
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Search millions of peer-reviewed journal articles, master's theses, doctoral dissertations, conference proceedings, and preprints. Unrestricted to preset research areas—search whatever topic or hypothesis you are investigating.
          </p>

          {/* Search Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} 
            className="relative pt-2"
          >
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-white/20 p-1.5 focus-within:ring-4 focus-within:ring-[#0B6BE6]/30 transition-all">
              <Search className="w-5 h-5 text-gray-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any topic, thesis title, DOI, author, or research paper globally..."
                className="w-full bg-transparent py-3 px-3 text-sm text-[#0B2A55] font-semibold placeholder-gray-400 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search Global Works</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggested Quick Search Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Try searching:
            </span>
            {topicPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setQuery(pill);
                  handleSearch(pill);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-white transition-all cursor-pointer backdrop-blur-xs"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        
        {/* Navigation Tabs between Global Literature and CollabX Collections */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E3EAF3] pb-3 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-bold">
            <button
              onClick={() => { setActiveTab('global'); setStudyDesignFilter('all'); }}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'global'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-[#E3EAF3] hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FFC83D]" />
              <span>Global Literature & Theses ({filteredScholarly.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('local_papers')}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'local_papers'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-[#E3EAF3] hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
              <span>CollabX Papers ({matchedPapers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('local_projects')}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'local_projects'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-[#E3EAF3] hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-[#0B6BE6]" />
              <span>Research Projects ({matchedProjects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('scholars')}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'scholars'
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-[#E3EAF3] hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 text-[#0B6BE6]" />
              <span>Researchers ({matchedPeople.length})</span>
            </button>
          </div>

          {/* Citation Format Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-bold flex items-center gap-1">
              <Quote className="w-3.5 h-3.5" />
              Citation Format:
            </span>
            <select
              value={citationFormat}
              onChange={(e) => setCitationFormat(e.target.value as any)}
              className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#0B2A55] cursor-pointer focus:outline-hidden"
            >
              <option value="apa">APA (7th Edition)</option>
              <option value="ieee">IEEE Format</option>
              <option value="harvard">Harvard Style</option>
              <option value="bibtex">BibTeX Entry</option>
            </select>
          </div>
        </div>

        {/* Global Literature Tab Content */}
        {activeTab === 'global' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Document Type Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-500">Document Type:</span>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 font-bold text-[#0B2A55] cursor-pointer focus:outline-hidden"
                  >
                    <option value="all">All Document Types</option>
                    <option value="thesis">Theses & Dissertations</option>
                    <option value="paper">Journal Articles & Papers</option>
                    <option value="preprint">Preprints & Working Papers</option>
                  </select>
                </div>

                {/* Source Repository Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-500">Repository:</span>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 font-bold text-[#0B2A55] cursor-pointer focus:outline-hidden"
                  >
                    <option value="all">All Repositories</option>
                    <option value="OpenAlex">OpenAlex (250M+ Works)</option>
                    <option value="Europe PMC">Europe PMC</option>
                    <option value="Crossref">Crossref (DOIs)</option>
                    <option value="arXiv">arXiv Preprints</option>
                    <option value="Global Thesis Repository">Global Thesis Repositories</option>
                  </select>
                </div>

                {/* Open Access Toggle */}
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0B2A55] select-none pl-2">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(e) => setOpenAccessOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B6BE6] cursor-pointer"
                  />
                  <span>Open Access PDF Only</span>
                </label>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 font-bold text-[#0B2A55] cursor-pointer focus:outline-hidden"
                >
                  <option value="relevance">Highest Relevance</option>
                  <option value="citations">Most Cited (Impact)</option>
                  <option value="year">Latest Year</option>
                </select>
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-bold">
                Showing {filteredScholarly.length} verified academic publications for <span className="text-[#0B2A55]">"{query || 'Universal Literature'}"</span>
              </span>
              <span className="text-[11px] text-gray-400">
                Connected to OpenAlex, Europe PMC, Crossref & Open Access Institutional Archives
              </span>
            </div>

            {/* Scholarly Cards List */}
            {filteredScholarly.length > 0 ? (
              <div className="space-y-4">
                {filteredScholarly.map((item) => {
                  const isExpanded = Boolean(expandedAbstracts[item.id]);
                  const isThesis = item.documentType === 'Thesis' || item.documentType === 'Dissertation';

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E3EAF3] hover:border-[#0B6BE6] transition-all space-y-3.5 shadow-2xs group"
                    >
                      {/* Top Badges & Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type Badge */}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                            isThesis
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.documentType === 'Preprint'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-[#DCE6FB] text-[#0B6BE6] border border-[#BFDBFE]'
                          }`}>
                            {isThesis ? <GraduationCap className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span>{item.documentType || 'Research Paper'}</span>
                          </span>

                          {/* Source Repository */}
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                            {item.source}
                          </span>

                          {/* Publication Year */}
                          <span className="text-xs font-bold text-gray-400">
                            {item.year}
                          </span>

                          {/* Citations Count */}
                          {item.citedByCount ? (
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ★ {item.citedByCount.toLocaleString()} Citations
                            </span>
                          ) : null}

                          {/* Study Design Badge */}
                          {item.studyDesign && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]">
                              {item.studyDesign}
                            </span>
                          )}

                          {/* Sample Size Badge */}
                          {item.sampleSize && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                              {item.sampleSize}
                            </span>
                          )}
                        </div>

                        {/* DOI Badge */}
                        {item.doi && (
                          <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            DOI: {item.doi}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base sm:text-lg font-extrabold text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors leading-snug">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-4 h-4 text-gray-400 inline shrink-0" />
                        </a>
                      </h2>

                      {/* Venue / University */}
                      {item.venue && (
                        <div className="text-xs font-bold text-[#0B6BE6] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{item.venue}</span>
                        </div>
                      )}

                      {/* Abstract */}
                      <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        <p className={isExpanded ? '' : 'line-clamp-3'}>
                          {item.abstract}
                        </p>
                        {item.abstract.length > 200 && (
                          <button
                            type="button"
                            onClick={() => toggleAbstract(item.id)}
                            className="text-xs font-bold text-[#0B6BE6] hover:underline mt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Show less ▲' : 'Read full abstract ▼'}
                          </button>
                        )}
                      </div>

                      {/* Authors List */}
                      <p className="text-xs text-gray-400">
                        Authors: <span className="text-gray-700 font-semibold">{item.authors.join(', ')}</span>
                      </p>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {/* Left actions: Copy citation & AI Writer */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => copyCitation(item)}
                            className="px-3.5 py-2 rounded-xl bg-[#F5F8FC] hover:bg-gray-200 text-[#0B2A55] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                            title={`Copy in ${citationFormat.toUpperCase()} format`}
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">Copied {citationFormat.toUpperCase()}!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-gray-500" />
                                <span>Copy {citationFormat.toUpperCase()} Citation</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onNavigate(`/ai-writer`)}
                            className="px-3 py-2 rounded-xl text-[#0B6BE6] hover:bg-blue-50 font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Draft Paper with AI Assistant</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Right actions: Open Access PDF or Publisher View */}
                        <div className="flex items-center gap-2">
                          {item.oaPdfUrl && (
                            <a
                              href={item.oaPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold flex items-center gap-1.5 transition-colors border border-emerald-200"
                            >
                              <Download className="w-4 h-4" />
                              <span>Open Access PDF</span>
                            </a>
                          )}

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white font-bold transition-colors flex items-center gap-1.5"
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
            ) : !loading ? (
              <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#0B2A55]">No Global Literature Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  We could not find matching articles under the current filter criteria. Try clearing filters or searching with alternative keywords.
                </p>
                <button
                  onClick={() => {
                    setSelectedDocType('all');
                    setSelectedSource('all');
                    setOpenAccessOnly(false);
                  }}
                  className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#0956b8]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* CollabX Papers Tab Content */}
        {activeTab === 'local_papers' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0B6BE6]" />
              CollabX Institutional Repository Papers ({matchedPapers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedPapers.map(p => (
                <div
                  key={p.id}
                  onClick={() => onNavigate(`/papers/${p.id}`)}
                  className="bg-white p-5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all space-y-3 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#EBF3FE] text-[#0B6BE6] text-xs font-bold">
                      {p.paperType}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">{p.year}</span>
                  </div>
                  <h4 className="font-bold text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors leading-snug">
                    {p.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{p.abstract}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span>{p.authors.join(', ')}</span>
                    <span className="font-bold text-[#0B6BE6] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read Paper →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CollabX Projects Tab Content */}
        {activeTab === 'local_projects' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#0B6BE6]" />
              CollabX Active Research Projects ({matchedProjects.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onNavigate(`/projects/${p.id}`)}
                  className="bg-white p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all space-y-3 group shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <img src={p.thumbnail} alt={p.title} className="w-full h-32 object-cover rounded-xl" />
                    <span className="text-[10px] font-bold text-[#0B6BE6] bg-[#DCE6FB] px-2 py-0.5 rounded block w-fit">
                      {p.areaName}
                    </span>
                    <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] line-clamp-2">
                      {p.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{p.summary}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>{p.supervisorName}</span>
                    <span className="text-emerald-600 font-bold">{p.filledPositions}/{p.totalPositions} filled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Researchers Tab Content */}
        {activeTab === 'scholars' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0B6BE6]" />
              Academic Scholars & Researchers ({matchedPeople.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedPeople.map(u => (
                <div
                  key={u.id}
                  onClick={() => onNavigate(`/u/${u.id}`)}
                  className="bg-white p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all flex items-center gap-3.5 group shadow-2xs"
                >
                  <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-100" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{u.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{u.headline}</p>
                    <p className="text-[11px] text-[#0B6BE6] font-semibold truncate">{u.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
