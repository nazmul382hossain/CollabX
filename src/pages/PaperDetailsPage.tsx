import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  Share2, 
  BookOpen, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Send,
  Maximize2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Paper, User, PaperComment, PaperStats } from '../types';
import { storage } from '../services/storage';
import { ExternalSearchService } from '../services/externalSearchService';
import { Avatar } from '../components/common/Avatar';
import { PaperPdfModal } from '../components/common/PaperPdfModal';
import { PdfCanvasViewer } from '../components/common/PdfCanvasViewer';
import { downloadPaperPdf, generatePaperPdfBlob } from '../services/paperPdfService';
import { PaperRating } from '../components/common/PaperRating';
import { RatingService, getPaperId } from '../services/ratingService';
import { PdfInputSource, sanitizePdfFileName } from '../lib/pdfSource';
import { markdownToRawHtml, sanitizeArticleHtml } from '../lib/articleHtml';

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
  const [paperStats, setPaperStats] = useState<PaperStats | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  React.useEffect(() => {
    if (paper) {
      const pid = getPaperId({ id: paper.id, doi: paper.doi, source: 'collabx' });
      RatingService.batchGetPaperStats([pid]).then(statsMap => {
        if (statsMap[pid]) {
          setPaperStats(statsMap[pid]);
        }
      });
    }
  }, [paper]);
  const [isLiked, setIsLiked] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const attachedPdfSource: PdfInputSource | null = useMemo(() => {
    if (!paper) return null;
    if (paper.pdfData && paper.pdfData.trim()) return paper.pdfData;
    if (paper.pdfUrl && paper.pdfUrl.trim()) return paper.pdfUrl;
    return null;
  }, [paper]);

  const hasAttachedPdf = Boolean(attachedPdfSource);
  const [generatedPreviewBlob, setGeneratedPreviewBlob] = useState<Blob | null>(null);
  const [readerViewMode, setReaderViewMode] = useState<'pdf' | 'transcript'>(() =>
    hasAttachedPdf ? 'pdf' : 'transcript'
  );
  const [noPdfBanner, setNoPdfBanner] = useState<boolean>(() => !hasAttachedPdf);

  useEffect(() => {
    setGeneratedPreviewBlob(null);
    if (!hasAttachedPdf) {
      setReaderViewMode('transcript');
      setNoPdfBanner(true);
    } else {
      setReaderViewMode('pdf');
      setNoPdfBanner(false);
    }
  }, [paperId, hasAttachedPdf]);

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

  const sanitizedArticleHtml = useMemo(() => {
    if (!paper) return '';
    if (paper.htmlContent && paper.htmlContent.trim()) {
      return sanitizeArticleHtml(paper.htmlContent);
    }
    if (paper.content && paper.content.trim()) {
      return sanitizeArticleHtml(markdownToRawHtml(paper.content));
    }
    return '';
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

  const handleDownload = async () => {
    storage.incrementPaperDownload(paper.id);
    await downloadPaperPdf(paper);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleGeneratePdfCopy = () => {
    try {
      const blob = generatePaperPdfBlob(paper);
      setGeneratedPreviewBlob(blob);
      setNoPdfBanner(false);
      setReaderViewMode('pdf');
    } catch (err) {
      console.error('[PaperDetailsPage] Failed to generate jsPDF copy:', err);
    }
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCE6FB] text-[#0B6BE6]">
              {paper.paperType}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DDF5EA] text-[#0E9F6E]">
              {paper.areaName}
            </span>
            <span className="text-xs text-gray-500 font-semibold">{paper.year}</span>
            {ExternalSearchService.cleanAndValidateDoi(paper.doi) && (
              <a
                href={`https://doi.org/${ExternalSearchService.cleanAndValidateDoi(paper.doi)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#1565E8] hover:underline font-mono font-semibold inline-flex items-center gap-1 bg-[#EEF4FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]"
              >
                <span>DOI: {ExternalSearchService.cleanAndValidateDoi(paper.doi)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <PaperRating
            paper={{ id: paper.id, doi: paper.doi, source: 'collabx', title: paper.title }}
            stats={paperStats}
            currentUser={currentUser}
            onAuthRequired={() => onNavigate('/login')}
            onRated={(newStats) => setPaperStats(newStats)}
            size="md"
          />
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
          <div className="flex flex-wrap items-center gap-3">
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
            {!hasAttachedPdf && !generatedPreviewBlob && (
              <button
                type="button"
                onClick={handleGeneratePdfCopy}
                className="px-3 py-1.5 bg-[#FFC83D] hover:bg-[#f5bc28] rounded-xl text-[#0B2A55] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Generate printable PDF from article metadata"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open PDF in Modal Reader"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Reader</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#0B6BE6] hover:bg-[#0956b8] rounded-xl text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`Download ${sanitizePdfFileName(paper.title, paper.pdfFileName)}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Reader Body */}
        {readerViewMode === 'pdf' ? (
          <PdfCanvasViewer
            source={generatedPreviewBlob || attachedPdfSource}
            title={paper.title}
            fileName={paper.pdfFileName}
            externalUrl={paper.pdfUrl && /^https?:\/\//i.test(paper.pdfUrl) ? paper.pdfUrl : undefined}
            onSwitchToArticleView={() => setReaderViewMode('transcript')}
            onDownloadRecorded={() => storage.incrementPaperDownload(paper.id)}
            emptyMessage="No PDF attached to this paper"
          />
        ) : (
          /* Article View Tab: shows abstract, metadata, and DOMPurify-sanitized HTML for AI-generated papers */
          <div className="p-6 sm:p-10 bg-[#F3F4F6] space-y-4">
            {noPdfBanner && !hasAttachedPdf && !generatedPreviewBlob && (
              <div className="max-w-3xl mx-auto px-4 py-3 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-semibold flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No PDF attached to this paper — showing Article View instead.</span>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePdfCopy}
                  className="px-3 py-1.5 rounded-xl bg-[#0B2A55] text-white text-[11px] font-bold hover:bg-[#133b75] cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate PDF Preview</span>
                </button>
              </div>
            )}

            <div className="max-w-3xl mx-auto w-full bg-white p-6 sm:p-12 rounded-2xl shadow-md border border-gray-200 space-y-6 text-sm text-gray-800 leading-relaxed">
              <div className="text-center space-y-2 border-b border-gray-200 pb-5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE6FB] text-[#0B6BE6] uppercase tracking-wider">
                  {paper.paperType} • {paper.year}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2A55] leading-snug">
                  {paper.title}
                </h2>
                <p className="text-xs text-gray-600 font-medium">
                  {paper.authors.join(', ')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {paper.areaName} • Port City International University Repository
                </p>
              </div>

              <div className="bg-[#F5F8FC] border border-[#E3EAF3] rounded-2xl p-4 sm:p-5 space-y-1.5">
                <h3 className="font-bold text-[#0B2A55] uppercase tracking-wider text-xs">
                  Abstract
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {paper.abstract}
                </p>
              </div>

              {sanitizedArticleHtml ? (
                <div
                  className="space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-[#0B2A55] [&_h2]:pt-3 [&_h2]:border-b [&_h2]:border-gray-100 [&_h2]:pb-1.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#1E3A8A] [&_h3]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizedArticleHtml }}
                />
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <div>
                    <h3 className="font-bold text-[#0B2A55] uppercase tracking-wider text-xs mb-1.5">
                      Manuscript Summary
                    </h3>
                    <p>
                      This {paper.paperType.toLowerCase()} in <strong>{paper.areaName}</strong> was authored by {paper.authors.join(', ')} ({paper.year}). Key research focus areas include {paper.keywords.join(', ')}.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
                — End of Article View —
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
          paper={generatedPreviewBlob ? { ...paper, pdfData: undefined, pdfUrl: undefined } : paper}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onSwitchToArticleView={() => setReaderViewMode('transcript')}
        />
      )}
    </div>
  );
};
