function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInline(text: string): string {
  let result = escapeHtml(text);

  result = result.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>",
  );

  return result;
}

function formatBlock(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        `<h${level} class="agent-message-heading">${formatInline(heading[2])}</h${level}>`,
      );
      index += 1;
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      blocks.push('<hr class="agent-message-divider">');
      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(
          `<li>${formatInline(lines[index].replace(/^[-*+]\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(
          `<li>${formatInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^(#{1,6}\s|[-*+]\s|\d+\.\s|```)/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push(
      `<p>${paragraph.map((entry) => formatInline(entry)).join("<br>")}</p>`,
    );
  }

  return blocks.join("");
}

export function formatAgentUserMessageHtml(content: string): string {
  return escapeHtml(content);
}

export function formatAgentMessageHtml(content: string): string {
  const parts = content.split(/(```[\w+-]*\n[\s\S]*?```)/g);

  return parts
    .map((part) => {
      const codeMatch = part.match(/^```([\w+-]*)\n([\s\S]*?)```$/);
      if (!codeMatch) return formatBlock(part);

      const code = escapeHtml(codeMatch[2].trimEnd());
      return `<pre class="agent-message-code"><code>${code}</code></pre>`;
    })
    .join("");
}
