function stripInvisibleMarkup(html: string): string {
  return html
    .replace(/<span[^>]*class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPlainInner(inner: string): boolean {
  const stripped = inner
    .replace(/<span[^>]*class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, "")
    .trim();

  return !/<[a-z][\s\S]*?>/i.test(stripped);
}

const COMMAND_PATTERN =
  /^(rizki\s+[\w-]+(?:\s+[\w-]+)?|cd\s+\S+|npm\s+[\w./-]+(?:\s+[\w./-]+)?|yarn\s+\S+|pnpm\s+\S+|npx\s+\S+|git\s+\S+)$/i;

function isCommandText(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 120) return false;
  return COMMAND_PATTERN.test(value);
}

/** Remove paragraphs with no visible text (e.g. empty `<p></p>` from Quill). */
export function sanitizeContentHtml(html: string): string {
  return html
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (match, inner: string) =>
      stripInvisibleMarkup(inner) ? match : "",
    )
    .trim();
}

/** Turn plain CLI lines into semantic markup for styling. */
export function enhanceContentHtml(html: string): string {
  return html
    .replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (match, _attrs, inner: string) => {
      const text = stripInvisibleMarkup(inner);
      if (!text) return "";

      if (isPlainInner(inner) && isCommandText(text)) {
        return `<pre class="prose-editorial__code"><code>${escapeHtml(text)}</code></pre>`;
      }

      return match;
    })
    .trim();
}

export function prepareContentHtml(html: string): string {
  return enhanceContentHtml(sanitizeContentHtml(html));
}
