import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  Share2, 
  Copy, 
  Check, 
  BookOpen, 
  FileText, 
  Calendar, 
  Users, 
  Sparkles, 
  MessageSquare, 
  Send,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { Paper, User, PaperComment } from '../types';
import { storage } from '../services/storage';
import { ExternalSearchService } from '../services/externalSearchService';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { PaperPdfModal } from '../components/common/PaperPdfModal';
import { downloadPaperPdf, generatePaperPdf } from '../services/paperPdfService';

interface PaperDetailsPageProps {
  paperId: string;
  currentUser: User | null;
  onNavigate: (path: string) => void;
}

export const PaperDetailsPage: React.FC<PaperDetailsPageProps> = ({
  paperId,
  currentUser,
  onNavigate
}) => {
  const paper = storage.getPaper(paperId);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [readerViewMode, setReaderViewMode] = useState<'pdf' | 'transcript'>('pdf');
  const [comments, setComments] = useState<PaperComment[]>([
    {
      id: 'c-1',
      paperId,
      userId: 'user-fahim',
      userName: 'Dr. Fahim Rahman',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      body: 'Excellent methodology discussion on multimodal attention weighting. The empirical benchmarks on CheXpert look very solid.',
      createdAt: '2 days ago'
    }
  ]);
  const [commentInput, setCommentInput] = useState('');

  const pdfDocumentUri = useMemo(() => {
    if (!paper) return '';
    if (paper.pdfData && paper.pdfData.startsWith('data:')) return paper.pdfData;
    if (paper.pdfUrl && paper.pdfUrl.startsWith('data:')) return paper.pdfUrl;
    if (paper.pdfUrl && paper.pdfUrl.startsWith('http')) return paper.pdfUrl;
    try {
      const doc = generatePaperPdf(paper);
      return doc.output('datauristring');
    } catch {
      return '';
    }
  }, [paper]);

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0B2A55]">Research Paper Not Found</h2>
        <button
          onClick={() => onNavigate('/papers')}
          className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold"
        >
          Return to Papers Library
        </button>
      </div>
    );
  }

  const { apa, ieee, bibtex } = ExternalSearchService.generateCitation(paper);

  const handleCopyCitation = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleLike = () => {
    if (!isLiked) {
      storage.likePaper(paper.id);
      setIsLiked(true);
    }
  };

  const handleDownload = () => {
    storage.incrementPaperDownload(paper.id);
    downloadPaperPdf(paper);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;

    setComments([
      ...comments,
      {
        id: `c-${Date.now()}`,
        paperId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        body: commentInput.trim(),
        createdAt: 'Just now'
      }
    ]);
    setCommentInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/papers')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6BE6] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Papers Library
      </button>

      {/* Header Info Card */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCE6FB] text-[#0B6BE6]">
            {paper.paperType}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DDF5EA] text-[#0E9F6E]">
            {paper.areaName}
          </span>
          <span className="text-xs text-gray-500 font-semibold">{paper.year}</span>
          {paper.doi && (
            <span className="text-xs text-gray-400 font-mono">DOI: {paper.doi}</span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight leading-snug">
          {paper.title}
        </h1>

        {/* Authors */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700">
          <span className="text-gray-400">Authors:</span>
          {paper.authors.map((author, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F5F8FC] border border-[#E3EAF3] text-[#0B2A55]">
              {author}
            </span>
          ))}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloadSuccess ? 'Downloaded!' : `Download PDF (${paper.downloads})`}</span>
            </button>

            <button
              onClick={handleLike}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isLiked ? 'bg-red-50 text-[#E53935] border-red-200' : 'bg-[#F5F8FC] border-[#E3EAF3] text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{paper.likes + (isLiked ? 1 : 0)} Likes</span>
            </button>
          </div>

          <div className="text-xs text-gray-400 font-semibold">
            {paper.views} Academic Reads
          </div>
        </div>
      </div>

      {/* Abstract */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-base text-[#0B2A55]">Abstract</h3>
        <p className="text-sm text-gray-700 leading-relaxed font-normal">
          {paper.abstract}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {paper.keywords.map(kw => (
            <span key={kw} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F5F8FC] text-gray-600 border border-[#E3EAF3]">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {/* In-Browser PDF / Document Reader Preview */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] overflow-hidden shadow-xs">
        <div className="bg-[#0B2A55] text-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FFC83D]" />
              <span className="font-bold">In-Browser Manuscript Reader</span>
            </div>

            {/* View mode toggle */}
            <div className="inline-flex rounded-lg bg-white/10 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setReaderViewMode('pdf')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  readerViewMode === 'pdf' ? 'bg-[#0B6BE6] text-white shadow-xs' : 'text-gray-300 hover:text-white'
                }`}
              >
                Attached PDF
              </button>
              <button
                type="button"
                onClick={() => setReaderViewMode('transcript')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  readerViewMode === 'transcript' ? 'bg-[#0B6BE6] text-white shadow-xs' : 'text-gray-300 hover:text-white'
                }`}
              >
                Article View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Fullscreen PDF Viewer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen PDF</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#0B6BE6] hover:bg-[#0956b8] rounded-xl text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Download Attached PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Reader Body */}
        {readerViewMode === 'pdf' ? (
          <div className="w-full h-[650px] sm:h-[720px] bg-[#EBF0F7] p-2 sm:p-4 flex flex-col justify-center">
            {pdfDocumentUri ? (
              <iframe
                src={pdfDocumentUri}
                title={paper.title}
                className="w-full h-full bg-white rounded-2xl shadow-md border border-gray-200"
              />
            ) : (
              <div className="text-center p-8 space-y-3">
                <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-gray-600 text-xs font-semibold">PDF preview not available inline</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#0B6BE6] text-white rounded-xl text-xs font-bold"
                >
                  Download Manuscript PDF
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Render simulated academic manuscript pages */
          <div className="p-8 sm:p-12 bg-gray-50 flex justify-center">
            <div className="max-w-2xl w-full bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-gray-200 space-y-6 text-xs text-gray-800 leading-relaxed font-serif">
              <div className="text-center space-y-2 border-b pb-4">
                <h2 className="text-base font-bold text-gray-900 font-sans">{paper.title}</h2>
                <p className="text-[11px] text-gray-600 italic font-sans">{paper.authors.join(', ')}</p>
                <p className="text-[10px] text-gray-500 font-sans">Department of Computer Science and Engineering, Port City International University</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1 font-sans">I. Introduction</h3>
                <p className="indent-4">
                  Rapid advancements in {paper.areaName} have unlocked unprecedented capabilities across scientific and medical domains. However, translating these theoretical insights into reliable production systems poses foundational challenges in latency, sample efficiency, and interpretability.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1 font-sans">II. Methodology & System Architecture</h3>
                <p className="indent-4">
                  We formulate a cross-attention representation network trained under regularized loss parameters. The empirical evaluation incorporates multi-center cohorts with rigorous statistical validation.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border rounded text-center text-gray-500 italic text-[11px]">
                [Figure 1: High-level architectural pipeline showing multimodal attention weighting and feature extraction maps]
              </div>

              <div className="pt-4 text-center text-[10px] text-gray-400 font-sans">
                — End of Article Preview —
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Citation Generator Box matching Section 7.3 */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-5 shadow-xs">
        <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#0B6BE6]" />
          Cite This Research Paper
        </h3>

        <div className="space-y-3">
          {/* APA */}
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3] flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-[11px] text-[#0B6BE6] block mb-1">APA Format</span>
              <p className="text-xs text-gray-700 font-mono select-all">{apa}</p>
            </div>
            <button
              onClick={() => handleCopyCitation(apa, 'APA')}
              className="px-3 py-1.5 bg-white border border-[#E3EAF3] rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
            >
              {copiedFormat === 'APA' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* IEEE */}
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3] flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-[11px] text-[#0E9F6E] block mb-1">IEEE Format</span>
              <p className="text-xs text-gray-700 font-mono select-all">{ieee}</p>
            </div>
            <button
              onClick={() => handleCopyCitation(ieee, 'IEEE')}
              className="px-3 py-1.5 bg-white border border-[#E3EAF3] rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
            >
              {copiedFormat === 'IEEE' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* BibTeX */}
          <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E3EAF3] flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-[11px] text-[#5C54E5] block mb-1">BibTeX</span>
              <pre className="text-[11px] text-gray-700 font-mono select-all whitespace-pre-wrap">{bibtex}</pre>
            </div>
            <button
              onClick={() => handleCopyCitation(bibtex, 'BibTeX')}
              className="px-3 py-1.5 bg-white border border-[#E3EAF3] rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
            >
              {copiedFormat === 'BibTeX' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Discussion & Academic Peer Comments */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="font-extrabold text-base text-[#0B2A55] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0B6BE6]" />
          Scholarly Discussion & Peer Notes ({comments.length})
        </h3>

        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E3EAF3] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar src={c.userAvatar} name={c.userName} size="xs" />
                  <span className="font-bold text-[#0B2A55]">{c.userName}</span>
                </div>
                <span className="text-gray-400">{c.createdAt}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add an academic question or review comment…"
            className="flex-1 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-4 py-2.5 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Post Note
          </button>
        </form>
      </div>

      {/* Fullscreen Paper PDF Modal */}
      {isPdfModalOpen && (
        <PaperPdfModal
          paper={paper}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};
