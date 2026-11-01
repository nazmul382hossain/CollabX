import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  ExternalLink, 
  BookOpen, 
  FolderKanban, 
  Users, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  Filter, 
  Download,
  Scale,
  CheckCircle2,
  BarChart3,
  Quote
} from 'lucide-react';
import { storage } from '../../services/storage';
import { ExternalSearchService } from '../../services/externalSearchService';
import { ConsensusService } from '../../services/consensusService';
import { ConsensusMeterCard } from '../common/ConsensusMeterCard';
import { Project, Paper, ExternalScholarlyResult, PublicProfile } from '../../types';
import { publicProfileService } from '../../services/publicProfileService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  initialQuery?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'consensus' | 'scholarly' | 'theses' | 'papers' | 'projects' | 'people'>('all');
  const [scholarlyFilter, setScholarlyFilter] = useState<'all' | 'thesis' | 'paper' | 'preprint'>('all');
  const [studyDesignFilter, setStudyDesignFilter] = useState<string>('all');
  const [consensusMode, setConsensusMode] = useState<boolean>(true);
  const [scholarlyResults, setScholarlyResults] = useState<ExternalScholarlyResult[]>([]);
  const [loadingScholarly, setLoadingScholarly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery && !query) {
        setQuery(initialQuery);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen, initialQuery]);

  // Handle global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search for global scholarly articles and thesis papers
  useEffect(() => {
    if (!query.trim()) {
      setScholarlyResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingScholarly(true);
      const res = await ExternalSearchService.searchScholarly(query);
      setScholarlyResults(res);
      setLoadingScholarly(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Consensus Analysis calculation
  const consensusAnalysis = useMemo(() => {
    if (!query.trim() || scholarlyResults.length === 0) return null;
    return ConsensusService.generateConsensusAnalysis(query, scholarlyResults);
  }, [query, scholarlyResults]);

  if (!isOpen) return null;

  const qLower = query.toLowerCase().trim();

  // Filter local items without restricting to fixed areas
  const localProjects: Project[] = qLower ? storage.getProjects().filter(p => 
    p.title.toLowerCase().includes(qLower) || 
    p.summary.toLowerCase().includes(qLower) ||
    p.areaName.toLowerCase().includes(qLower) ||
    p.requiredSkills.some(s => s.toLowerCase().includes(qLower)) ||
    p.tags.some(t => t.toLowerCase().includes(qLower))
  ) : storage.getProjects().slice(0, 3);

  const localPapers: Paper[] = qLower ? storage.getPapers().filter(p =>
    p.title.toLowerCase().includes(qLower) ||
    p.abstract.toLowerCase().includes(qLower) ||
    p.keywords.some(k => k.toLowerCase().includes(qLower)) ||
    p.authors.some(a => a.toLowerCase().includes(qLower)) ||
    p.paperType.toLowerCase().includes(qLower)
  ) : storage.getPapers().slice(0, 3);

  const localPeople: PublicProfile[] = qLower ? publicProfileService.getPublicProfiles().filter(u =>
    u.name.toLowerCase().includes(qLower) ||
    u.headline.toLowerCase().includes(qLower) ||
    u.skills.some(s => s.toLowerCase().includes(qLower)) ||
    u.department.toLowerCase().includes(qLower)
  ) : publicProfileService.getPublicProfiles().slice(0, 3);

  // Filtered scholarly results by document type & study design
  const filteredScholarly = scholarlyResults.filter(s => {
    // Document Type Filter
    if (scholarlyFilter === 'thesis') {
      const isThesis = s.documentType === 'Thesis' || s.documentType === 'Dissertation' || s.title.toLowerCase().includes('thesis') || s.title.toLowerCase().includes('dissertation');
      if (!isThesis) return false;
    } else if (scholarlyFilter === 'paper') {
      const isPaper = s.documentType === 'Research Paper' || s.documentType === 'Conference Proceeding' || s.documentType === 'Review Article';
      if (!isPaper) return false;
    } else if (scholarlyFilter === 'preprint') {
      if (s.documentType !== 'Preprint' && s.source !== 'arXiv') return false;
    }

    // Study Design Filter (Consensus)
    if (studyDesignFilter !== 'all') {
      if (studyDesignFilter === 'meta') {
        const isMeta = s.studyDesign?.includes('Meta') || s.studyDesign?.includes('Systematic');
        if (!isMeta) return false;
      } else if (studyDesignFilter === 'rct') {
        const isRct = s.studyDesign?.includes('RCT') || s.studyDesign?.includes('Trial');
        if (!isRct) return false;
      } else if (studyDesignFilter === 'theses') {
        const isTh = s.documentType === 'Thesis' || s.documentType === 'Dissertation' || s.studyDesign?.includes('Dissertation');
        if (!isTh) return false;
      }
    }

    return true;
  });

  const thesesCount = scholarlyResults.filter(s => 
    s.documentType === 'Thesis' || s.documentType === 'Dissertation' || s.title.toLowerCase().includes('thesis') || s.title.toLowerCase().includes('dissertation')
  ).length;

  const copyCitation = (paper: { title: string; authors: string[]; year: number; doi?: string; venue?: string }, id: string) => {
    const { apa } = ExternalSearchService.generateCitation(paper);
    navigator.clipboard.writeText(apa);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickSearchSuggestions = [
    'Does intermittent fasting reduce inflammation?',
    'Machine learning for early cancer detection',
    'Medicalization of modern society',
    'Quantum key distribution protocols',
    'Structural concrete durability in coastal environments',
    'VLSI low-power digital signal processing'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs pt-8 sm:pt-12 px-3 sm:px-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#D5DDEB]">
        {/* Search Input Bar with Consensus Badge */}
        <div className="p-4 sm:p-5 border-b border-[#E3EAF3] flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1565E8] to-[#4F46E5] flex items-center justify-center shrink-0 text-white shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any research question or search papers (Consensus AI)..."
              className="w-full text-base sm:text-lg font-bold text-[#0B2A55] placeholder-gray-400 focus:outline-hidden"
            />
            <div className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-[#1565E8] font-bold">
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                Consensus AI Search Enabled
              </span>
              <span>•</span>
              <span className="hidden sm:inline">OpenAlex (250M+), Europe PMC, Crossref & Theses</span>
            </div>
          </div>

          {/* Consensus Mode Toggle Button */}
          <button
            onClick={() => setConsensusMode(!consensusMode)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              consensusMode 
                ? 'bg-gradient-to-r from-[#1565E8] to-[#4F46E5] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title="Toggle Consensus AI Evidence Synthesis & Meter"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Consensus {consensusMode ? 'ON' : 'OFF'}</span>
          </button>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Global Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E3EAF3] overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => { setActiveTab('all'); setScholarlyFilter('all'); setStudyDesignFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'all' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            All Academic Literature
          </button>

          {/* Prominent Consensus Tab */}
          <button
            onClick={() => { setActiveTab('consensus'); setScholarlyFilter('all'); setStudyDesignFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'consensus' 
                ? 'bg-gradient-to-r from-[#1565E8] to-[#4F46E5] text-white shadow-xs' 
                : 'bg-indigo-50 text-[#4338CA] hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Consensus AI Meter ({scholarlyResults.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('scholarly'); setScholarlyFilter('all'); setStudyDesignFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'scholarly' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" />
            Global Research Papers ({scholarlyResults.length})
          </button>

          <button
            onClick={() => { setActiveTab('theses'); setScholarlyFilter('thesis'); setStudyDesignFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'theses' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            Thesis & Dissertations ({thesesCount})
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'papers' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            CollabX Repository ({localPapers.length})
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'projects' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            Projects ({localProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('people')}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'people' 
                ? 'bg-[#0B6BE6] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            Scholars ({localPeople.length})
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* If no query, show topic prompt suggestions */}
          {!query.trim() && (
            <div className="py-6 space-y-4">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1565E8] to-[#4F46E5] text-white flex items-center justify-center mx-auto shadow-md">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#0B2A55]">
                  Search with Consensus AI Scientific Synthesis
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ask any research question (e.g. "Does exercise improve cognitive function?") or search any clinical / technical topic. CollabX synthesizes peer-reviewed consensus and extracts direct takeaways from global literature.
                </p>
              </div>

              <div className="pt-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Try asking a research question or topic:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickSearchSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#D5DDEB] hover:border-[#1565E8] hover:bg-[#F0F6FF] text-xs font-semibold text-[#0B2A55] transition-all cursor-pointer shadow-2xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loadingScholarly && query.trim() && (
            <div className="p-4 rounded-2xl bg-[#EBF3FE] border border-[#BFDBFE] flex items-center justify-between text-xs text-[#0B6BE6]">
              <div className="flex items-center gap-2 font-bold">
                <div className="w-4 h-4 border-2 border-[#0B6BE6] border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing scientific consensus across 250M+ works for "{query}"...</span>
              </div>
              <span className="text-[11px] text-gray-500 hidden sm:inline">Consensus AI • OpenAlex & Europe PMC</span>
            </div>
          )}

          {/* CONSENSUS METER & EVIDENCE SYNTHESIS CARD */}
          {consensusAnalysis && consensusMode && (activeTab === 'all' || activeTab === 'consensus' || activeTab === 'scholarly') && (
            <ConsensusMeterCard 
              analysis={consensusAnalysis}
              selectedStudyType={studyDesignFilter}
              onFilterStudyType={setStudyDesignFilter}
            />
          )}

          {/* SECTION: Global Research Papers & Theses */}
          {(activeTab === 'all' || activeTab === 'consensus' || activeTab === 'scholarly' || activeTab === 'theses') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFC83D]" />
                  Global Academic Works & Consensus Evidence ({filteredScholarly.length})
                </h3>
                {query.trim() && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setScholarlyFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        scholarlyFilter === 'all' ? 'bg-[#0B2A55] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setScholarlyFilter('thesis')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        scholarlyFilter === 'thesis' ? 'bg-[#0B2A55] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Theses & Dissertations
                    </button>
                    <button
                      onClick={() => setScholarlyFilter('paper')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        scholarlyFilter === 'paper' ? 'bg-[#0B2A55] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Journal Papers
                    </button>
                  </div>
                )}
              </div>

              {filteredScholarly.length > 0 ? (
                <div className="space-y-3.5">
                  {filteredScholarly.map((s) => (
                    <div 
                      key={s.id} 
                      className="p-4 sm:p-5 rounded-2xl border border-[#E3EAF3] bg-white hover:border-[#1565E8] transition-all space-y-3 shadow-2xs group hover:shadow-md"
                    >
                      <div className="space-y-2">
                        {/* Consensus Rigor, Design & Stance Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                            {s.source}
                          </span>
                          <span className="text-xs text-gray-400 font-semibold">{s.year}</span>
                          
                          {s.citedByCount ? (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
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

                        {/* Paper Title */}
                        <h4 className="font-extrabold text-sm sm:text-base text-[#0B2A55] group-hover:text-[#1565E8] transition-colors leading-snug">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                            <span>{s.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 inline" />
                          </a>
                        </h4>

                        {/* Venue / University */}
                        {s.venue && (
                          <p className="text-xs font-semibold text-[#1565E8]">
                            {s.venue}
                          </p>
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
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {s.abstract}
                        </p>

                        {/* Authors */}
                        <p className="text-[11px] text-gray-400">
                          Authors: <span className="text-gray-600 font-medium">{s.authors.join(', ')}</span>
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-gray-100 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyCitation(s, s.id)}
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
                            onClick={() => { onNavigate(`/ai-writer`); onClose(); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[#1565E8] hover:bg-blue-50 font-bold transition-colors cursor-pointer"
                          >
                            <span>Use in AI Writer</span>
                          </button>
                        </div>

                        {s.oaPdfUrl && (
                          <a
                            href={s.oaPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Open Access PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingScholarly && query.trim() ? (
                <div className="text-center py-6 text-xs text-gray-500 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#D5DDEB]">
                  No scholarly publications found for this specific query. Try adjusting keywords.
                </div>
              ) : null}
            </div>
          )}

          {/* SECTION: CollabX Repository Papers */}
          {(activeTab === 'all' || activeTab === 'papers') && localPapers.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
                  Institutional Repository Papers ({localPapers.length})
                </h3>
              </div>
              <div className="space-y-2">
                {localPapers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { onNavigate(`/papers/${p.id}`); onClose(); }}
                    className="p-3.5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-start justify-between group"
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
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B6BE6] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && localProjects.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#0B6BE6]" />
                  University Projects ({localProjects.length})
                </h3>
              </div>
              <div className="space-y-2">
                {localProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { onNavigate(`/projects/${p.id}`); onClose(); }}
                    className="p-3.5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#0B6BE6]">{p.areaName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{p.supervisorName}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors mt-0.5">
                        {p.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{p.summary}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B6BE6] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Researchers & Scholars */}
          {(activeTab === 'all' || activeTab === 'people') && localPeople.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0B6BE6]" />
                  Researchers & Supervisors ({localPeople.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {localPeople.map(u => (
                  <div
                    key={u.id}
                    onClick={() => { onNavigate(`/u/${u.id}`); onClose(); }}
                    className="p-3.5 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-blue-100" />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{u.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{u.headline}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Consensus attribution & Full Search Page Link */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E3EAF3] flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              Powered by <span className="font-bold text-[#0B2A55]">CollabX Global Index</span> + <span className="font-bold text-[#1565E8]">Consensus AI</span> + OpenAlex & Europe PMC
            </span>
          </div>
          <button
            onClick={() => { 
              onNavigate(`/search?q=${encodeURIComponent(query)}`); 
              onClose(); 
            }}
            className="font-bold text-[#1565E8] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Open in Full Dedicated Search Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
