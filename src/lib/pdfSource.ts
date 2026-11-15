export type PdfInputSource = string | Blob | ArrayBuffer | Uint8Array;

export type PdfSourceKind =
  | 'data-uri'
  | 'raw-base64'
  | 'blob'
  | 'arraybuffer'
  | 'uint8array'
  | 'https-url'
  | 'blob-url';

export class PdfSourceError extends Error {
  code:
    | 'EMPTY_SOURCE'
    | 'INVALID_BASE64'
    | 'INVALID_PDF'
    | 'CORS_BLOCKED'
    | 'HTTP_ERROR'
    | 'UNSUPPORTED_CONTENT_TYPE'
    | 'UNKNOWN';
  externalUrl?: string;

  constructor(
    message: string,
    code: PdfSourceError['code'] = 'UNKNOWN',
    externalUrl?: string
  ) {
    super(message);
    this.name = 'PdfSourceError';
    this.code = code;
    this.externalUrl = externalUrl;
  }
}

export interface ResolvedPdfSource {
  blob: Blob;
  objectUrl: string;
  bytes: Uint8Array;
  sourceType: PdfSourceKind;
  externalUrl?: string;
}

/**
 * Safe limit (~700 KB base64) so a single Firestore document (1 MiB max) or
 * browser localStorage repository entry never overflows quota.
 */
export const MAX_PDF_BASE64_BYTES = 700 * 1024;
export const MAX_RAW_PDF_FILE_BYTES = Math.floor((MAX_PDF_BASE64_BYTES * 3) / 4); // ~525 KB raw binary

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...sub));
  }
  return btoa(chunks.join(''));
}

export function sanitizePdfFileName(title?: string, existingName?: string): string {
  const candidate = (existingName || '').trim();
  if (candidate && candidate.toLowerCase() !== 'generated.pdf') {
    const cleaned = candidate
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (cleaned) {
      return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
    }
  }

  const slug = (title || 'research-paper')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${slug || 'research-paper'}.pdf`;
}

function decodeBase64ToBytes(rawBase64: string): Uint8Array {
  const normalized = rawBase64
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  if (!normalized) {
    throw new PdfSourceError('The PDF base64 payload is empty.', 'EMPTY_SOURCE');
  }

  let binary: string;
  try {
    binary = atob(normalized);
  } catch (err) {
    throw new PdfSourceError(
      `Failed to decode base64 PDF data: ${err instanceof Error ? err.message : 'Invalid encoding'}`,
      'INVALID_BASE64'
    );
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 5) return false;
  const headerSlice = bytes.subarray(0, Math.min(bytes.byteLength, 1024));
  let ascii = '';
  for (let i = 0; i < headerSlice.length; i++) {
    ascii += String.fromCharCode(headerSlice[i]);
  }
  return ascii.includes('%PDF-');
}

function looksLikeHtml(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.byteLength, 256));
  let text = '';
  for (let i = 0; i < sample.length; i++) {
    text += String.fromCharCode(sample[i]);
  }
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

function createPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice()], { type: 'application/pdf' });
}

/**
 * Normalizes any PDF source (data URI, malformed jsPDF data URI with ;filename=...,
 * raw base64 string, Blob, ArrayBuffer, Uint8Array, blob: URL, or https:// URL)
 * into { blob, objectUrl, bytes }.
 *
 * Callers MUST revoke `objectUrl` via `URL.revokeObjectURL(objectUrl)` on cleanup.
 */
export async function resolvePdfSource(
  source: PdfInputSource | null | undefined
): Promise<ResolvedPdfSource> {
  if (source === null || source === undefined) {
    throw new PdfSourceError('No PDF attached to this paper.', 'EMPTY_SOURCE');
  }

  // 1. Uint8Array
  if (source instanceof Uint8Array) {
    if (source.byteLength === 0) {
      throw new PdfSourceError('The PDF byte buffer is empty.', 'EMPTY_SOURCE');
    }
    const bytes = source;
    const blob = createPdfBlob(bytes);
    const objectUrl = URL.createObjectURL(blob);
    logResolved('uint8array', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'uint8array' };
  }

  // 2. ArrayBuffer
  if (source instanceof ArrayBuffer) {
    if (source.byteLength === 0) {
      throw new PdfSourceError('The PDF ArrayBuffer is empty.', 'EMPTY_SOURCE');
    }
    const bytes = new Uint8Array(source);
    const blob = createPdfBlob(bytes);
    const objectUrl = URL.createObjectURL(blob);
    logResolved('arraybuffer', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'arraybuffer' };
  }

  // 3. Blob
  if (source instanceof Blob) {
    if (source.size === 0) {
      throw new PdfSourceError('The PDF Blob is empty.', 'EMPTY_SOURCE');
    }
    const buf = await source.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const blob =
      source.type === 'application/pdf'
        ? source
        : new Blob([bytes], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    logResolved('blob', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'blob' };
  }

  if (typeof source !== 'string') {
    throw new PdfSourceError('Unsupported PDF source type.', 'INVALID_PDF');
  }

  const trimmed = source.trim();
  if (!trimmed) {
    throw new PdfSourceError('No PDF attached to this paper.', 'EMPTY_SOURCE');
  }

  // 4. Data URI (handles standard & malformed parameters like data:application/pdf;filename=generated.pdf;base64,...)
  if (/^data:/i.test(trimmed)) {
    const base64Match = trimmed.match(/^data:[^,]*?;base64,([\s\S]*)$/i);
    let bytes: Uint8Array;
    if (base64Match) {
      bytes = decodeBase64ToBytes(base64Match[1]);
    } else {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx === -1) {
        throw new PdfSourceError('Malformed data URI for PDF.', 'INVALID_BASE64');
      }
      const rawPayload = trimmed.slice(commaIdx + 1);
      let decodedText: string;
      try {
        decodedText = decodeURIComponent(rawPayload);
      } catch {
        decodedText = rawPayload;
      }
      bytes = new Uint8Array(decodedText.length);
      for (let i = 0; i < decodedText.length; i++) {
        bytes[i] = decodedText.charCodeAt(i) & 0xff;
      }
    }

    if (bytes.byteLength === 0) {
      throw new PdfSourceError('Decoded PDF data URI is empty.', 'EMPTY_SOURCE');
    }
    const blob = createPdfBlob(bytes);
    const objectUrl = URL.createObjectURL(blob);
    logResolved('data-uri', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'data-uri' };
  }

  // 5. Existing blob: URL
  if (/^blob:/i.test(trimmed)) {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new PdfSourceError(`Failed to read local blob URL (${response.status}).`, 'HTTP_ERROR');
    }
    const buf = await response.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    logResolved('blob-url', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'blob-url' };
  }

  // 6. Remote http(s):// or same-origin / path URL
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    let response: Response;
    try {
      response = await fetch(trimmed, { mode: 'cors' });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Network or CORS restriction prevented fetching this PDF.';
      throw new PdfSourceError(
        `CORS or network error fetching PDF: ${message}`,
        'CORS_BLOCKED',
        trimmed
      );
    }

    if (!response.ok) {
      throw new PdfSourceError(
        `Remote server returned HTTP ${response.status} (${response.statusText || 'Error'}).`,
        'HTTP_ERROR',
        trimmed
      );
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const buf = await response.arrayBuffer();
    const bytes = new Uint8Array(buf);

    if (bytes.byteLength === 0) {
      throw new PdfSourceError('Remote PDF response was empty (0 bytes).', 'EMPTY_SOURCE', trimmed);
    }

    const isPdfContentType =
      contentType.includes('application/pdf') ||
      contentType.includes('application/x-pdf') ||
      contentType.includes('application/octet-stream') ||
      contentType === '';

    if ((!isPdfContentType && !hasPdfHeader(bytes)) || looksLikeHtml(bytes)) {
      throw new PdfSourceError(
        `URL did not return a valid PDF document (Content-Type: ${contentType || 'unknown'}).`,
        'UNSUPPORTED_CONTENT_TYPE',
        trimmed
      );
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    logResolved('https-url', bytes.byteLength);
    return { blob, objectUrl, bytes, sourceType: 'https-url', externalUrl: trimmed };
  }

  // 7. Raw base64 string (e.g. stored directly in Firestore)
  const bytes = decodeBase64ToBytes(trimmed);
  if (!hasPdfHeader(bytes) && looksLikeHtml(bytes)) {
    throw new PdfSourceError('Stored base64 content is HTML rather than a PDF file.', 'INVALID_PDF');
  }
  const blob = createPdfBlob(bytes);
  const objectUrl = URL.createObjectURL(blob);
  logResolved('raw-base64', bytes.byteLength);
  return { blob, objectUrl, bytes, sourceType: 'raw-base64' };
}

function logResolved(sourceType: PdfSourceKind, byteLength: number): void {
  if (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.log(`[PDF Reader] Resolved PDF source: type=${sourceType}, bytes=${byteLength}`);
  }
}
