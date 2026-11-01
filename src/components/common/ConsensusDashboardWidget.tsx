import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight,
  Filter,
  Layers,
  GraduationCap,
  FlaskConical
} from 'lucide-react';
import { ExternalScholarlyResult, ConsensusAnalysis, User } from '../../types';
import { ExternalSearchService } from '../../services/externalSearchService';
import { ConsensusService } from '../../services/consensusService';
import { ConsensusMeterCard } from './ConsensusMeterCard';

interface ConsensusDashboardWidgetProps {
  currentUser: User;
  onNavigate?: (path: string) => void;
  defaultTopic?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Does exercise improve cognitive function?',
  'Deep learning for medical imaging diagnostic accuracy',
  'Blood biomarkers for early disease detection',
  'Renewable energy microgrids and power grid stability',
  'Microplastics impact on marine ecosystems'
];

export const ConsensusDashboardWidget: React.FC<ConsensusDashboardWidgetProps> = ({
  currentUser,
  onNavigate,
  defaultTopic = 'Does exercise improve cognitive function?'
}) => {
  const [query, setQuery] = useState(defaultTopic);
  const [activeQuery, setActiveQuery] = useState(defaultTopic);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ConsensusAnalysis | null>(null);
  const [papers, setPapers] = useState<ExternalScholarlyResult[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runConsensusSearch = async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return;
    const cleanTerm = searchTerm.trim();
    setLoading(true);
    setActiveQuery(cleanTerm);

    try {
      // 1. Fetch real scholarly papers
      const results = await ExternalSearchService.searchScholarly(cleanTerm);
      if (results.length === 0) {
        // Fallback to synthesis
        const consensusResult = ConsensusService.generateConsensusAnalysis(cleanTerm, []);
        setAnalysis(consensusResult);
        setPapers([]);
      } else {
        const consensusResult = ConsensusService.generateConsensusAnalysis(cleanTerm, results);
        setAnalysis(consensusResult);
        setPapers(results);
      }
    } catch (err) {
      console.error('Error running consensus search:', err);
      // Fallback
      const consensusResult = ConsensusService.generateConsensusAnalysis(cleanTerm, []);
      setAnalysis(consensusResult);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    runConsensusSearch(defaultTopic);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      runConsensusSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    runConsensusSearch(suggestion);
  };

  const handleCopyCitation = (paper: ExternalScholarlyResult) => {
    const primaryAuthor = paper.authors[0] || 'Unknown Author';
    const authorsStr = paper.authors.length > 1 ? `${primaryAuthor} et al.` : primaryAuthor;
    const citation = `${authorsStr} (${paper.year}). ${paper.title}. ${paper.venue || paper.source}${paper.doi ? ` https://doi.org/${paper.doi}` : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter papers by study design
  const filteredPapers = papers.filter(p => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'rct') return p.studyDesign?.includes('Randomized');
    if (selectedFilter === 'meta') return p.studyDesign?.includes('Meta') || p.studyDesign?.includes('Systematic');
    if (selectedFilter === 'thesis') return p.documentType === 'Thesis' || p.documentType === 'Dissertation';
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#E3EAF3] p-5 sm:p-7 space-y-6 shadow-xs animate-fade-in">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-[#0B6BE6] border border-[#BFDBFE]">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              Consensus AI Evidence Engine
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              250M+ Global Works Indexed
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2A55] tracking-tight">
            Scientific Consensus & Evidence Meter
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Ask any research question or search topics to analyze empirical agreement across meta-analyses, randomized trials, and doctoral theses.
          </p>
        </div>

        {/* Action badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#F0F5FD] px-3.5 py-2 rounded-2xl border border-[#BFDBFE]">
          {currentUser.role === 'student' ? (
            <GraduationCap className="w-5 h-5 text-[#0B6BE6]" />
          ) : (
            <FlaskConical className="w-5 h-5 text-[#0B6BE6]" />
          )}
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target Audience</div>
            <div className="text-xs font-extrabold text-[#0B2A55] capitalize">
              {currentUser.role === 'student' ? 'Student Scholar' : 'Faculty Researcher'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-400 pointer-events-none">
            <Search className="w-5 h-5 text-[#0B6BE6]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a scientific question or search any thesis, topic or paper (e.g. Does exercise improve memory?)..."
            className="w-full pl-12 pr-32 py-3.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] focus:border-[#0B6BE6] focus:bg-white rounded-2xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#0B6BE6] to-[#2563EB] hover:from-[#0956b8] hover:to-[#1d4ed8] text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" />
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3">
          <span className="text-[11px] font-bold text-gray-400">Try asking:</span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSuggestionClick(sug)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer truncate max-w-[280px] sm:max-w-none ${
                activeQuery.toLowerCase() === sug.toLowerCase()
                  ? 'bg-[#0B6BE6] text-white border-[#0B6BE6] font-bold'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-gray-600 border-gray-200'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="p-8 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B6BE6] mx-auto" />
          <div className="font-bold text-sm text-[#0B2A55]">
            Synthesizing Consensus for "{activeQuery}"...
          </div>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Querying OpenAlex & universal academic repositories, extracting key findings, classifying study designs, and computing agreement ratios.
          </p>
        </div>
      )}

      {/* Analysis Result Card */}
      {!loading && analysis && (
        <div className="space-y-6">
          <ConsensusMeterCard 
            analysis={analysis} 
            selectedStudyType={selectedFilter}
            onFilterStudyType={(type) => setSelectedFilter(type)}
          />

          {/* Top Papers & Key Evidence Takeaways */}
          {papers.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55]">
                    Analyzed Peer-Reviewed Evidence ({filteredPapers.length} Papers)
                  </h3>
                </div>

                {/* Study Filter Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-gray-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All Studies' },
                    { id: 'meta', label: 'Meta-Analyses' },
                    { id: 'rct', label: 'RCTs' },
                    { id: 'thesis', label: 'Theses' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedFilter(tab.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedFilter === tab.id
                          ? 'bg-[#0B2A55] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Papers Grid */}
              <div className="grid grid-cols-1 gap-3.5">
                {filteredPapers.slice(0, 5).map((paper) => {
                  const isCopied = copiedId === paper.id;
                  const isSupport = paper.consensusStance === 'supports';
                  const isDispute = paper.consensusStance === 'disputes';

                  return (
                    <div
                      key={paper.id}
                      className="p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0B6BE6] bg-white hover:bg-[#F9FBFE] transition-all space-y-3 group shadow-2xs"
                    >
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#EEF4FF] text-[#0B6BE6] border border-[#BFDBFE]">
                            {paper.source}
                          </span>

                          {paper.studyDesign && (
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                              paper.studyDesign.includes('Randomized')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : paper.studyDesign.includes('Meta')
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : paper.documentType === 'Thesis'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {paper.studyDesign}
                            </span>
                          )}

                          {paper.sampleSize && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                              {paper.sampleSize}
                            </span>
                          )}

                          <span className="text-[11px] font-semibold text-gray-400">
                            {paper.year}
                          </span>

                          {typeof paper.citedByCount === 'number' && (
                            <span className="text-[11px] font-bold text-amber-600">
                              ★ {paper.citedByCount.toLocaleString()} citations
                            </span>
                          )}
                        </div>

                        {/* Stance Pill */}
                        <div className="shrink-0">
                          {isSupport && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Supports
                            </span>
                          )}
                          {isDispute && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Disputes
                            </span>
                          )}
                          {!isSupport && !isDispute && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              <HelpCircle className="w-3 h-3 text-amber-600" />
                              Context-dependent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm sm:text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors leading-snug">
                        {paper.title}
                      </h4>

                      {/* Authors & Venue */}
                      <div className="text-[11px] text-gray-500 truncate">
                        {paper.authors.length > 0 ? paper.authors.join(', ') : 'Academic Author Group'}
                        {paper.venue ? ` · ${paper.venue}` : ''}
                      </div>

                      {/* Consensus Key Takeaway Callout */}
                      {paper.keyTakeaway && (
                        <div className="p-3 bg-[#EEF5FF] rounded-xl border border-[#C7DCFE] space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0B6BE6]">
                            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                            Consensus Key Takeaway
                          </div>
                          <p className="text-xs text-[#0B2A55] leading-relaxed font-medium">
                            "{paper.keyTakeaway}"
                          </p>
                        </div>
                      )}

                      {/* Abstract Snippet */}
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {paper.abstract}
                      </p>

                      {/* Action Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <button
                          onClick={() => handleCopyCitation(paper)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-[#0B6BE6] cursor-pointer transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-extrabold">Citation Copied (APA)</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Citation (APA)</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          {paper.oaPdfUrl && (
                            <a
                              href={paper.oaPdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-all border border-emerald-200 inline-flex items-center gap-1"
                            >
                              <span>Open PDF</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-[#F0F5FD] hover:bg-[#E2ECFC] text-[#0B6BE6] rounded-lg text-[11px] font-bold transition-all border border-[#BFDBFE] inline-flex items-center gap-1"
                          >
                            <span>View Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
