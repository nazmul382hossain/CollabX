import React, { useState, useMemo } from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import { Paper } from '../../types';
import { generatePaperPdfBlob } from '../../services/paperPdfService';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { PdfInputSource, sanitizePdfFileName } from '../../lib/pdfSource';

interface PaperPdfModalProps {
  paper: Partial<Paper>;
  isOpen: boolean;
  onClose: () => void;
  onSwitchToArticleView?: () => void;
  allowGeneratePreview?: boolean;
}

export const PaperPdfModal: React.FC<PaperPdfModalProps> = ({
  paper,
  isOpen,
  onClose,
  onSwitchToArticleView,
  allowGeneratePreview = true
}) => {
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const attachedSource: PdfInputSource | null = useMemo(() => {
    if (generatedBlob) return generatedBlob;
    if (paper.pdfData && paper.pdfData.trim()) return paper.pdfData;
    if (paper.pdfUrl && paper.pdfUrl.trim()) return paper.pdfUrl;
    return null;
  }, [paper.pdfData, paper.pdfUrl, generatedBlob]);

  if (!isOpen) return null;

  const displayFileName = sanitizePdfFileName(paper.title, paper.pdfFileName);

  const handleGeneratePreview = () => {
    try {
      const blob = generatePaperPdfBlob(paper);
      setGeneratedBlob(blob);
    } catch (err) {
      console.error('[PaperPdfModal] Failed to generate jsPDF blob:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E3EAF3]">
        {/* Modal Top Bar */}
        <div className="bg-[#0B2A55] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-[#FFC83D] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm truncate max-w-md text-white">
                {paper.title || 'Research Paper Manuscript'}
              </h3>
              <p className="text-[11px] text-gray-300 truncate">
                {displayFileName} {paper.pdfFileSize ? `• ${paper.pdfFileSize}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!attachedSource && allowGeneratePreview && (
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="px-3 py-1.5 rounded-xl bg-[#FFC83D] hover:bg-[#f5bc28] text-[#0B2A55] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate PDF Preview</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close PDF Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF.js Canvas Viewer Body */}
        <div className="flex-1 min-h-0 flex flex-col">
          <PdfCanvasViewer
            source={attachedSource}
            title={paper.title}
            fileName={displayFileName}
            externalUrl={paper.pdfUrl && /^https?:\/\//i.test(paper.pdfUrl) ? paper.pdfUrl : undefined}
            heightClass="h-full"
            onSwitchToArticleView={
              onSwitchToArticleView
                ? () => {
                    onClose();
                    onSwitchToArticleView();
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};
