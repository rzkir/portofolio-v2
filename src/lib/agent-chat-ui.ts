import { formatAgentTime } from "@/service/agent.service";
import { formatAgentMessageHtml } from "@/lib/agent-message";
import { getAgentStudioClient } from "@/lib/agent-i18n.client";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getAgentCommonStrings() {
  return getAgentStudioClient().common;
}

export function renderAgentUserMessage(message: AgentChatMessage): HTMLElement {
  const { sentAt } = getAgentCommonStrings();
  const block = document.createElement("div");
  block.className = "agent-message-reveal flex flex-col items-end space-y-4";
  block.dataset.messageRole = "user";
  block.dataset.messageId = message.id;
  block.innerHTML = `
    <div class="agent-user-bubble max-w-2xl rounded-3xl rounded-tr-none p-6 leading-relaxed text-foreground/90 shadow-2xl">
      <p class="whitespace-pre-wrap">${escapeHtml(message.content)}</p>
    </div>
    <div class="flex items-center gap-3 opacity-20">
      <span class="font-mono text-[10px] font-bold tracking-widest uppercase">
        ${sentAt.replace("{time}", formatAgentTime(message.sentAt))}
      </span>
    </div>
  `;
  return block;
}

export function renderAgentAssistantMessage(
  message: AgentChatMessage,
): HTMLElement {
  const { inferenceComplete, copy } = getAgentCommonStrings();
  const block = document.createElement("div");
  block.className = "agent-message-reveal flex flex-col items-start space-y-6";
  block.dataset.messageRole = "assistant";
  block.dataset.messageId = message.id;
  block.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="flex size-8 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-accent-foreground" aria-hidden="true">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
      </div>
      <span class="font-mono text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
        ${inferenceComplete}${message.model ? ` · ${escapeHtml(message.model)}` : ""}
      </span>
    </div>
    <div class="agent-ai-bubble max-w-3xl rounded-[40px] rounded-tl-none p-8 shadow-2xl shadow-accent/20">
      <div class="agent-message-content text-lg leading-relaxed">${formatAgentMessageHtml(message.content)}</div>
    </div>
    <div class="flex gap-6 px-4">
      <button type="button" class="agent-copy-btn flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-30 transition-opacity hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
        ${copy}
      </button>
    </div>
  `;

  block.querySelector(".agent-copy-btn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // ignore clipboard errors
    }
  });

  return block;
}

export function renderAgentLoading(): HTMLElement {
  const { processing } = getAgentCommonStrings();
  const block = document.createElement("div");
  block.id = "agent-loading";
  block.className = "agent-message-reveal flex flex-col items-start space-y-4";
  block.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="flex size-8 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-4 animate-spin text-accent-foreground" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <span class="font-mono text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
        ${processing}
      </span>
    </div>
  `;
  return block;
}

export function getAgentErrorMessage(error: unknown): string {
  const { errorGeneric } = getAgentCommonStrings();
  return error instanceof Error ? error.message : errorGeneric;
}

export async function copyAgentCode(
  content: string,
  trigger?: HTMLButtonElement,
): Promise<void> {
  if (!content) return;

  const { copy, copied } = getAgentCommonStrings();

  try {
    await navigator.clipboard.writeText(content);
    if (!trigger) return;

    const label = trigger.querySelector<HTMLElement>("[data-code-copy-label]");
    trigger.classList.add("is-copied");
    if (label) label.textContent = copied;

    window.setTimeout(() => {
      trigger.classList.remove("is-copied");
      if (label) label.textContent = copy;
    }, 1600);
  } catch {
    // ignore clipboard errors
  }
}
