import { createAgentPromptClient } from "@/utils/FetchAgent";

const CHAT_CATEGORY: AgentPromptCategory = "marketing";
const STORAGE_KEY = "corporate-chat-modal";

interface ChatModalStrings {
  welcome: string;
  clearConfirm: string;
  replyAck: string;
  historyCleared: string;
  system: string;
  you: string;
  justNow: string;
  errorGeneric: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function readHistory(): AgentHistoryItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgentHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(history: AgentHistoryItem[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
}

function renderBotAvatar(): string {
  return `
    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-muted-foreground" aria-hidden="true">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  `;
}

function renderBotMessage(text: string, meta: string): string {
  return `
    <div class="chat-modal__message chat-modal__message--bot flex items-start gap-3">
      ${renderBotAvatar()}
      <div class="max-w-[80%]">
        <div class="rounded-2xl rounded-tl-none border border-border bg-card p-3.5 text-[13.5px] leading-relaxed text-foreground shadow-sm">
          ${escapeHtml(text)}
        </div>
        <span class="mt-1.5 ml-1 block text-[10px] tracking-wider text-muted-foreground uppercase">${escapeHtml(meta)}</span>
      </div>
    </div>
  `;
}

function renderUserMessage(text: string, meta: string): string {
  return `
    <div class="chat-modal__message chat-modal__message--user flex flex-col items-end gap-2">
      <div class="max-w-[80%]">
        <div class="rounded-2xl rounded-tr-none bg-accent p-3.5 text-[13.5px] leading-relaxed text-accent-foreground shadow-sm">
          ${escapeHtml(text)}
        </div>
        <span class="mt-1.5 mr-1 block text-right text-[10px] tracking-wider text-muted-foreground uppercase">${escapeHtml(meta)}</span>
      </div>
    </div>
  `;
}

export function bindChatModal(root: ParentNode = document) {
  const widget = root.querySelector<HTMLElement>("[data-chat-modal]");
  if (!widget || widget.dataset.bound === "true") return;

  const strings = JSON.parse(
    widget.dataset.chatStrings ?? "{}",
  ) as ChatModalStrings;

  const modal = widget.querySelector<HTMLElement>("[data-chat-panel]");
  const fab = widget.querySelector<HTMLButtonElement>("[data-chat-fab]");
  const closeBtn = widget.querySelector<HTMLButtonElement>("[data-chat-close]");
  const menuBtn = widget.querySelector<HTMLButtonElement>("[data-chat-menu-btn]");
  const menu = widget.querySelector<HTMLElement>("[data-chat-menu]");
  const clearBtn = widget.querySelector<HTMLButtonElement>("[data-chat-clear]");
  const form = widget.querySelector<HTMLFormElement>("[data-chat-form]");
  const input = widget.querySelector<HTMLTextAreaElement>("[data-chat-input]");
  const sendBtn = widget.querySelector<HTMLButtonElement>("[data-chat-send]");
  const messageArea = widget.querySelector<HTMLElement>("[data-chat-messages]");
  const typingIndicator = widget.querySelector<HTMLElement>("[data-chat-typing]");
  const quickReplies = widget.querySelectorAll<HTMLButtonElement>("[data-chat-quick]");

  if (
    !modal ||
    !fab ||
    !closeBtn ||
    !menuBtn ||
    !menu ||
    !clearBtn ||
    !form ||
    !input ||
    !sendBtn ||
    !messageArea ||
    !typingIndicator
  ) {
    return;
  }

  widget.dataset.bound = "true";

  let isOpen = false;
  let isSubmitting = false;
  let history = readHistory();

  function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
  }

  function setOpen(next: boolean) {
    isOpen = next;
    fab.setAttribute("aria-expanded", next ? "true" : "false");

    if (next) {
      modal.hidden = false;
      modal.classList.remove("chat-modal__panel--hidden");
      modal.classList.add("chat-modal__panel--visible");
      input.focus();
    } else {
      modal.classList.remove("chat-modal__panel--visible");
      modal.classList.add("chat-modal__panel--hidden");
      window.setTimeout(() => {
        if (!isOpen) modal.hidden = true;
      }, 300);
      menu.classList.add("hidden");
    }
  }

  function appendMessage(text: string, isUser: boolean, meta?: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = isUser
      ? renderUserMessage(text, meta ?? strings.justNow)
      : renderBotMessage(text, meta ?? `${strings.system} • ${formatTime()}`);
    const node = wrapper.firstElementChild;
    if (!node) return;
    messageArea.insertBefore(node, typingIndicator);
    scrollToBottom();
  }

  function renderWelcome() {
    messageArea
      .querySelectorAll(".chat-modal__message")
      .forEach((node) => node.remove());
    appendMessage(strings.welcome, false, `${strings.system} • ${formatTime()}`);
  }

  if (history.length === 0) {
    renderWelcome();
  } else {
    history.forEach((item) => {
      appendMessage(item.content, item.role === "user", strings.justNow);
    });
  }

  fab.addEventListener("click", () => setOpen(!isOpen));
  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(false);
  });

  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => menu.classList.add("hidden"));

  clearBtn.addEventListener("click", () => {
    if (!confirm(strings.clearConfirm)) return;
    history = [];
    writeHistory([]);
    renderWelcome();
    appendMessage(strings.historyCleared, false, strings.system);
    menu.classList.add("hidden");
  });

  async function handleSend(message: string) {
    const value = message.trim();
    if (!value || isSubmitting) return;

    isSubmitting = true;
    sendBtn.disabled = true;
    input.disabled = true;

    appendMessage(value, true);
    history.push({ role: "user", content: value });
    writeHistory(history);
    input.value = "";

    typingIndicator.classList.remove("hidden");
    scrollToBottom();

    try {
      const response = await createAgentPromptClient({
        message: value,
        category: CHAT_CATEGORY,
        history: history.slice(0, -1),
      });

      typingIndicator.classList.add("hidden");
      appendMessage(response.reply || strings.replyAck, false);
      history.push({ role: "assistant", content: response.reply || strings.replyAck });
      writeHistory(history);
    } catch {
      typingIndicator.classList.add("hidden");
      appendMessage(strings.errorGeneric, false, strings.system);
    } finally {
      isSubmitting = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleSend(input.value);
  });

  quickReplies.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.chatQuick;
      if (action === "pricing") {
        window.location.href = "/layanan";
        return;
      }
      void handleSend(button.textContent?.trim() ?? "");
    });
  });
}

let chatModalListenersReady = false;

export function initChatModal() {
  const run = () => bindChatModal();

  if (!chatModalListenersReady) {
    chatModalListenersReady = true;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }

    document.addEventListener("astro:page-load", run);
    return;
  }

  run();
}
