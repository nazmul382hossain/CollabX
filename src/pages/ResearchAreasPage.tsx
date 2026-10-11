import React, { useState } from 'react';
import { 
  Layers, 
  Brain, 
  BarChart2, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Cloud, 
  Dna, 
  ArrowRight, 
  Search,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { RESEARCH_AREAS } from '../data/seedData';
import { storage } from '../services/storage';

interface ResearchAreasPageProps {
  onNavigate: (path: string) => void;
}

export const ResearchAreasPage: React.FC<ResearchAreasPageProps> = ({ onNavigate }) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const projects = storage.getProjects();

  // Compute live project counts per area
  const areasWithLiveCounts = RESEARCH_AREAS.map(area => {
    const count = projects.filter(p => p.areaId === area.id || p.areaName.toLowerCase() === area.name.toLowerCase()).length;
    return {
      ...area,
      projectCount: count > 0 ? count : area.projectCount
    };
  });

  const filteredAreas = areasWithLiveCounts.filter(a =>
    a.name.toLowerCase().includes(filterText.toLowerCase()) ||
    a.subfields.some(s => s.toLowerCase().includes(filterText.toLowerCase()))
  );

  const getAreaIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'artificial intelligence': return Brain;
      case 'data science': return BarChart2;
      case 'cyber security': return ShieldCheck;
      case 'web technologies': return Globe;
      case 'internet of things': return Cpu;
      case 'cloud computing': return Cloud;
      case 'bioinformatics': return Dna;
      default: return Layers;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header matching Screenshot Page 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2A55] tracking-tight">Explore Research Areas</h1>
          <p className="text-sm text-gray-500 mt-1">Find domains that match your academic interests and career goals</p>
        </div>

        {/* Filter input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter areas or subfields…"
            className="w-full bg-white border border-[#E3EAF3] rounded-full py-2 pl-4 pr-10 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* 4x2 Pastel Grid Matching Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAreas.map((area) => {
          const Icon = getAreaIcon(area.name);
          const isSelected = selectedAreaId === area.id;

          return (
            <div
              key={area.id}
              onClick={() => onNavigate(`/projects?area=${area.slug}`)}
              style={{ backgroundColor: area.bgPastel }}
              className="p-6 rounded-2xl border border-black/5 card-shadow card-shadow-hover cursor-pointer flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Icon top */}
                <div 
                  className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ color: area.color }}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors">
                  {area.name}
                </h3>

                {/* Project count below title */}
                <span className="inline-block mt-1 text-xs font-semibold text-gray-500">
                  {area.projectCount} Projects
                </span>

                <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                  {area.description}
                </p>

                {/* Subfields Preview */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {area.subfields.slice(0, 3).map(sub => (
                    <span 
                      key={sub} 
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/70 text-gray-700 border border-black/5"
                    >
                      {sub}
                    </span>
                  ))}
                  {area.subfields.length > 3 && (
                    <span className="text-[10px] text-gray-400 self-center">
                      +{area.subfields.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold text-[#0B2A55] group-hover:text-[#0B6BE6]">
                <span>Browse Projects</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subfields Details Drawer / Explorer Modal if area is selected */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E3EAF3] card-shadow space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#0E9F6E] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0B2A55]">Research Taxonomy & Interdisciplinary Crossings</h3>
            <p className="text-xs text-gray-500">Over 50+ specialized subfields mapped to university faculty labs</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {filteredAreas.flatMap(a => a.subfields).map((subfield, i) => (
            <button
              key={i}
              onClick={() => onNavigate(`/projects?skill=${encodeURIComponent(subfield)}`)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F8FC] hover:bg-[#0B6BE6] hover:text-white text-gray-700 border border-[#E3EAF3] transition-colors cursor-pointer"
            >
              {subfield}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
