import DOMPurify from 'dompurify';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 text-[#0B2A55] font-mono text-[11px]">$1</code>');
}

/**
 * Converts AI-generated section text / markdown into clean semantic HTML.
 */
export function buildArticleHtmlFromSections(sections: Record<string, string>): string {
  const parts: string[] = [];
  for (const [heading, body] of Object.entries(sections)) {
    if (!body || !body.trim()) continue;
    parts.push(`<h2>${escapeHtml(heading)}</h2>`);
    parts.push(markdownToRawHtml(body));
  }
  return parts.join('\n');
}

export function markdownToRawHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith('### ')) {
      closeList();
      htmlParts.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeList();
      htmlParts.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      closeList();
      htmlParts.push(`<h2>${formatInlineMarkdown(line.slice(2))}</h2>`);
    } else if (/^(\d+\.|-|\*)\s+/.test(line)) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const itemText = line.replace(/^(\d+\.|-|\*)\s+/, '');
      htmlParts.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
    } else {
      closeList();
      htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  return htmlParts.join('\n');
}

/**
 * Sanitizes HTML with DOMPurify before rendering via dangerouslySetInnerHTML.
 */
export function sanitizeArticleHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'hr',
      'span',
      'div'
    ],
    ALLOWED_ATTR: ['class']
  });
}
