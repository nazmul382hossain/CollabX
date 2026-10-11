import React from 'react';
import { X, Download, ExternalLink, FileText, BookOpen } from 'lucide-react';
import { Paper } from '../../types';
import { downloadPaperPdf, generatePaperPdf } from '../../services/paperPdfService';

interface PaperPdfModalProps {
  paper: Partial<Paper>;
  isOpen: boolean;
  onClose: () => void;
}

export const PaperPdfModal: React.FC<PaperPdfModalProps> = ({ paper, isOpen, onClose }) => {
  if (!isOpen) return null;

  const pdfSource = React.useMemo(() => {
    if (paper.pdfData && paper.pdfData.startsWith('data:')) {
      return paper.pdfData;
    }
    if (paper.pdfUrl && paper.pdfUrl.startsWith('data:')) {
      return paper.pdfUrl;
    }
    if (paper.pdfUrl && paper.pdfUrl.startsWith('http')) {
      return paper.pdfUrl;
    }
    // Generate data uri string from paper
    try {
      const doc = generatePaperPdf(paper);
      return doc.output('datauristring');
    } catch {
      return '';
    }
  }, [paper]);

  const handleDownload = () => {
    downloadPaperPdf(paper as Paper);
  };

  const handleOpenNewTab = () => {
    if (pdfSource) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(
          `<html><head><title>${paper.title || 'Paper PDF'}</title></head><body style="margin:0;"><iframe src="${pdfSource}" style="width:100%;height:100%;border:none;"></iframe></body></html>`
        );
      }
    }
  };

  const displayFileName = paper.pdfFileName || `${(paper.title || 'Academic_Paper').replace(/[^a-zA-Z0-9_-]/g, '_')}_Manuscript.pdf`;

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
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download PDF File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {pdfSource.startsWith('data:') && (
              <button
                onClick={handleOpenNewTab}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Open in Tab</span>
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

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-[#EBF0F7] p-2 sm:p-4 overflow-hidden flex flex-col">
          {pdfSource ? (
            <div className="w-full h-full bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <iframe
                src={pdfSource}
                title={paper.title || 'PDF Document Viewer'}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-gray-400" />
              <h4 className="font-bold text-gray-700">Unable to preview document</h4>
              <p className="text-xs text-gray-500 max-w-sm">
                The attached manuscript cannot be displayed inline. You can download the PDF to view it on your device.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#0B6BE6] text-white text-xs font-bold rounded-xl"
              >
                Download PDF File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
