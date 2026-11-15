import { jsPDF } from 'jspdf';
import { Paper } from '../types';
import {
  resolvePdfSource,
  sanitizePdfFileName,
  uint8ArrayToBase64
} from '../lib/pdfSource';

/**
 * Generates an official, publication-grade academic PDF for research papers
 * in CollabX using jsPDF. Supports multi-page rendering when full `paper.content`
 * (e.g. AI-Writer manuscripts) is present.
 */
export function generatePaperPdf(paper: Partial<Paper>): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let pageNum = 1;

  const drawFooter = () => {
    doc.setDrawColor(227, 234, 243);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CollabX Academic Repository  •  Paper ID: ${paper.id || 'MANUSCRIPT'}`,
      margin,
      pageHeight - 10
    );
    doc.text(`Page ${pageNum}`, pageWidth - margin - 14, pageHeight - 10);
  };

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      pageNum += 1;
      y = 20;
    }
  };

  // Header banner / CollabX repository stamp
  doc.setFillColor(11, 42, 85); // #0B2A55
  doc.rect(margin, y, contentWidth, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'COLLABX ACADEMIC RESEARCH REPOSITORY  •  PORT CITY INTERNATIONAL UNIVERSITY',
    margin + 4,
    y + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 240, 138);
  const paperTypeStr = (paper.paperType || 'Conference Manuscript').toUpperCase();
  const yearStr = paper.year ? `${paper.year}` : new Date().getFullYear().toString();
  doc.text(
    `PEER-REVIEWED ${paperTypeStr}  |  PUBLISHED: ${yearStr}  |  OPEN ACCESS`,
    margin + 4,
    y + 10.5
  );

  y += 22;

  // DOI and Area tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 107, 230);
  const areaTag = `[ ${paper.areaName || 'Computer Science & AI'} ]`;
  doc.text(areaTag, margin, y);

  if (paper.doi) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`DOI: ${paper.doi}`, pageWidth - margin - 45, y);
  }
  y += 7;

  // Paper Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(11, 42, 85);
  const title = paper.title || 'Untitled Research Manuscript';
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Authors & Affiliation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const authors =
    paper.authors && paper.authors.length > 0
      ? paper.authors.join(', ')
      : 'CollabX Research Team';
  const authorLines = doc.splitTextToSize(authors, contentWidth);
  doc.text(authorLines, margin, y);
  y += authorLines.length * 4.5 + 1.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Department of Computer Science and Engineering, Port City International University (PCIU)',
    margin,
    y
  );
  y += 4;
  doc.text('Chattogram, Bangladesh  •  Institutional Repository Archive', margin, y);
  y += 8;

  // Divider
  doc.setDrawColor(227, 234, 243);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Abstract Box
  const abstractText =
    paper.abstract ||
    'This paper presents novel computational methodologies, theoretical frameworks, and experimental validations conducted at the Port City International University Collaborative Research Laboratory.';

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  const abstractLines = doc.splitTextToSize(abstractText, contentWidth - 12);
  const visibleAbstractLines = abstractLines.slice(0, 10);
  const abstractBoxHeight = visibleAbstractLines.length * 4.3 + 14;

  ensureSpace(abstractBoxHeight + 8);
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, abstractBoxHeight, 'F');
  doc.rect(margin, y, contentWidth, abstractBoxHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 42, 85);
  doc.text('ABSTRACT', margin + 6, y + 6);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);
  doc.text(visibleAbstractLines, margin + 6, y + 12);

  y += abstractBoxHeight + 6;

  // Keywords
  if (paper.keywords && paper.keywords.length > 0) {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(11, 107, 230);
    doc.text('Keywords: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const kwLines = doc.splitTextToSize(paper.keywords.join('  •  '), contentWidth - 20);
    doc.text(kwLines, margin + 18, y);
    y += kwLines.length * 4 + 5;
  }

  // Render full paper content if provided (e.g. AI Writer generated sections)
  if (paper.content && paper.content.trim()) {
    const blocks = paper.content.split(/\n{2,}/);
    for (const rawBlock of blocks) {
      const block = rawBlock.trim();
      if (!block) continue;

      if (block.startsWith('## ')) {
        ensureSpace(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(11, 42, 85);
        const headingLines = doc.splitTextToSize(block.replace(/^##\s+/, ''), contentWidth);
        doc.text(headingLines, margin, y);
        y += headingLines.length * 5.2 + 2;
      } else if (block.startsWith('### ')) {
        ensureSpace(11);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 58, 138);
        const subLines = doc.splitTextToSize(block.replace(/^###\s+/, ''), contentWidth);
        doc.text(subLines, margin, y);
        y += subLines.length * 4.6 + 1.5;
      } else {
        const cleanBody = block.replace(/\*\*/g, '').replace(/\$\$?/g, '');
        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const paraLines = doc.splitTextToSize(cleanBody, contentWidth);
        for (const line of paraLines) {
          ensureSpace(6);
          doc.text(line, margin, y);
          y += 4.3;
        }
        y += 3;
      }
    }
  } else {
    // Structured Academic Body Preview when no custom body text exists
    ensureSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 42, 85);
    doc.text('I. INTRODUCTION & PROBLEM FORMULATION', margin, y);
    y += 5.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    const introPara1 = `Recent advancements in ${paper.areaName || 'computational intelligence'} demonstrate significant potential in transforming interdisciplinary research. However, existing benchmarks frequently overlook multi-parameter constraints, sample variability, and system efficiency in distributed deployments.`;
    const introLines1 = doc.splitTextToSize(introPara1, contentWidth);
    doc.text(introLines1, margin, y);
    y += introLines1.length * 4.3 + 4;

    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 42, 85);
    doc.text('II. METHODOLOGY & EXPERIMENTAL PIPELINE', margin, y);
    y += 5.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    const methodPara =
      "We establish a cross-validated experimental pipeline initialized under deterministic seed controls to guarantee full reproducibility. Statistical significance was verified across independent evaluation folds.";
    const methodLines = doc.splitTextToSize(methodPara, contentWidth);
    doc.text(methodLines, margin, y);
    y += methodLines.length * 4.3 + 6;
  }

  drawFooter();
  return doc;
}

/**
 * Produces a clean Blob directly from jsPDF (never uses doc.output('datauristring')).
 */
export function generatePaperPdfBlob(paper: Partial<Paper>): Blob {
  const doc = generatePaperPdf(paper);
  return doc.output('blob');
}

/**
 * Produces raw PDF bytes directly from jsPDF.
 */
export function generatePaperPdfBytes(paper: Partial<Paper>): Uint8Array {
  const doc = generatePaperPdf(paper);
  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

/**
 * Generates raw base64 PDF payload (without data URI prefix or filename=generated.pdf).
 */
export function generateSamplePaperPdfBase64(
  title: string,
  authors: string[],
  extra?: Partial<Paper>
): string {
  const bytes = generatePaperPdfBytes({
    title,
    authors,
    abstract:
      extra?.abstract ||
      'Official academic research preprint manuscript archived in CollabX. Includes methodology, system architecture overview, experimental design, and citations.',
    paperType: extra?.paperType || 'Conference',
    areaName: extra?.areaName || 'Computer Science & AI',
    year: extra?.year || new Date().getFullYear(),
    keywords: extra?.keywords || ['Machine Learning', 'Research', 'CollabX', 'PCIU'],
    content: extra?.content
  });

  return uint8ArrayToBase64(bytes);
}

/**
 * Downloads the paper PDF using a Blob Object URL when source data/URL exists,
 * or generates a clean jsPDF download named after the paper title (never generated.pdf).
 */
export async function downloadPaperPdf(paper: Partial<Paper>): Promise<void> {
  const cleanName = sanitizePdfFileName(paper.title, paper.pdfFileName);
  const rawSource = paper.pdfData || paper.pdfUrl;

  if (rawSource) {
    try {
      const resolved = await resolvePdfSource(rawSource);
      const link = document.createElement('a');
      link.href = resolved.objectUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(resolved.objectUrl), 10000);
      return;
    } catch (err) {
      console.error('[PDF Download] Direct blob resolve failed:', err);
      if (paper.pdfUrl && /^https?:\/\//i.test(paper.pdfUrl)) {
        window.open(paper.pdfUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
  }

  const doc = generatePaperPdf(paper);
  doc.save(cleanName);
}
