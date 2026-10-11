import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  Layers, 
  Calendar, 
  Users, 
  Building2,
  BookOpen
} from 'lucide-react';
import { storage } from '../services/storage';
import { MOCK_RESEARCH_AREAS } from '../data/mock';
import { ASSETS } from '../data/assets';
import { StatusBadge } from '../components/common/StatusBadge';
import { Chip } from '../components/common/Chip';
import { Button } from '../components/common/Button';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenSearch }) => {
  const [heroSearch, setHeroSearch] = useState('');

  // Animated counters for stats strip
  const [counts, setCounts] = useState({
    projects: 0,
    areas: 0,
    users: 0,
    departments: 0
  });

  useEffect(() => {
    const duration = 1200; // ms
    const startTime = performance.now();
    const targets = { projects: 500, areas: 50, users: 1000, departments: 10 };

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCounts({
        projects: Math.floor(targets.projects * ease),
        areas: Math.floor(targets.areas * ease),
        users: Math.floor(targets.users * ease),
        departments: Math.floor(targets.departments * ease)
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      onNavigate(`/projects?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      onOpenSearch();
    }
  };

  const projects = storage.getProjects();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Hero Section matching reference screenshot 1:1 */}
      <section className="relative w-full overflow-hidden min-h-[580px] lg:min-h-[640px] flex items-center bg-[#0B2545]">
        {/* Full-width illustrated anime landscape background with mountains, futuristic glass domes, skybridges, Ash and Pikachu */}
        <div 
          className="absolute inset-0 bg-cover bg-center lg:bg-[center_right] transition-all duration-700 select-none"
          style={{
            backgroundImage: `url('${ASSETS.hero}')`,
          }}
        />

        {/* Subtle left gradient overlay so the card blends naturally with the landscape */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/40 via-transparent to-transparent pointer-events-none" />

        {/* Left Dark Translucent Glass Card */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full z-10">
          <div className="w-full max-w-[540px] lg:w-[45%] bg-[#0B2545]/85 backdrop-blur-md p-7 sm:p-9 lg:p-10 rounded-2xl border border-white/10 shadow-2xl text-white space-y-5">
            
            {/* H1 in 3 lines: "Research Ideas" (white), "Connect People" (gold #FFC83D), "Build the Future" (white) */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.15]">
              <span className="text-white block">Research Ideas</span>
              <span className="text-[#FFC83D] block">Connect People</span>
              <span className="text-white block">Build the Future</span>
            </h1>

            {/* Paragraph description */}
            <p className="text-sm sm:text-[15px] text-gray-200 leading-relaxed font-normal max-w-md">
              A platform for students and researchers to discover opportunities, collaborate and turn ideas into impact.
            </p>

            {/* White rounded search input with magnifier icon, placeholder "Search projects, areas or skills..." */}
            <form onSubmit={handleSearchSubmit} className="pt-1">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search projects, areas or skills..."
                  className="w-full bg-white text-[#0B1F4B] placeholder-gray-400 pl-11 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#1565E8]"
                />
              </div>
            </form>

            {/* Yellow button "Explore Projects" (dark text, rounded rectangle) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/projects')}
                className="px-6 py-3 bg-[#FFC83D] hover:bg-[#f2bc30] text-[#0B1F4B] font-bold text-sm sm:text-[15px] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Explore Projects
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom stats strip: clean white bar with 4 columns separated by thin vertical dividers */}
      {/* "500+ Projects", "50+ Research Areas", "1000+ Active Users", "10+ Departments" */}
      <section className="relative w-full bg-white border-b border-[#D5DDEB] py-6 px-4 sm:px-8 z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          
          {/* Column 1: 500+ Projects */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <span className="text-3xl sm:text-[38px] font-black text-[#0B1F4B] tracking-tight leading-none">
              {counts.projects}+
            </span>
            <span className="text-sm sm:text-[15px] font-medium text-gray-700 mt-2">
              Projects
            </span>
          </div>

          {/* Column 2: 50+ Research Areas */}
          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2">
            <span className="text-3xl sm:text-[38px] font-black text-[#0B1F4B] tracking-tight leading-none">
              {counts.areas}+
            </span>
            <span className="text-sm sm:text-[15px] font-medium text-gray-700 mt-2">
              Research Areas
            </span>
          </div>

          {/* Column 3: 1000+ Active Users */}
          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2">
            <span className="text-3xl sm:text-[38px] font-black text-[#0B1F4B] tracking-tight leading-none">
              {counts.users}+
            </span>
            <span className="text-sm sm:text-[15px] font-medium text-gray-700 mt-2">
              Active Users
            </span>
          </div>

          {/* Column 4: 10+ Departments */}
          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2">
            <span className="text-3xl sm:text-[38px] font-black text-[#0B1F4B] tracking-tight leading-none">
              {counts.departments}+
            </span>
            <span className="text-sm sm:text-[15px] font-medium text-gray-700 mt-2">
              Departments
            </span>
          </div>
        </div>
      </section>

      {/* Featured Research Areas Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full bg-[#F4F8FD]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B]">Explore Research Areas</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Discover dynamic fields of inquiry and thesis opportunities</p>
          </div>
          <button
            onClick={() => onNavigate('/research-areas')}
            className="text-xs sm:text-sm font-bold text-[#1565E8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Areas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {MOCK_RESEARCH_AREAS.map((area) => (
            <div
              key={area.id}
              onClick={() => onNavigate(`/projects?area=${area.slug}`)}
              style={{ backgroundColor: area.bgPastel }}
              className="p-6 rounded-2xl border border-[#D5DDEB] hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-xs bg-white"
                  style={{ color: area.color }}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0B1F4B] group-hover:text-[#1565E8] transition-colors">
                  {area.name}
                </h3>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                  {area.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1F4B]">
                  {area.projectCount} Projects
                </span>
                <span className="text-xs font-bold text-[#1565E8] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Grid */}
      <section className="bg-white border-t border-[#D5DDEB] py-16 sm:py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B]">Trending Research Projects</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Open positions for student researchers and collaborative fellows</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/projects')}
            >
              All Projects ({projects.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((proj) => (
              <div
                key={proj.id}
                onClick={() => onNavigate(`/projects/${proj.id}`)}
                className="bg-white rounded-2xl border border-[#D5DDEB] hover:border-[#1565E8] hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col group"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img
                    src={proj.thumbnail}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <StatusBadge status={proj.status} />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-[#0B1F4B]">
                    {proj.filledPositions}/{proj.totalPositions} Seats
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-[#1565E8] uppercase tracking-wider">
                        {proj.areaName}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0B1F4B] group-hover:text-[#1565E8] transition-colors line-clamp-1 mb-2">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-4">
                      {proj.summary}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.tags.slice(0, 3).map((tag, i) => (
                        <Chip key={i} label={tag} variant="blue" />
                      ))}
                    </div>
                  </div>

                  {/* Supervisor Footer */}
                  <div className="pt-3 border-t border-[#D5DDEB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={proj.supervisorAvatar}
                        alt={proj.supervisorName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">
                        {proj.supervisorName}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#1565E8] group-hover:translate-x-0.5 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Call to Action Strip */}
      <section className="bg-gradient-to-r from-[#0B2A4A] to-[#0E4A5C] text-white py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to begin your research journey?</h2>
          <p className="text-xs sm:text-sm text-gray-200 max-w-xl mx-auto">
            Join Port City International University's thriving research community. Explore open projects or start collaborating with faculty advisors today.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="yellow"
              size="md"
              onClick={() => onNavigate('/register')}
            >
              Create Account
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => onNavigate('/projects')}
              className="text-white hover:bg-white/10"
            >
              Browse Projects
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
