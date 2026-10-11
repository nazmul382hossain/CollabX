import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Download, 
  Star, 
  Filter, 
  FileText, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  MessageSquare, 
  ArrowLeft,
  X,
  Upload,
  CheckCircle2,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Paper, User, PaperComment } from '../types';
import { storage } from '../services/storage';
import { ExternalSearchService } from '../services/externalSearchService';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { PaperPdfModal } from '../components/common/PaperPdfModal';
import { generateSamplePaperPdfDataUrl, downloadPaperPdf } from '../services/paperPdfService';
import { formatFileSize } from '../services/cvService';

interface PapersPageProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
}

export const PapersPage: React.FC<PapersPageProps> = ({ currentUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'downloads'>('latest');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewingPdfPaper, setViewingPdfPaper] = useState<Paper | null>(null);

  // Upload Form states
  const [newTitle, setNewTitle] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newArea, setNewArea] = useState('Artificial Intelligence');
  const [newPaperType, setNewPaperType] = useState<any>('Conference');
  const [newAuthors, setNewAuthors] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newDoi, setNewDoi] = useState('');

  // Attached PDF File state
  const [attachedPdf, setAttachedPdf] = useState<{
    file?: File;
    name: string;
    size: string;
    data: string;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const papers = storage.getPapers();

  const filteredPapers = papers.filter(p => {
    if (selectedArea !== 'all' && p.areaName.toLowerCase() !== selectedArea.toLowerCase()) return false;
    if (selectedType !== 'all' && p.paperType !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'downloads') return b.downloads - a.downloads;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleFileSelect = (file: File) => {
    setPdfError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfError('Only PDF files (.pdf) are allowed. Please select a valid research manuscript PDF.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPdfError('File size exceeds the 25MB limit. Please attach a compressed PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachedPdf({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        data: dataUrl
      });
      setPdfError(null);
    };
    reader.onerror = () => {
      setPdfError('Failed to read the selected PDF file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateSamplePdf = () => {
    setIsGeneratingSample(true);
    setPdfError(null);
    try {
      const title = newTitle.trim() || 'Deep Residual Learning for Signal Detection';
      const authors = newAuthors.trim() 
        ? newAuthors.split(',').map(s => s.trim()) 
        : [currentUser?.name || 'Lead Author', 'Faculty Mentor'];
      const dataUrl = generateSamplePaperPdfDataUrl(title, authors);
      const safeName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Manuscript.pdf`;
      setAttachedPdf({
        name: safeName,
        size: '1.4 MB',
        data: dataUrl
      });
    } catch {
      setPdfError('Could not generate sample PDF. Please choose a local file.');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate('/login');
      return;
    }

    const authorsList = newAuthors.trim() ? newAuthors.split(',').map(s => s.trim()) : [currentUser.name];
    const keywordsList = newKeywords.trim() ? newKeywords.split(',').map(s => s.trim()) : ['Research'];

    // If no custom PDF was attached by user, auto-generate official PDF so paper always has an attached document
    let finalPdfData = attachedPdf?.data;
    let finalPdfName = attachedPdf?.name;
    let finalPdfSize = attachedPdf?.size;

    if (!finalPdfData) {
      finalPdfData = generateSamplePaperPdfDataUrl(newTitle.trim(), authorsList);
      finalPdfName = `${newTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_Manuscript.pdf`;
      finalPdfSize = '1.4 MB';
    }

    storage.addPaper({
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      uploaderAvatar: currentUser.avatar,
      title: newTitle.trim(),
      abstract: newAbstract.trim(),
      paperType: newPaperType,
      areaId: 'area-ai',
      areaName: newArea,
      year: new Date().getFullYear(),
      doi: newDoi.trim() || undefined,
      authors: authorsList,
      keywords: keywordsList,
      pdfUrl: finalPdfData,
      pdfFileName: finalPdfName,
      pdfFileSize: finalPdfSize,
      pdfData: finalPdfData,
      visibility: 'public',
      aiAssisted: false
    });

    setUploadModalOpen(false);
    setNewTitle('');
    setNewAbstract('');
    setNewAuthors('');
    setNewKeywords('');
    setNewDoi('');
    setAttachedPdf(null);
    setPdfError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Research Papers Library</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Browse peer-reviewed manuscripts, preprints, and theses authored by university scholars
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/ai-writer')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FFC83D] hover:bg-[#f5bc28] text-[#0B2A55] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            AI Paper Writer
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Paper
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3EAF3] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers, authors, DOIs, keywords…"
            className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-full py-2 pl-9 pr-3 text-xs text-[#0B2A55] focus:outline-hidden focus:border-[#0B6BE6]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-semibold">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-gray-700"
          >
            <option value="all">All Research Areas</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Internet of Things">Internet of Things</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Data Science">Data Science</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="Journal">Journal</option>
            <option value="Conference">Conference</option>
            <option value="Preprint">Preprint</option>
            <option value="Thesis">Thesis</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-gray-700"
          >
            <option value="latest">Latest</option>
            <option value="views">Most Read</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPapers.map(paper => (
          <div
            key={paper.id}
            onClick={() => onNavigate(`/papers/${paper.id}`)}
            className="bg-white rounded-3xl border border-[#E3EAF3] p-6 card-shadow card-shadow-hover cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#DCE6FB] text-[#0B6BE6]">
                    {paper.paperType}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">{paper.year}</span>
                  <span className="text-xs text-gray-400">• {paper.areaName}</span>
                </div>
                {paper.aiAssisted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI-Assisted
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-base text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors line-clamp-2">
                {paper.title}
              </h3>

              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                {paper.abstract}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {paper.keywords.map(kw => (
                  <span key={kw} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F8FC] text-gray-500 border border-[#E3EAF3]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Avatar src={paper.uploaderAvatar} name={paper.uploaderName} size="xs" />
                <span className="font-semibold text-gray-700 truncate max-w-[150px]">{paper.authors[0]}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-400">★ {paper.likes}</span>
                <span className="text-gray-400">{paper.views} reads</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingPdfPaper(paper);
                  }}
                  className="text-[#0B6BE6] hover:text-[#0956b8] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Read PDF →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Paper Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#0B2A55]">Upload Research Manuscript</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Deep Residual Learning for Signal Detection"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Abstract *</label>
                <textarea
                  required
                  rows={3}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  placeholder="Provide structured abstract summarizing background, method, results, and significance..."
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-[#0B2A55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Research Area</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Internet of Things">Internet of Things</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Bioinformatics">Bioinformatics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Paper Type</label>
                  <select
                    value={newPaperType}
                    onChange={(e) => setNewPaperType(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="Journal">Journal Article</option>
                    <option value="Conference">Conference Proceeding</option>
                    <option value="Preprint">Preprint</option>
                    <option value="Thesis">Undergraduate / MS Thesis</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Authors (comma-separated)</label>
                <input
                  type="text"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  placeholder="e.g. Mohammad Nayeem, Dr. Fahim Rahman"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="e.g. Deep Learning, PyTorch, CheXNet"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Digital Object Identifier (DOI, optional)</label>
                <input
                  type="text"
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  placeholder="10.1109/..."
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              {/* REAL ATTACH PDF FILE UPLOAD SECTION */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 block">
                    Attach PDF File <span className="text-gray-400 font-normal">(Max 25MB)</span>
                  </label>
                  {!attachedPdf && (
                    <button
                      type="button"
                      onClick={handleGenerateSamplePdf}
                      disabled={isGeneratingSample}
                      className="text-[11px] font-semibold text-[#0B6BE6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isGeneratingSample ? 'Generating...' : 'Auto-Generate Manuscript PDF'}</span>
                    </button>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {attachedPdf ? (
                  /* Attached PDF State */
                  <div className="p-3.5 bg-[#F5F8FC] rounded-2xl border-2 border-[#0E9F6E]/40 flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0B2A55] truncate block">
                            {attachedPdf.name}
                          </span>
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700">
                            PDF
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>{attachedPdf.size}</span>
                          <span>•</span>
                          <span className="text-[#0E9F6E] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PDF Attached & Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingPdfPaper({
                            id: 'preview',
                            title: newTitle || attachedPdf.name,
                            abstract: newAbstract || 'Attached PDF Manuscript Preview',
                            paperType: newPaperType,
                            areaId: 'area-ai',
                            areaName: newArea,
                            year: new Date().getFullYear(),
                            authors: newAuthors ? newAuthors.split(',') : [currentUser?.name || 'Author'],
                            keywords: ['Preview'],
                            uploaderId: currentUser?.id || 'user',
                            uploaderName: currentUser?.name || 'User',
                            uploaderAvatar: '',
                            visibility: 'public',
                            views: 0,
                            downloads: 0,
                            likes: 0,
                            createdAt: new Date().toISOString(),
                            pdfData: attachedPdf.data,
                            pdfFileName: attachedPdf.name,
                            pdfFileSize: attachedPdf.size
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-[#0B6BE6] transition-colors cursor-pointer"
                        title="Preview attached PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg bg-white border border-[#E3EAF3] text-gray-600 hover:text-[#0B6BE6] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttachedPdf(null)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        title="Remove attached PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Upload Dropzone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className={`p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer ${
                      isDraggingPdf
                        ? 'bg-[#EBF3FE] border-[#0B6BE6] ring-2 ring-[#0B6BE6]/30'
                        : 'bg-[#F5F8FC] border-[#0B6BE6]/40 hover:border-[#0B6BE6] hover:bg-[#F0F5FD]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#DCE6FB] text-[#0B6BE6] flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">
                        Attach PDF File (Max 25MB)
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Drag & drop your manuscript PDF here, or <span className="text-[#0B6BE6] font-semibold underline">browse files</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Standard research paper format (.pdf)
                    </span>
                  </div>
                )}

                {pdfError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pdfError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Publish Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Paper PDF Modal */}
      {viewingPdfPaper && (
        <PaperPdfModal
          paper={viewingPdfPaper}
          isOpen={!!viewingPdfPaper}
          onClose={() => setViewingPdfPaper(null)}
        />
      )}
    </div>
  );
};
