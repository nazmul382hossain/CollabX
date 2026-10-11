import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ExternalLink, 
  BookOpen, 
  FolderKanban, 
  Users, 
  Layers, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles,
  Bookmark
} from 'lucide-react';
import { storage } from '../../services/storage';
import { ExternalSearchService } from '../../services/externalSearchService';
import { Project, Paper, User, ResearchArea, ExternalScholarlyResult, PublicProfile } from '../../types';
import { RESEARCH_AREAS } from '../../data/seedData';
import { publicProfileService } from '../../services/publicProfileService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'papers' | 'scholarly' | 'people' | 'areas'>('all');
  const [scholarlyResults, setScholarlyResults] = useState<ExternalScholarlyResult[]>([]);
  const [loadingScholarly, setLoadingScholarly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled outside
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search for scholarly articles
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
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const qLower = query.toLowerCase().trim();

  // Filter local items
  const localProjects: Project[] = qLower ? storage.getProjects().filter(p => 
    p.title.toLowerCase().includes(qLower) || 
    p.summary.toLowerCase().includes(qLower) ||
    p.areaName.toLowerCase().includes(qLower) ||
    p.requiredSkills.some(s => s.toLowerCase().includes(qLower)) ||
    p.tags.some(t => t.toLowerCase().includes(qLower))
  ) : storage.getProjects().slice(0, 4);

  const localPapers: Paper[] = qLower ? storage.getPapers().filter(p =>
    p.title.toLowerCase().includes(qLower) ||
    p.abstract.toLowerCase().includes(qLower) ||
    p.keywords.some(k => k.toLowerCase().includes(qLower)) ||
    p.authors.some(a => a.toLowerCase().includes(qLower))
  ) : storage.getPapers().slice(0, 3);

  // Read strictly from publicProfiles collection (never from users)
  const localPeople: PublicProfile[] = qLower ? publicProfileService.getPublicProfiles().filter(u =>
    u.name.toLowerCase().includes(qLower) ||
    u.headline.toLowerCase().includes(qLower) ||
    u.skills.some(s => s.toLowerCase().includes(qLower))
  ) : publicProfileService.getPublicProfiles().slice(0, 4);

  const localAreas: ResearchArea[] = qLower ? RESEARCH_AREAS.filter(a =>
    a.name.toLowerCase().includes(qLower) ||
    a.subfields.some(s => s.toLowerCase().includes(qLower))
  ) : RESEARCH_AREAS;

  const copyCitation = (paper: { title: string; authors: string[]; year: number; doi?: string }, id: string) => {
    const { apa } = ExternalSearchService.generateCitation(paper);
    navigator.clipboard.writeText(apa);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs pt-12 sm:pt-20 px-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#E3EAF3]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E3EAF3] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#0B6BE6]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, papers, areas, researchers, or global academic literature..."
            className="w-full text-base font-medium text-[#0B2A55] placeholder-gray-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#F5F8FC] border-b border-[#E3EAF3] overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'all' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'projects' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            Projects ({localProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'papers' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            CollabX Papers ({localPapers.length})
          </button>
          <button
            onClick={() => setActiveTab('scholarly')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
              activeTab === 'scholarly' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" />
            Global Scholarly ({scholarlyResults.length})
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'people' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            Researchers ({localPeople.length})
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'areas' ? 'bg-[#0B6BE6] text-white' : 'text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            Areas ({localAreas.length})
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Projects Section */}
          {(activeTab === 'all' || activeTab === 'projects') && localProjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5"><FolderKanban className="w-3.5 h-3.5" /> Research Projects</span>
                <span className="text-[11px] text-gray-400">{localProjects.length} found</span>
              </div>
              <div className="space-y-2">
                {localProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { onNavigate(`/projects/${p.id}`); onClose(); }}
                    className="p-3 rounded-xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.title} className="w-12 h-10 object-cover rounded-lg shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors">{p.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{p.areaName}</span>
                          <span>•</span>
                          <span>{p.supervisorName}</span>
                          <span>•</span>
                          <span className="text-[#0E9F6E] font-semibold">{p.filledPositions}/{p.totalPositions} filled</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B6BE6] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CollabX Papers Section */}
          {(activeTab === 'all' || activeTab === 'papers') && localPapers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> CollabX Research Papers</span>
                <span className="text-[11px] text-gray-400">{localPapers.length} found</span>
              </div>
              <div className="space-y-2">
                {localPapers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { onNavigate(`/papers/${p.id}`); onClose(); }}
                    className="p-3 rounded-xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-start justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors">{p.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.abstract}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                        <span>{p.authors.join(', ')}</span>
                        <span>({p.year})</span>
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

          {/* External Scholarly Search Section */}
          {(activeTab === 'all' || activeTab === 'scholarly') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5 text-[#0B6BE6]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC83D]" /> Global Academic Works (OpenAlex / Crossref / arXiv)
                </span>
                {loadingScholarly && <span className="text-xs text-[#0B6BE6] animate-pulse">Searching global repositories...</span>}
              </div>

              {scholarlyResults.length > 0 ? (
                <div className="space-y-3">
                  {scholarlyResults.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-[#E3EAF3] bg-white hover:border-[#0B6BE6] transition-all space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCE6FB] text-[#0B6BE6]">{s.source}</span>
                            <span className="text-xs text-gray-400">{s.year}</span>
                            {s.citedByCount ? (
                              <span className="text-[11px] font-semibold text-[#0E9F6E]">★ {s.citedByCount.toLocaleString()} citations</span>
                            ) : null}
                          </div>
                          <h4 className="font-bold text-sm text-[#0B2A55] mt-1 hover:text-[#0B6BE6]">
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              {s.title}
                              <ExternalLink className="w-3 h-3 text-gray-400 inline" />
                            </a>
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{s.abstract}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{s.authors.join(', ')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <button
                          onClick={() => copyCitation(s, s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F5F8FC] hover:bg-gray-200 text-[#0B2A55] font-semibold cursor-pointer transition-colors"
                        >
                          {copiedId === s.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#0E9F6E]" />
                              <span>Copied APA!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span>Copy Citation (APA)</span>
                            </>
                          )}
                        </button>

                        {s.oaPdfUrl && (
                          <a
                            href={s.oaPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0E9F6E] font-semibold hover:underline"
                          >
                            Open Access PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingScholarly && query.trim() ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  Type a topic (e.g. "transformer", "IoT", "blockchain") to query millions of global papers.
                </div>
              ) : null}
            </div>
          )}

          {/* People Section */}
          {(activeTab === 'all' || activeTab === 'people') && localPeople.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Researchers & Supervisors</span>
                <span className="text-[11px] text-gray-400">{localPeople.length} found</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {localPeople.map(u => (
                  <div
                    key={u.id}
                    onClick={() => { onNavigate(`/u/${u.id}`); onClose(); }}
                    className="p-3 rounded-xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{u.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{u.headline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Areas */}
          {(activeTab === 'all' || activeTab === 'areas') && localAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Research Areas</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {localAreas.map(a => (
                  <div
                    key={a.id}
                    onClick={() => { onNavigate(`/projects?area=${a.slug}`); onClose(); }}
                    style={{ backgroundColor: a.bgPastel }}
                    className="p-3 rounded-xl border border-black/5 hover:scale-102 transition-transform cursor-pointer text-center"
                  >
                    <h5 className="font-bold text-xs text-[#0B2A55]">{a.name}</h5>
                    <span className="text-[10px] text-gray-600">{a.projectCount} projects</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F5F8FC] border-t border-[#E3EAF3] flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-[#0B2A55]">CollabX Global Index</span>
            <span>+ OpenAlex & Crossref</span>
          </div>
          <button
            onClick={() => { onNavigate(`/search?q=${encodeURIComponent(query)}`); onClose(); }}
            className="font-bold text-[#0B6BE6] hover:underline cursor-pointer"
          >
            View full search results page →
          </button>
        </div>
      </div>
    </div>
  );
};
