import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Search,
  AlertTriangle,
  FileText,
  BookOpen,
  X,
  Loader2,
  Lock
} from 'lucide-react';
import {
  PdfInputSource,
  PdfSourceError,
  ResolvedPdfSource,
  resolvePdfSource,
  sanitizePdfFileName
} from '../../lib/pdfSource';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfCanvasViewerProps {
  source: PdfInputSource | null | undefined;
  title?: string;
  fileName?: string;
  externalUrl?: string;
  onSwitchToArticleView?: () => void;
  onDownloadRecorded?: () => void;
  heightClass?: string;
  emptyMessage?: string;
}

interface PdfPageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  zoomMode: 'fit-width' | 'manual';
  manualScale: number;
  scrollRoot: HTMLDivElement | null;
  isSearchMatch: boolean;
  isActiveMatch: boolean;
  onVisibleRatioChange: (pageNumber: number, ratio: number) => void;
  registerPageElement: (pageNumber: number, el: HTMLDivElement | null) => void;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDoc,
  pageNumber,
  containerWidth,
  zoomMode,
  manualScale,
  scrollRoot,
  isSearchMatch,
  isActiveMatch,
  onVisibleRatioChange,
  registerPageElement
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shouldRender, setShouldRender] = useState(pageNumber <= 2);
  const [rendering, setRendering] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: Math.max(280, Math.min(794, (containerWidth || 720) - 32)),
    height: Math.round(Math.max(280, Math.min(794, (containerWidth || 720) - 32)) * 1.414)
  });

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      wrapperRef.current = el;
      registerPageElement(pageNumber, el);
    },
    [pageNumber, registerPageElement]
  );

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldRender(true);
          }
          onVisibleRatioChange(
            pageNumber,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        }
      },
      {
        root: scrollRoot,
        rootMargin: '360px 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, scrollRoot, onVisibleRatioChange]);

  useEffect(() => {
    if (!shouldRender) return;
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    const renderPage = async () => {
      try {
        setRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(260, (containerWidth || 720) - 32);
        const scale =
          zoomMode === 'fit-width'
            ? availableWidth / baseViewport.width
            : manualScale;

        const safeScale = Math.max(0.35, Math.min(scale, 3.5));
        const viewport = page.getViewport({ scale: safeScale });
        const cssWidth = Math.floor(viewport.width);
        const cssHeight = Math.floor(viewport.height);

        setPageSize({ width: cssWidth, height: cssHeight });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
        renderTask = page.render({
          canvas,
          canvasContext: ctx,
          viewport,
          transform
        });

        await renderTask.promise;
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name !== 'RenderingCancelledException' && !cancelled) {
          console.error(`[PDF Reader] Failed to render page ${pageNumber}:`, err);
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, shouldRender, containerWidth, zoomMode, manualScale]);

  return (
    <div
      ref={setRefs}
      data-page-number={pageNumber}
      style={{ width: pageSize.width, minHeight: pageSize.height }}
      className={`relative mx-auto bg-white rounded-lg shadow-md border transition-shadow ${
        isActiveMatch
          ? 'ring-2 ring-[#FFC83D] border-[#F59E0B]'
          : isSearchMatch
          ? 'ring-2 ring-[#0B6BE6]/50 border-[#0B6BE6]'
          : 'border-gray-200/90'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="block rounded-lg bg-white max-w-full"
      />
      {(!shouldRender || rendering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#0B6BE6]" />
            <span>Rendering page {pageNumber}…</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/55 text-white text-[10px] font-semibold pointer-events-none">
        Page {pageNumber}
      </div>
    </div>
  );
};

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  source,
  title,
  fileName,
  externalUrl,
  onSwitchToArticleView,
  onDownloadRecorded,
  heightClass = 'h-[650px] sm:h-[740px]',
  emptyMessage = 'No PDF attached to this paper'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const visibleRatiosRef = useRef<Map<number, number>>(new Map());

  const [resolved, setResolved] = useState<ResolvedPdfSource | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [zoomMode, setZoomMode] = useState<'fit-width' | 'manual'>('fit-width');
  const [manualScale, setManualScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(720);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{
    title: string;
    detail: string;
    kind: 'empty' | 'password' | 'corrupt' | 'cors' | 'error';
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState<boolean>(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const cleanFileName = sanitizePdfFileName(title, fileName);

  // Track viewport width for responsive Fit Width & resize re-rendering
  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;

    const updateWidth = () => {
      const nextWidth = el.clientWidth;
      if (nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    };

    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen, isFallbackFullscreen]);

  // Listen to native fullscreenchange events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Resolve source -> Blob + ObjectURL + Bytes, then load with PDF.js
  useEffect(() => {
    let active = true;
    let createdObjectUrl: string | null = null;
    let loadedDoc: PDFDocumentProxy | null = null;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    setLoading(true);
    setErrorInfo(null);
    setPdfDoc(null);
    setResolved(null);
    setNumPages(0);
    setCurrentPage(1);
    setPageInput('1');
    setSearchMatches([]);
    visibleRatiosRef.current.clear();

    const load = async () => {
      if (
        source === null ||
        source === undefined ||
        (typeof source === 'string' && source.trim() === '')
      ) {
        if (!active) return;
        setLoading(false);
        setErrorInfo({
          title: emptyMessage,
          detail: 'No PDF file or URL is attached to this manuscript record.',
          kind: 'empty'
        });
        return;
      }

      try {
        const res = await resolvePdfSource(source);
        createdObjectUrl = res.objectUrl;
        if (!active) {
          URL.revokeObjectURL(res.objectUrl);
          return;
        }
        setResolved(res);

        // Pass a copy of bytes so PDF.js worker transfer does not detach res.bytes
        loadingTask = pdfjsLib.getDocument({
          data: res.bytes.slice(),
          standardFontDataUrl: './pdfjs/standard_fonts/',
          useSystemFonts: true
        });

        const doc = await loadingTask.promise;
        if (!active) {
          await doc.cleanup();
          return;
        }

        loadedDoc = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');
        setLoading(false);
      } catch (err: unknown) {
        console.error('[PDF Reader] Failed to load PDF:', err);
        if (!active) return;

        const errObj = err as { name?: string; message?: string; code?: string };
        const message =
          errObj?.message || 'Unknown error occurred while decoding this PDF.';

        if (err instanceof PdfSourceError && err.code === 'EMPTY_SOURCE') {
          setErrorInfo({
            title: emptyMessage,
            detail: message,
            kind: 'empty'
          });
        } else if (err instanceof PdfSourceError && err.code === 'CORS_BLOCKED') {
          setErrorInfo({
            title: 'This PDF could not be displayed.',
            detail: message,
            kind: 'cors'
          });
        } else if (errObj?.name === 'PasswordException') {
          setErrorInfo({
            title: 'This PDF could not be displayed.',
            detail:
              'This PDF file is password-protected or encrypted and cannot be unlocked inline.',
            kind: 'password'
          });
        } else if (
          errObj?.name === 'InvalidPDFException' ||
          errObj?.name === 'MissingPDFException' ||
          (err instanceof PdfSourceError &&
            (err.code === 'INVALID_PDF' || err.code === 'INVALID_BASE64'))
        ) {
          setErrorInfo({
            title: 'This PDF could not be displayed.',
            detail: `Corrupted or invalid PDF file: ${message}`,
            kind: 'corrupt'
          });
        } else {
          setErrorInfo({
            title: 'This PDF could not be displayed.',
            detail: message,
            kind: 'error'
          });
        }

        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // ignore
        }
      }
      if (loadedDoc) {
        try {
          loadedDoc.cleanup();
        } catch {
          // ignore
        }
      }
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [source, emptyMessage]);

  const registerPageElement = useCallback(
    (pageNumber: number, el: HTMLDivElement | null) => {
      if (el) {
        pageElementsRef.current.set(pageNumber, el);
      } else {
        pageElementsRef.current.delete(pageNumber);
      }
    },
    []
  );

  const handleVisibleRatioChange = useCallback(
    (pageNumber: number, ratio: number) => {
      visibleRatiosRef.current.set(pageNumber, ratio);
      let bestPage = 1;
      let bestRatio = -1;
      visibleRatiosRef.current.forEach((r, pg) => {
        if (r > bestRatio) {
          bestRatio = r;
          bestPage = pg;
        }
      });
      if (bestRatio > 0) {
        setCurrentPage(bestPage);
        setPageInput(String(bestPage));
      }
    },
    []
  );

  const scrollToPage = useCallback(
    (targetPage: number) => {
      if (!numPages) return;
      const clamped = Math.max(1, Math.min(numPages, targetPage));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
      const el = pageElementsRef.current.get(clamped);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [numPages]
  );

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      scrollToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    const base =
      zoomMode === 'fit-width'
        ? Math.max(0.6, Math.min(1.8, (containerWidth - 32) / 612))
        : manualScale;
    setZoomMode('manual');
    setManualScale(Number(Math.min(2.5, base + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    const base =
      zoomMode === 'fit-width'
        ? Math.max(0.6, Math.min(1.8, (containerWidth - 32) / 612))
        : manualScale;
    setZoomMode('manual');
    setManualScale(Number(Math.max(0.5, base - 0.15).toFixed(2)));
  };

  const handleFitWidth = () => {
    setZoomMode('fit-width');
  };

  // Search PDF text across pages
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchMatches([]);
      setActiveMatchIdx(0);
      return;
    }

    let cancelled = false;
    const term = searchQuery.trim().toLowerCase();

    const runSearch = async () => {
      setIsSearching(true);
      const matchedPages: number[] = [];
      try {
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
            .toLowerCase();
          if (pageText.includes(term)) {
            matchedPages.push(p);
          }
        }
        if (!cancelled) {
          setSearchMatches(matchedPages);
          setActiveMatchIdx(0);
          if (matchedPages.length > 0) {
            scrollToPage(matchedPages[0]);
          }
        }
      } catch (err) {
        console.error('[PDF Reader] Search error:', err);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(runSearch, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pdfDoc, searchQuery, scrollToPage]);

  const jumpMatch = (direction: 1 | -1) => {
    if (searchMatches.length === 0) return;
    const nextIdx =
      (activeMatchIdx + direction + searchMatches.length) % searchMatches.length;
    setActiveMatchIdx(nextIdx);
    scrollToPage(searchMatches[nextIdx]);
  };

  const toggleFullscreen = async () => {
    const target = containerRef.current;
    if (!target) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setIsFallbackFullscreen(false);
      }
      return;
    }

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }

    if (typeof target.requestFullscreen === 'function') {
      try {
        await target.requestFullscreen();
        return;
      } catch {
        // Fallback when iframe permissions block native Fullscreen API
      }
    }
    setIsFallbackFullscreen(true);
  };

  const resolvedExternalUrl =
    externalUrl ||
    resolved?.externalUrl ||
    (typeof source === 'string' && /^https?:\/\//i.test(source.trim())
      ? source.trim()
      : undefined);

  const openInNewTabUrl = resolved?.objectUrl || resolvedExternalUrl;

  const handleOpenNewTab = () => {
    if (!openInNewTabUrl) return;
    window.open(openInNewTabUrl, '_blank', 'noopener,noreferrer');
  };

  const effectiveZoomLabel =
    zoomMode === 'fit-width'
      ? 'Fit'
      : `${Math.round(manualScale * 100)}%`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#F3F4F6] overflow-hidden ${
        isFallbackFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen'
          : isFullscreen
          ? 'h-screen w-screen'
          : `w-full ${heightClass}`
      }`}
    >
      {/* Dark Theme PDF Toolbar */}
      <div className="bg-[#0F172A] text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 shrink-0 text-xs">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!pdfDoc || currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              aria-label="Current page number"
              disabled={!pdfDoc}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(pageInput, 10);
                if (!Number.isNaN(parsed) && parsed !== currentPage) {
                  scrollToPage(parsed);
                } else {
                  setPageInput(String(currentPage));
                }
              }}
              className="w-11 text-center bg-white/10 border border-white/20 rounded-lg px-1.5 py-1 text-xs font-bold text-white focus:outline-hidden focus:border-[#FFC83D] disabled:opacity-40"
            />
            <span className="text-gray-300 font-semibold">
              / {numPages || '—'}
            </span>
          </form>

          <button
            type="button"
            disabled={!pdfDoc || currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            type="button"
            disabled={!pdfDoc}
            onClick={handleZoomOut}
            className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-[11px] font-bold text-gray-200 min-w-[42px] text-center">
            {effectiveZoomLabel}
          </span>
          <button
            type="button"
            disabled={!pdfDoc}
            onClick={handleZoomIn}
            className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!pdfDoc}
            onClick={handleFitWidth}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              zoomMode === 'fit-width'
                ? 'bg-[#0B6BE6] text-white'
                : 'text-gray-300 hover:bg-white/15'
            }`}
            title="Fit page to container width"
          >
            Fit Width
          </button>
        </div>

        {/* Right Actions: Search, Fullscreen, Download */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!pdfDoc}
            onClick={() => setSearchOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-35 ${
              searchOpen ? 'bg-[#FFC83D] text-[#0B2A55]' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Search text in PDF"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isFullscreen || isFallbackFullscreen ? 'Exit Fullscreen' : 'Fullscreen PDF'}
          >
            {isFullscreen || isFallbackFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen || isFallbackFullscreen ? 'Exit Fullscreen' : 'Fullscreen PDF'}
            </span>
          </button>

          {resolved?.objectUrl ? (
            <a
              download={cleanFileName}
              href={resolved.objectUrl}
              onClick={() => onDownloadRecorded?.()}
              className="px-3 py-1.5 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title={`Download ${cleanFileName}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          ) : resolvedExternalUrl ? (
            <a
              href={resolvedExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onDownloadRecorded?.()}
              className="px-3 py-1.5 rounded-xl bg-[#0B6BE6] hover:bg-[#0956b8] text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Optional Search Strip */}
      {searchOpen && pdfDoc && (
        <div className="bg-[#1E293B] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find text in manuscript pages…"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-400 focus:outline-hidden focus:border-[#FFC83D]"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            {isSearching ? (
              <span className="text-gray-300 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching…
              </span>
            ) : searchQuery.trim() ? (
              <span className="text-gray-300 font-semibold">
                {searchMatches.length > 0
                  ? `Match ${activeMatchIdx + 1} of ${searchMatches.length} page${searchMatches.length > 1 ? 's' : ''}`
                  : 'No matches'}
              </span>
            ) : null}

            {searchMatches.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => jumpMatch(-1)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                  title="Previous matching page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => jumpMatch(1)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                  title="Next matching page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-300 cursor-pointer"
              title="Close Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Light Gray Page Viewport */}
      <div
        ref={scrollViewportRef}
        className="flex-1 overflow-y-auto bg-[#F3F4F6] p-3 sm:p-6 space-y-5"
      >
        {loading && (
          <div className="max-w-2xl mx-auto space-y-4 py-6">
            <div className="flex items-center justify-center gap-2.5 text-xs font-bold text-[#0B2A55]">
              <Loader2 className="w-5 h-5 animate-spin text-[#0B6BE6]" />
              <span>Loading PDF manuscript ({cleanFileName})…</span>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 space-y-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-11/12" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
              <div className="h-44 bg-gray-100 rounded-lg mt-4" />
            </div>
          </div>
        )}

        {!loading && errorInfo && (
          <div className="max-w-lg mx-auto my-8 bg-white rounded-2xl border border-[#E3EAF3] shadow-md p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              {errorInfo.kind === 'password' ? (
                <Lock className="w-6 h-6" />
              ) : errorInfo.kind === 'empty' ? (
                <FileText className="w-6 h-6 text-[#0B6BE6]" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-base text-[#0B2A55]">
                {errorInfo.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {errorInfo.kind === 'cors'
                  ? 'This open-access PDF blocks inline cross-origin loading. Use "Open in new tab" below to read it directly.'
                  : errorInfo.kind === 'empty'
                  ? 'No PDF document is attached to this manuscript entry yet.'
                  : 'We could not render the PDF pages inline in the canvas viewer.'}
              </p>
            </div>

            <div className="text-left bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Technical details
              </span>
              <p className="text-[11px] font-mono text-gray-700 break-words">
                {errorInfo.detail}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {openInNewTabUrl && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in new tab</span>
                </button>
              )}

              {resolved?.objectUrl ? (
                <a
                  download={cleanFileName}
                  href={resolved.objectUrl}
                  onClick={() => onDownloadRecorded?.()}
                  className="px-4 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              ) : resolvedExternalUrl ? (
                <a
                  href={resolvedExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onDownloadRecorded?.()}
                  className="px-4 py-2 bg-[#0E9F6E] hover:bg-[#0b8259] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              ) : null}

              {onSwitchToArticleView && (
                <button
                  type="button"
                  onClick={onSwitchToArticleView}
                  className="px-4 py-2 bg-[#F5F8FC] hover:bg-gray-200 text-[#0B2A55] border border-[#E3EAF3] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Switch to Article View</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !errorInfo && pdfDoc && (
          <div className="space-y-5">
            {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => {
              const isMatch = searchMatches.includes(pageNum);
              const isActiveMatch =
                isMatch && searchMatches[activeMatchIdx] === pageNum;
              return (
                <PdfPageCanvas
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  containerWidth={containerWidth}
                  zoomMode={zoomMode}
                  manualScale={manualScale}
                  scrollRoot={scrollViewportRef.current}
                  isSearchMatch={isMatch}
                  isActiveMatch={isActiveMatch}
                  onVisibleRatioChange={handleVisibleRatioChange}
                  registerPageElement={registerPageElement}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
