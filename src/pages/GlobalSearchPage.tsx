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
  Filter
} from 'lucide-react';
import { storage } from '../services/storage';
import { ExternalSearchService } from '../services/externalSearchService';
import { ExternalScholarlyResult, Project, Paper, User, PublicProfile } from '../types';
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

  const projects = storage.getProjects();
  const papers = storage.getPapers();
  // Read strictly from publicProfiles collection (never from users)
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
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const qLower = query.toLowerCase().trim();

  const matchedProjects = qLower ? projects.filter(p => 
    p.title.toLowerCase().includes(qLower) ||
    p.summary.toLowerCase().includes(qLower) ||
    p.areaName.toLowerCase().includes(qLower) ||
    p.requiredSkills.some(s => s.toLowerCase().includes(qLower))
  ) : projects.slice(0, 3);

  const matchedPapers = qLower ? papers.filter(p =>
    p.title.toLowerCase().includes(qLower) ||
    p.abstract.toLowerCase().includes(qLower) ||
    p.authors.some(a => a.toLowerCase().includes(qLower))
  ) : papers.slice(0, 3);

  const matchedPeople = qLower ? publicProfiles.filter(u =>
    u.name.toLowerCase().includes(qLower) ||
    u.headline.toLowerCase().includes(qLower) ||
    u.skills.some(s => s.toLowerCase().includes(qLower))
  ) : publicProfiles.slice(0, 3);

  const copyCitation = (item: any) => {
    const { apa } = ExternalSearchService.generateCitation(item);
    navigator.clipboard.writeText(apa);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Search Input Hero */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">
          Global Academic Search
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Federated search across CollabX projects, institutional papers, and millions of global academic works via OpenAlex & Crossref
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="relative max-w-3xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, topics, authors, or DOIs (e.g. transformers, loRaWAN, blockchain)..."
            className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-2xl py-3.5 pl-12 pr-28 text-sm text-[#0B2A55] font-medium focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-5 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Columns */}
      <div className="space-y-8">
        {/* Local Projects */}
        {matchedProjects.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#0B6BE6]" />
              CollabX Projects ({matchedProjects.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {matchedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onNavigate(`/projects/${p.id}`)}
                  className="bg-white p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] cursor-pointer transition-all space-y-2 group shadow-2xs"
                >
                  <img src={p.thumbnail} alt={p.title} className="w-full h-28 object-cover rounded-xl" />
                  <span className="text-[10px] font-bold text-[#0B6BE6] bg-[#DCE6FB] px-2 py-0.5 rounded block w-fit">{p.areaName}</span>
                  <h4 className="font-bold text-xs text-[#0B2A55] group-hover:text-[#0B6BE6] truncate">{p.title}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{p.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Scholarly Repositories (OpenAlex / Crossref / arXiv) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFC83D]" />
              Global Scholarly Publications (OpenAlex & Crossref)
            </h3>
            {loading && <span className="text-xs text-[#0B6BE6] animate-pulse font-semibold">Querying scholarly APIs...</span>}
          </div>

          <div className="space-y-3">
            {scholarlyResults.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-[#E3EAF3] space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#DCE6FB] text-[#0B6BE6] text-[10px] font-bold rounded">
                        {item.source}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">{item.year}</span>
                      {item.citedByCount ? (
                        <span className="text-xs font-bold text-[#0E9F6E]">★ {item.citedByCount.toLocaleString()} Citations</span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-sm text-[#0B2A55]">
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-[#0B6BE6] flex items-center gap-1.5">
                        {item.title}
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 inline" />
                      </a>
                    </h4>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.abstract}
                    </p>

                    <p className="text-[11px] text-gray-400">
                      Authors: {item.authors.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => copyCitation(item)}
                    className="px-3 py-1.5 bg-[#F5F8FC] hover:bg-gray-200 rounded-xl font-semibold text-[#0B2A55] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#0E9F6E]" />
                        <span>Copied Citation!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy APA Citation</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate(`/ai-writer`)}
                      className="text-[#0B6BE6] font-bold hover:underline"
                    >
                      Use as Reference in AI Writer →
                    </button>
                    {item.oaPdfUrl && (
                      <a
                        href={item.oaPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0E9F6E] font-bold hover:underline"
                      >
                        Open Access PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
