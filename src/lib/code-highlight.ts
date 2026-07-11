export type CodeHighlightLanguage = "html" | "css" | "javascript" | "text";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrap(className: string, value: string): string {
  return `<span class="tok-${className}">${value}</span>`;
}

function highlightHtml(code: string): string {
  return code
    .replace(
      /(&lt;!--[\s\S]*?--&gt;)/g,
      (match) => wrap("comment", match),
    )
    .replace(
      /(&lt;\/?)([\w-]+)/g,
      (_match, open, tag) => `${wrap("tag-bracket", open)}${wrap("tag", tag)}`,
    )
    .replace(
      /([\w-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      (_match, attr, eq, value) =>
        `${wrap("attr", attr)}${wrap("punct", eq)}${wrap("string", value)}`,
    )
    .replace(
      /(&gt;[^&lt;]+&lt;\/[\w-]+&gt;)/g,
      (match) => wrap("text", match),
    );
}

function highlightCss(code: string): string {
  return code
    .replace(/(\/\*[\s\S]*?\*\/)/g, (match) => wrap("comment", match))
    .replace(
      /([.#][\w-]+(?:\[[^\]]+\])?(?:[\w.#\[\]:,\s>-]*))/g,
      (match) => wrap("selector", match),
    )
    .replace(
      /([\w-]+)(\s*)(:)/g,
      (_match, prop, space, colon) =>
        `${wrap("property", prop)}${space}${wrap("punct", colon)}`,
    )
    .replace(
      /(:\s*)(#[\da-fA-F]{3,8}|\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%)?)/g,
      (_match, prefix, value) => `${prefix}${wrap("number", value)}`,
    )
    .replace(
      /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      (match) => wrap("string", match),
    )
    .replace(
      /\b(@[\w-]+|!important)\b/g,
      (match) => wrap("keyword", match),
    );
}

const JS_KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|super|static|yield|document|window|console)\b/g;

function highlightJavaScript(code: string): string {
  return code
    .replace(/(\/\/[^\n]*)/g, (match) => wrap("comment", match))
    .replace(/(\/\*[\s\S]*?\*\/)/g, (match) => wrap("comment", match))
    .replace(
      /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*?`)/g,
      (match) => wrap("string", match),
    )
    .replace(
      /\b(\d+(?:\.\d+)?)\b/g,
      (match) => wrap("number", match),
    )
    .replace(JS_KEYWORDS, (match) => wrap("keyword", match))
    .replace(
      /\b([A-Z][\w$]*)\b/g,
      (match) => wrap("type", match),
    )
    .replace(
      /\b([a-z_$][\w$]*)(?=\s*\()/gi,
      (match) => wrap("function", match),
    );
}

export function toHighlightLanguage(
  fileId: "html" | "css" | "js",
): CodeHighlightLanguage {
  if (fileId === "css") return "css";
  if (fileId === "js") return "javascript";
  return "html";
}

export function highlightCode(
  code: string,
  language: CodeHighlightLanguage,
): string {
  const escaped = escapeHtml(code);
  if (!escaped.trim()) return " ";

  switch (language) {
    case "html":
      return highlightHtml(escaped);
    case "css":
      return highlightCss(escaped);
    case "javascript":
      return highlightJavaScript(escaped);
    default:
      return escaped;
  }
}
