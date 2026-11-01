import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Bookmark, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp,
  Info
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';
import { RecommendationService } from '../services/recommendationService';
import { PikachuMascot } from '../components/common/PikachuMascot';
import { Badge } from '../components/common/Badge';

interface StudentDashboardProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, onNavigate }) => {
  const allProjects = storage.getProjects();
  const allPapers = storage.getPapers();
  const userApplications = storage.getUserApplications(currentUser.id);
  const savedProjectIds = storage.getSavedProjectIds(currentUser.id);
  const userEvents = storage.getEvents(currentUser.id);

  // 5 Stat metrics
  const appCount = userApplications.length;
  const approvedCount = userApplications.filter(a => a.status === 'approved').length;
  const pendingCount = userApplications.filter(a => a.status === 'pending').length;
  const rejectedCount = userApplications.filter(a => a.status === 'rejected').length;
  const savedCount = savedProjectIds.length;

  // Recommendations
  const projectRecs = RecommendationService.getRecommendedProjects(
    currentUser, 
    allProjects, 
    savedProjectIds
  ).slice(0, 4);

  const paperRecs = RecommendationService.getRecommendedPapers(
    currentUser, 
    allPapers
  ).slice(0, 2);

  const firstName = currentUser.name.split(' ')[0] || 'Student';

  return (
    <div className="space-y-8 animate-fade-in p-2 sm:p-4">
      {/* Welcome Banner matching Screenshot 7 */}
      <div className="relative bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-xs">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5EA] text-[#0E9F6E] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Sessional 2026 Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B2A55] tracking-tight">
            Welcome back, {firstName}!
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Discover cutting-edge research opportunities, track your project milestone applications, and collaborate with university faculty supervisors.
          </p>
        </div>

        {/* Waving Pikachu Mascot sitting in the header banner */}
        <div className="hidden md:flex items-center justify-center shrink-0 pr-4">
          <PikachuMascot size="lg" speechBubbleText="Let's do research!" />
        </div>
      </div>

      {/* 5 Pastel Stat Cards matching Screenshot 7 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Applications (lavender) */}
        <div
          onClick={() => onNavigate('/applications')}
          className="p-5 rounded-2xl bg-[#E9E9FB] border border-[#DDD6FE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C54E5]">Applications</span>
            <FileText className="w-4 h-4 text-[#5C54E5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{appCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Total submitted</span>
        </div>

        {/* Card 2: Approved (mint) */}
        <div
          onClick={() => onNavigate('/applications?status=approved')}
          className="p-5 rounded-2xl bg-[#DDF5EA] border border-[#A7F3D0]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0E9F6E]">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-[#0E9F6E]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0E9F6E]">{approvedCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Active positions</span>
        </div>

        {/* Card 3: Pending (green pastel - fixed typo from screenshot) */}
        <div
          onClick={() => onNavigate('/applications?status=pending')}
          className="p-5 rounded-2xl bg-[#D9F7E3] border border-[#86EFAC]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#059669]">Pending</span>
            <Clock className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55]">{pendingCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Under faculty review</span>
        </div>

        {/* Card 4: Rejected (pink) */}
        <div
          onClick={() => onNavigate('/applications?status=rejected')}
          className="p-5 rounded-2xl bg-[#FDE3E3] border border-[#FECACA]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E53935]">Rejected</span>
            <XCircle className="w-4 h-4 text-[#E53935]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E53935]">{rejectedCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Archived calls</span>
        </div>

        {/* Card 5: Saved (sky) */}
        <div
          onClick={() => onNavigate('/saved')}
          className="p-5 rounded-2xl bg-[#DEEBFB] border border-[#BFDBFE]/60 card-shadow card-shadow-hover cursor-pointer space-y-2 flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B6BE6]">Saved</span>
            <Bookmark className="w-4 h-4 text-[#0B6BE6]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B6BE6]">{savedCount}</div>
          <span className="text-[11px] font-semibold text-gray-500">Bookmarked projects</span>
        </div>
      </div>

      {/* Recommended Projects List matching Screenshot 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recommended Projects */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFC83D]" />
              <h3 className="font-extrabold text-base text-[#0B2A55]">Recommended Projects</h3>
            </div>
            <button
              onClick={() => onNavigate('/projects')}
              className="text-xs font-bold text-[#0B6BE6] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>See all recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projectRecs.map(({ project, matchScore, why }) => (
              <div
                key={project.id}
                className="p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F5F8FC] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-16 h-12 rounded-xl object-cover shrink-0 shadow-2xs"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => onNavigate(`/projects/${project.id}`)}
                        className="font-bold text-xs sm:text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] cursor-pointer truncate transition-colors"
                      >
                        {project.title}
                      </h4>
                      {/* Match percentage badge in green */}
                      <span className="text-xs font-extrabold text-[#0E9F6E] shrink-0">
                        ({matchScore}% match)
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {project.summary}
                    </p>

                    {/* Tooltip hint on why recommended */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Info className="w-3 h-3 text-[#0B6BE6]" />
                      <span className="truncate">{why}</span>
                    </div>
                  </div>
                </div>

                {/* Soft-blue View Button matching screenshot 7 */}
                <button
                  onClick={() => onNavigate(`/projects/${project.id}`)}
                  className="px-4 py-2 bg-[#DCE6FB] hover:bg-[#c8d9f9] text-[#0B6BE6] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Upcoming Deadlines & Calendar Quick Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#0B2A55] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0B6BE6]" />
                Upcoming Deadlines
              </h3>
              <button
                onClick={() => onNavigate('/calendar')}
                className="text-[11px] font-bold text-[#0B6BE6] hover:underline"
              >
                Calendar →
              </button>
            </div>

            <div className="space-y-3">
              {userEvents.slice(0, 3).map(evt => (
                <div key={evt.id} className="p-3 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#0B2A55] truncate">{evt.title}</span>
                    <span className="text-[#E53935] font-semibold">{evt.eventDate}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Paper Writer Promo */}
          <div className="bg-gradient-to-br from-[#0B2A55] to-[#0A1F44] text-white p-6 rounded-3xl space-y-3 shadow-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-[#FFC83D]" />
              AI Thesis Assistant
            </div>
            <h4 className="font-extrabold text-base leading-snug">
              Draft your Research Paper with AI Writer
            </h4>
            <p className="text-xs text-gray-300">
              Generate structured outlines, IMRaD sections, and verify real DOIs via Crossref and OpenAlex.
            </p>
            <button
              onClick={() => onNavigate('/ai-writer')}
              className="w-full py-2 bg-[#FFC83D] hover:bg-[#f5bc28] text-[#0B2A55] font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Launch AI Writer
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Papers Block Below */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0E9F6E]" />
            <h3 className="font-extrabold text-base text-[#0B2A55]">Recommended Research Papers for You</h3>
          </div>
          <button
            onClick={() => onNavigate('/papers')}
            className="text-xs font-bold text-[#0B6BE6] hover:underline"
          >
            Browse Library →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paperRecs.map(({ paper, matchScore, why }) => (
            <div
              key={paper.id}
              onClick={() => onNavigate(`/papers/${paper.id}`)}
              className="p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0E9F6E] hover:bg-[#F5F8FC] cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DDF5EA] text-[#0E9F6E]">
                  {paper.areaName}
                </span>
                <span className="text-[11px] font-bold text-[#0E9F6E]">{matchScore}% relevance</span>
              </div>
              <h4 className="font-bold text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] line-clamp-1">
                {paper.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">{paper.abstract}</p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                <span>{paper.authors[0]} et al. ({paper.year})</span>
                <span className="text-[#0B6BE6] font-semibold">Read PDF →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
