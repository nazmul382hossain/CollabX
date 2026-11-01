import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  BarChart3, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Scale
} from 'lucide-react';
import { ConsensusAnalysis } from '../../types';

interface ConsensusMeterCardProps {
  analysis: ConsensusAnalysis;
  onFilterStudyType?: (type: string) => void;
  selectedStudyType?: string;
}

export const ConsensusMeterCard: React.FC<ConsensusMeterCardProps> = ({
  analysis,
  onFilterStudyType,
  selectedStudyType = 'all'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const { yesPercent, possiblyPercent, noPercent } = analysis.agreement;

  return (
    <div className="bg-gradient-to-br from-[#F5F9FF] via-white to-[#F0F5FD] rounded-3xl border-2 border-[#BFDBFE] p-5 sm:p-6 shadow-md space-y-5 animate-fade-in transition-all">
      {/* Header with Consensus Badge & Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DBEAFE]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1565E8] to-[#4F46E5] flex items-center justify-center text-white shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-[#1565E8] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                Consensus AI Meter
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0E7FF] text-[#4338CA]">
                {analysis.confidence}
              </span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#0B2A55] mt-0.5">
              Scientific Consensus for "{analysis.query}"
            </h3>
          </div>
        </div>

        {/* Verdict Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#DDF5EA] text-[#0E9F6E] border border-[#A7F3D0] shadow-2xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E9F6E]" />
            {analysis.verdict}
          </span>
        </div>
      </div>

      {/* The Visual Consensus Meter Bar */}
      <div className="space-y-2 bg-white/80 p-4 rounded-2xl border border-[#DBEAFE]/80 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-gray-600 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#1565E8]" />
            Consensus Meter ({analysis.analyzedCount}+ Peer-Reviewed Sources Analyzed)
          </span>
          <span className="text-[#1565E8] font-black">{yesPercent}% Agreement</span>
        </div>

        {/* 3-colored Segmented Bar */}
        <div className="w-full h-4 rounded-full bg-gray-100 flex overflow-hidden p-0.5 border border-gray-200">
          <div 
            style={{ width: `${yesPercent}%` }} 
            className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-l-full transition-all duration-700 relative group cursor-pointer"
            title={`Yes / Supports: ${yesPercent}%`}
          />
          <div 
            style={{ width: `${possiblyPercent}%` }} 
            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-700 relative group cursor-pointer"
            title={`Possibly / Context Dependent: ${possiblyPercent}%`}
          />
          <div 
            style={{ width: `${noPercent}%` }} 
            className="h-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] rounded-r-full transition-all duration-700 relative group cursor-pointer"
            title={`No / Disputes: ${noPercent}%`}
          />
        </div>

        {/* Meter Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-bold pt-1 gap-2">
          <div className="flex items-center gap-1.5 text-[#059669]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Yes / Supports ({yesPercent}%)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#D97706]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Possibly / Mixed ({possiblyPercent}%)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#DC2626]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>No / Disputes ({noPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Consensus Evidence Summary */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1565E8]" />
          Consensus Synthesis (AI Evidence Summary)
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal bg-white/60 p-3.5 rounded-2xl border border-[#E2E8F0]">
          {analysis.summary}
        </p>
      </div>

      {/* Expandable Key Findings and Study Types */}
      <div className="pt-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-bold text-[#1565E8] hover:text-[#0B2A55] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>{showDetails ? 'Hide Detailed Breakdown' : 'View Key Findings & Study Types'}</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="mt-3.5 space-y-3.5 pt-3 border-t border-[#DBEAFE] animate-fade-in">
            {/* Key Findings List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Key Findings:</span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {analysis.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Design Breakdown Filter Chips */}
            {onFilterStudyType && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Filter by Study Rigor & Design:
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <button
                    onClick={() => onFilterStudyType('all')}
                    className={`px-3 py-1 rounded-xl cursor-pointer transition-all ${
                      selectedStudyType === 'all'
                        ? 'bg-[#1565E8] text-white shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All Evidence ({analysis.analyzedCount})
                  </button>

                  <button
                    onClick={() => onFilterStudyType('meta')}
                    className={`px-3 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-1 ${
                      selectedStudyType === 'meta'
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-purple-50 text-[#7C3AED] hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <span>Meta-Analyses ({analysis.studyTypesCount.metaAnalyses})</span>
                  </button>

                  <button
                    onClick={() => onFilterStudyType('rct')}
                    className={`px-3 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-1 ${
                      selectedStudyType === 'rct'
                        ? 'bg-[#059669] text-white shadow-xs'
                        : 'bg-emerald-50 text-[#059669] hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span>RCTs & Clinical ({analysis.studyTypesCount.rcts})</span>
                  </button>

                  <button
                    onClick={() => onFilterStudyType('theses')}
                    className={`px-3 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-1 ${
                      selectedStudyType === 'theses'
                        ? 'bg-[#D97706] text-white shadow-xs'
                        : 'bg-amber-50 text-[#D97706] hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>Doctoral Theses ({analysis.studyTypesCount.theses})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
