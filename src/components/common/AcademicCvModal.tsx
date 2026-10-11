import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Award, 
  GraduationCap, 
  BookOpen, 
  Cpu, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User } from '../../types';
import { downloadAcademicCv, extractCvData } from '../../services/cvService';

interface AcademicCvModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: Partial<User> | null;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
}

export const AcademicCvModal: React.FC<AcademicCvModalProps> = ({
  isOpen,
  onClose,
  user,
  fileName,
  fileSize = '1.2 MB',
  fileData
}) => {
  if (!isOpen) return null;

  const data = extractCvData(user);
  const displayFileName = fileName || `${data.name.replace(/\s+/g, '_')}_Academic_CV.pdf`;

  const handleDownload = () => {
    downloadAcademicCv({
      user,
      fileName: displayFileName,
      fileData
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isPdfDataUrl = Boolean(
    fileData?.startsWith('data:application/pdf') ||
    (fileData?.startsWith('data:') && (fileData.includes('application/pdf') || fileData.includes('application/x-pdf') || displayFileName.toLowerCase().endsWith('.pdf')))
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E3EAF3] overflow-hidden my-auto">
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 bg-[#0B2A55] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#FFC83D]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base truncate text-white">
                  {displayFileName}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E9F6E]/20 text-[#34D399] border border-[#0E9F6E]/40">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Academic Document
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                A4 Academic Curriculum Vitae • {fileSize} • Port City International University
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print CV"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body / Paper View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#EBF0F7] flex justify-center">
          {isPdfDataUrl ? (
            <div className="w-full max-w-3xl h-[650px] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <iframe
                src={fileData}
                title="CV Document Preview"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-10 space-y-6 text-gray-800 font-sans print:shadow-none print:border-none print:p-0">
              {/* Document Header */}
              <div className="border-b-2 border-[#0B2A55] pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0B2A55] tracking-tight">
                      {data.name}
                    </h1>
                    <p className="text-sm font-bold text-[#0B6BE6] mt-0.5">
                      {data.headline}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {data.department} • {data.institution}
                    </p>
                  </div>

                  <div className="text-right sm:text-right space-y-1 text-xs text-gray-600 shrink-0">
                    <div className="flex items-center sm:justify-end gap-1.5 font-medium">
                      <span>Email:</span>
                      <a href={`mailto:${data.email}`} className="text-[#0B6BE6] hover:underline font-semibold">
                        {data.email}
                      </a>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      ID: PCIU-UG-2023-0491
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DDF5EA] text-[#0E9F6E] font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Academic Standing: Verified Active
                    </div>
                  </div>
                </div>

                {/* Profile Links */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Academic Profiles:</span>
                  <span className="hover:text-[#0B6BE6] flex items-center gap-1 cursor-pointer">
                    Google Scholar <ExternalLink className="w-3 h-3" />
                  </span>
                  <span>•</span>
                  <span className="hover:text-[#0B6BE6] flex items-center gap-1 cursor-pointer">
                    GitHub / ash-ketchum-cse <ExternalLink className="w-3 h-3" />
                  </span>
                  <span>•</span>
                  <span className="hover:text-[#0B6BE6] flex items-center gap-1 cursor-pointer">
                    CollabX Research ID
                  </span>
                </div>
              </div>

              {/* 1. Education Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <GraduationCap className="w-4 h-4 text-[#0B6BE6]" />
                  Education & Honors
                </div>
                <div className="p-4 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-sm text-[#0B2A55]">{data.degree}</span>
                    <span className="text-xs font-semibold text-gray-500">{data.graduationYear}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {data.institution} — Department of {data.department}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-[#DCE6FB] text-[#0B6BE6] font-bold">
                      CGPA: {data.cgpa}
                    </span>
                    <span className="text-gray-600">
                      Dean’s Academic Excellence Award (2025, 2026)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Research Profile & Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <Sparkles className="w-4 h-4 text-[#0B6BE6]" />
                  Research Profile & Statement
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-[#FAFCFF] p-3.5 rounded-xl border border-gray-100">
                  {data.bio}
                </p>
              </div>

              {/* 3. Research Focus Areas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <BookOpen className="w-4 h-4 text-[#0B6BE6]" />
                  Research Focus Areas
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.interests.map(item => (
                    <span
                      key={item}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#E9E9FB] text-[#5C54E5] border border-[#DDD6FE]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Publications & Scholarly Works */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <FileText className="w-4 h-4 text-[#0B6BE6]" />
                  Selected Publications & Preprints
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-white rounded-xl border border-[#E3EAF3] space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#0B2A55]">
                        1. Deep Multi-Modal Feature Fusion for Clinical Screening: Interpretable Saliency Mapping
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DDF5EA] text-[#0E9F6E] shrink-0">
                        Published
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      IEEE Journal of Biomedical and Health Informatics (JBHI), 2026. DOI: 10.1109/JBHI.2026.4912
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E3EAF3] space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#0B2A55]">
                        2. Comparative Gradient Attention & Meta-Heuristic Dispatch in High-Precision Solar Optimization
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] shrink-0">
                        Under Review
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      IEEE PES Conference on Innovative Grid Solutions, 2026.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Academic Research Projects */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <Award className="w-4 h-4 text-[#0B6BE6]" />
                  Selected Research Projects
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3] space-y-1">
                    <span className="text-[10px] font-bold text-[#0B6BE6] uppercase">Renewable Energy</span>
                    <h5 className="font-bold text-xs text-[#0B2A55]">Wind & Solar Optimization</h5>
                    <p className="text-[11px] text-gray-600">
                      Residual forecasting algorithms and real-time turbine pitch control using deep reinforcement learning.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3] space-y-1">
                    <span className="text-[10px] font-bold text-[#0B6BE6] uppercase">Medical AI</span>
                    <h5 className="font-bold text-xs text-[#0B2A55]">Grad-CAM Clinical Diagnostics</h5>
                    <p className="text-[11px] text-gray-600">
                      Explainable AI pipelines ensuring radiological attention saliency aligns with physician annotations.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Technical Skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2A55] uppercase tracking-wider border-b border-gray-200 pb-1">
                  <Cpu className="w-4 h-4 text-[#0B6BE6]" />
                  Technical Methodologies & Skills
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.skills.map(s => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#DDF5EA] text-[#0E9F6E]"
                    >
                      {s}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                    Linux
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                    Weights & Biases
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                    LaTeX
                  </span>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-[#0E9F6E]/10 flex items-center justify-center text-[#0E9F6E]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#0B2A55] block">CollabX Academic Record Verified</span>
                    <span className="text-[10px] text-gray-400">Digital Seal • Port City International University</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 font-mono">
                  REF: PCIU-CV-2026-X902
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0E9F6E]" />
            <span>Document is ready and attached to research application.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B6BE6] hover:bg-[#0956b8] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
