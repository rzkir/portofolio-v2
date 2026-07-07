import {
  createAgentPromptClient,
  DEFAULT_AGENT_CATEGORY,
} from "@/utils/FetchAgent";

export { DEFAULT_AGENT_CATEGORY };

const MAX_HISTORY_ITEMS = 20;

const CODING_TOPIC_PATTERN =
  /\b(code|coding|program|programming|developer|javascript|typescript|python|react|vue|angular|api|function|bug|error|debug|serverless|html|css|sql|git|deploy|compile|syntax|algorithm|frontend|backend|fullstack|astro|node|npm|docker|database|query|component|class|interface|variable|loop|array|object|json|rest|graphql|webpack|vite|tailwind|cloudflare|worker|typescript|java|golang|rust|php|laravel|nextjs|nuxt|express|fastapi|django|flutter|kotlin|swift|regex|refactor|implementasi|optimasi|arsitektur)\b/i;

const CODE_BLOCK_PATTERN = /```([\w+-]*)\n?([\s\S]*?)```/g;

export function isCodingTopic(message: string): boolean {
  return CODING_TOPIC_PATTERN.test(message);
}

export function resolveAgentCategory(message: string): AgentPromptCategory {
  return isCodingTopic(message) ? "programming" : DEFAULT_AGENT_CATEGORY;
}

export function extractCodeBlocks(content: string): AgentCodeBlock[] {
  const blocks: AgentCodeBlock[] = [];
  const pattern = new RegExp(CODE_BLOCK_PATTERN.source, CODE_BLOCK_PATTERN.flags);

  for (const match of content.matchAll(pattern)) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trimEnd(),
    });
  }

  return blocks;
}

const WEB_PREVIEW_TOPIC_PATTERN =
  /\b(html|css|javascript|jsx|tsx|tailwind|landing|website|webpage|navbar|hero|button|card|component|ui|frontend|responsive|markup|web)\b/i;

function normalizeBlockLanguage(language: string): string {
  return language.toLowerCase().replace(/^language-/, "");
}

function isFullHtmlDocument(code: string): boolean {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(code);
}

function looksLikeHtmlFragment(code: string): boolean {
  return /<[a-z][\s\S]*>/i.test(code);
}

function composeWebDocument(parts: {
  html?: string;
  css?: string;
  js?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
    ${parts.css ?? ""}
  </style>
</head>
<body>
  ${parts.html ?? ""}
  <script>${parts.js ?? ""}<\/script>
</body>
</html>`;
}

export function buildWebPreview(content: string): AgentWebPreview | null {
  const blocks = extractCodeBlocks(content);

  if (blocks.length === 0) {
    if (looksLikeHtmlFragment(content)) {
      const document = composeWebDocument({ html: content.trim() });
      return {
        title: "Web Preview",
        language: "html",
        source: content.trim(),
        document,
      };
    }
    return null;
  }

  const htmlBlock = blocks.find((block) =>
    ["html", "htm"].includes(normalizeBlockLanguage(block.language)),
  );
  const cssBlock = blocks.find(
    (block) => normalizeBlockLanguage(block.language) === "css",
  );
  const jsBlock = blocks.find((block) =>
    ["js", "javascript", "jsx", "tsx"].includes(
      normalizeBlockLanguage(block.language),
    ),
  );

  if (htmlBlock && isFullHtmlDocument(htmlBlock.code)) {
    return {
      title: "Web Preview",
      language: "html",
      source: htmlBlock.code,
      document: htmlBlock.code,
    };
  }

  if (htmlBlock || cssBlock || jsBlock) {
    const document = composeWebDocument({
      html: htmlBlock?.code ?? "",
      css: cssBlock?.code ?? "",
      js: jsBlock?.code ?? "",
    });

    const source = [htmlBlock, cssBlock, jsBlock]
      .filter(Boolean)
      .map((block) => `\`\`\`${block!.language}\n${block!.code}\n\`\`\``)
      .join("\n\n");

    return {
      title: "Web Preview",
      language: "html",
      source,
      document,
    };
  }

  const first = blocks[0];
  if (first && looksLikeHtmlFragment(first.code)) {
    const document = composeWebDocument({ html: first.code });
    return {
      title: "Web Preview",
      language: first.language || "html",
      source: first.code,
      document,
    };
  }

  return null;
}

export function isWebCodingTopic(message: string): boolean {
  return isCodingTopic(message) && WEB_PREVIEW_TOPIC_PATTERN.test(message);
}

export function getCanvasPayload(
  content: string,
): AgentCodeBlock | null {
  const preview = buildWebPreview(content);
  if (!preview) return null;

  return {
    language: preview.language,
    code: preview.source,
  };
}

export function shouldShowCanvas(
  message: string,
  category?: AgentPromptCategory,
  content?: string,
): boolean {
  if (!(category === "programming" || isCodingTopic(message))) return false;
  if (content) return buildWebPreview(content) !== null;
  return isWebCodingTopic(message);
}

export function buildPromptHistory(
  messages: AgentChatMessage[],
): AgentHistoryItem[] {
  return messages.slice(-MAX_HISTORY_ITEMS).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function formatAgentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendAgentPrompt(input: {
  message: string;
  history?: AgentHistoryItem[];
  category?: AgentPromptCategory;
  userId?: string;
}): Promise<AgentPromptResponse> {
  const payload: AgentPromptRequest = {
    message: input.message,
    category: input.category ?? DEFAULT_AGENT_CATEGORY,
    history: input.history,
  };

  if (input.userId) {
    payload.user_id = input.userId;
  }

  return createAgentPromptClient(payload);
}
