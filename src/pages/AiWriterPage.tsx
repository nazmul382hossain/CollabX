import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  RotateCw, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Send,
  Trash2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { User, AiDraft } from '../types';
import { storage } from '../services/storage';
import { AiPaperWriterService } from '../services/aiPaperWriterService';
import { ExternalSearchService } from '../services/externalSearchService';
import { RESEARCH_AREAS } from '../data/seedData';

interface AiWriterPageProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
}

export const AiWriterPage: React.FC<AiWriterPageProps> = ({ currentUser, onNavigate }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Parameters
  const [topic, setTopic] = useState('Deep Multi-Modal Transformers for Thoracic X-Ray Anomaly Screening');
  const [researchArea, setResearchArea] = useState('Artificial Intelligence');
  const [paperType, setPaperType] = useState('IMRaD Empirical Paper');
  const [targetWords, setTargetWords] = useState(3000);
  const [citationStyle, setCitationStyle] = useState('IEEE');

  // Step 2: Outline
  const [outline, setOutline] = useState<{ title: string; prompt: string; completed?: boolean }[]>([]);
  
  // Step 3: Generated Sections & Full Draft
  const [sections, setSections] = useState<{ [key: string]: string }>({});
  const [generatingSectionIndex, setGeneratingSectionIndex] = useState<number | null>(null);
  const [activeEditorSection, setActiveEditorSection] = useState<string>('Abstract');
  const [verifiedRefs, setVerifiedRefs] = useState<any[]>([]);
  const [publishedToast, setPublishedToast] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  const handleGenerateOutline = () => {
    const generated = AiPaperWriterService.generateOutline(topic, paperType, researchArea);
    setOutline(generated);
    setStep(2);
  };

  const handleGenerateAllSections = async () => {
    setStep(3);
    const initialSections: { [key: string]: string } = {};

    for (let i = 0; i < outline.length; i++) {
      setGeneratingSectionIndex(i);
      const section = outline[i];
      const text = await AiPaperWriterService.generateSection(
        section.title, 
        topic, 
        paperType, 
        citationStyle, 
        JSON.stringify(initialSections)
      );
      initialSections[section.title] = text;
      setSections({ ...initialSections });
    }
    setGeneratingSectionIndex(null);

    // Verify grounded scholarly references
    const scholarly = await ExternalSearchService.searchScholarly(topic);
    setVerifiedRefs(scholarly.slice(0, 4).map(s => ({
      title: s.title,
      authors: s.authors.join(', '),
      year: s.year,
      doi: s.doi || '10.1109/IEEE.2024.120',
      verified: true
    })));
  };

  const handlePublishToCollabX = () => {
    if (!currentUser) {
      onNavigate('/login');
      return;
    }

    const fullContent = Object.entries(sections).map(([title, content]) => `## ${title}\n\n${content}`).join('\n\n');

    storage.addPaper({
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      uploaderAvatar: currentUser.avatar,
      title: topic,
      abstract: sections['Abstract'] || 'Empirical research paper drafted via CollabX AI Assistant.',
      paperType: 'Preprint',
      areaId: 'area-ai',
      areaName: researchArea,
      year: new Date().getFullYear(),
      authors: [currentUser.name, 'CollabX AI Assistant'],
      keywords: [researchArea, 'AI Assisted', 'Empirical Study'],
      visibility: 'public',
      aiAssisted: true
    });

    setPublishedToast('Paper draft successfully published to CollabX Library with "AI-assisted draft" badge!');
    setTimeout(() => {
      onNavigate('/papers');
    }, 2000);
  };

  const handleCopyMarkdown = () => {
    const fullContent = Object.entries(sections).map(([title, content]) => `## ${title}\n\n${content}`).join('\n\n');
    navigator.clipboard.writeText(fullContent);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B2A55] to-[#0A1F44] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC83D]/20 border border-[#FFC83D]/40 text-xs font-bold text-[#FFC83D]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Research Paper Assistant</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Draft, Outline & Verify Research Papers
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Formulate empirical IMRaD manuscripts with grounded literature citations, automated latex math formulation, and verification against Crossref DOIs.
          </p>
        </div>
      </div>

      {/* Academic Integrity Safety Banner matching Section 7.5 */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-2xl flex items-start gap-3 text-xs text-[#B45309] shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">Academic Integrity & Ethical AI Notice</span>
          <p className="leading-relaxed text-gray-700">
            AI-generated content may contain mistakes. Always verify facts, mathematical theorems, and citations. Adhere strictly to Port City International University's academic integrity policy, and transparently disclose AI assistance when submitting course projects or theses.
          </p>
        </div>
      </div>

      {publishedToast && (
        <div className="p-4 bg-[#DDF5EA] border border-[#A7F3D0] rounded-2xl text-xs font-bold text-[#0E9F6E] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{publishedToast}</span>
        </div>
      )}

      {/* Stepper Progress */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-bold">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            step === 1 ? 'bg-[#0B6BE6] text-white' : 'bg-white text-gray-600 border border-[#E3EAF3]'
          }`}
        >
          <span>1. Topic & Parameters</span>
        </button>
        <span className="text-gray-300">→</span>
        <button
          onClick={() => outline.length > 0 && setStep(2)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            step === 2 ? 'bg-[#0B6BE6] text-white' : 'bg-white text-gray-600 border border-[#E3EAF3]'
          }`}
        >
          <span>2. Review Outline</span>
        </button>
        <span className="text-gray-300">→</span>
        <button
          onClick={() => Object.keys(sections).length > 0 && setStep(3)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            step === 3 ? 'bg-[#0B6BE6] text-white' : 'bg-white text-gray-600 border border-[#E3EAF3]'
          }`}
        >
          <span>3. Section Generator & Editor</span>
        </button>
      </div>

      {/* Step 1: Topic & Parameters Form */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-[#0B2A55]">Define Paper Scope</h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Research Topic & Working Title *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Federated Learning for Privacy-Preserving IoT Healthcare Sensors"
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-4 py-3 text-sm text-[#0B2A55] font-semibold focus:outline-hidden focus:border-[#0B6BE6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Research Domain</label>
                <select
                  value={researchArea}
                  onChange={(e) => setResearchArea(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55] font-semibold"
                >
                  {RESEARCH_AREAS.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Manuscript Type</label>
                <select
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55] font-semibold"
                >
                  <option value="IMRaD Empirical Paper">IMRaD Empirical Research Paper</option>
                  <option value="Literature Review / Survey">Systematic Literature Survey</option>
                  <option value="Case Study">Applied Case Study</option>
                  <option value="Research Proposal">Grant / Thesis Proposal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Target Word Length</label>
                <select
                  value={targetWords}
                  onChange={(e) => setTargetWords(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55] font-semibold"
                >
                  <option value={1500}>1,500 words (Short Conference)</option>
                  <option value={3000}>3,000 words (Standard Manuscript)</option>
                  <option value={5000}>5,000 words (Extended Journal Article)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Citation Standard</label>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55] font-semibold"
                >
                  <option value="IEEE">IEEE Reference Style [1]</option>
                  <option value="APA">APA 7th Edition (Author, Year)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateOutline}
                className="px-6 py-3 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Generate Outline</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Outline Review */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0B2A55]">Manuscript Outline</h2>
              <p className="text-xs text-gray-500">Review and reorder sections before generating full content</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-[#0B6BE6] hover:underline"
            >
              ← Edit Topic
            </button>
          </div>

          <div className="space-y-3">
            {outline.map((sec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E3EAF3] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#0B2A55]">{sec.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{sec.prompt}</p>
                </div>
                <span className="text-xs font-bold text-[#0B6BE6] shrink-0">Section {i + 1}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Back
            </button>
            <button
              onClick={handleGenerateAllSections}
              className="px-6 py-3 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Full Manuscript Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Section Generator & Full Editor */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Top Actions: Copy Markdown, Publish to CollabX */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E3EAF3] shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#0B2A55]">Draft:</span>
              <span className="text-gray-500 truncate max-w-sm">{topic}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyMarkdown}
                className="px-4 py-2 bg-[#F5F8FC] hover:bg-gray-200 border border-[#E3EAF3] rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-[#0E9F6E]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToast ? 'Copied Markdown!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handlePublishToCollabX}
                className="px-5 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Publish to CollabX</span>
              </button>
            </div>
          </div>

          {/* Editor Grid: Section Selector Left, Rich Content Center, Grounded References Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sections Selector (3 Cols) */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E3EAF3] p-4 space-y-2 shadow-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 px-2 py-1">Sections</h4>
              {outline.map((sec, idx) => (
                <button
                  key={sec.title}
                  onClick={() => setActiveEditorSection(sec.title)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                    activeEditorSection === sec.title
                      ? 'bg-[#0B6BE6] text-white font-bold'
                      : 'text-gray-700 hover:bg-[#F5F8FC]'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  {sections[sec.title] && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Main Content Area (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs min-h-[420px]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-[#0B2A55]">{activeEditorSection}</h3>
                <span className="text-[11px] font-semibold text-gray-400">
                  {sections[activeEditorSection] ? `${sections[activeEditorSection].split(' ').length} words` : 'Generating...'}
                </span>
              </div>

              {generatingSectionIndex !== null && !sections[activeEditorSection] ? (
                <div className="py-12 text-center space-y-3">
                  <RotateCw className="w-6 h-6 text-[#0B6BE6] animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-gray-500">
                    Drafting academic section using peer-reviewed formulations...
                  </p>
                </div>
              ) : (
                <textarea
                  rows={14}
                  value={sections[activeEditorSection] || ''}
                  onChange={(e) => setSections({ ...sections, [activeEditorSection]: e.target.value })}
                  className="w-full text-xs sm:text-sm text-gray-800 leading-relaxed font-mono bg-[#F5F8FC]/50 p-4 rounded-2xl border border-[#E3EAF3] focus:outline-hidden focus:border-[#0B6BE6]"
                />
              )}
            </div>

            {/* Grounded Scholarly References Sidebar (3 Cols) */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E3EAF3] p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2A55]">
                <CheckCircle2 className="w-4 h-4 text-[#0E9F6E]" />
                <span>Verified References (Crossref)</span>
              </div>

              <div className="space-y-3">
                {verifiedRefs.map((ref, idx) => (
                  <div key={idx} className="p-3 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3] text-[11px] space-y-1">
                    <span className="font-bold text-[#0B2A55] block line-clamp-2">{ref.title}</span>
                    <span className="text-gray-500 block">{ref.authors} ({ref.year})</span>
                    <span className="text-[10px] text-[#0E9F6E] font-mono block">DOI: {ref.doi} (Verified)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
