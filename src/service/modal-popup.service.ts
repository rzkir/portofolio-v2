import { createAgentPromptClient } from "@/utils/FetchAgent";
import { formatAgentMessageHtml } from "@/lib/agent-message";

const CHAT_CATEGORY: AgentPromptCategory = "customers_services";
const STORAGE_KEY = "corporate-chat-modal";
const PANEL_CLOSE_MS = 300;

interface ChatModalStrings {
  welcome: string;
  clearConfirm: string;
  replyAck: string;
  historyCleared: string;
  system: string;
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

function renderBotMessage(text: string, meta: string): string {
  return `
    <div class="chat-modal__message chat-modal__message--bot">
      <div class="chat-modal__bubble chat-modal__bubble--ai agent-message-content">
        ${formatAgentMessageHtml(text)}
      </div>
      <span class="chat-modal__meta">${escapeHtml(meta)}</span>
    </div>
  `;
}

function renderUserMessage(text: string, meta: string): string {
  return `
    <div class="chat-modal__message chat-modal__message--user">
      <div class="chat-modal__bubble chat-modal__bubble--user">
        ${escapeHtml(text)}
      </div>
      <span class="chat-modal__meta">${escapeHtml(meta)}</span>
    </div>
  `;
}

function bindChatModal(root: ParentNode = document) {
  const widget = root.querySelector<HTMLElement>("[data-chat-modal]");
  if (!widget || widget.dataset.bound === "true") return;

  const strings = JSON.parse(
    widget.dataset.chatStrings ?? "{}",
  ) as ChatModalStrings;

  const modal = widget.querySelector<HTMLElement>("[data-chat-panel]");
  const backdrop = widget.querySelector<HTMLElement>("[data-chat-backdrop]");
  const fab = widget.querySelector<HTMLButtonElement>("[data-chat-fab]");
  const closeBtn = widget.querySelector<HTMLButtonElement>("[data-chat-close]");
  const clearBtn = widget.querySelector<HTMLButtonElement>("[data-chat-clear]");
  const form = widget.querySelector<HTMLFormElement>("[data-chat-form]");
  const input = widget.querySelector<HTMLTextAreaElement>("#chat-modal-input");
  const sendBtn = widget.querySelector<HTMLButtonElement>("#chat-modal-input-send");
  const messageArea = widget.querySelector<HTMLElement>("[data-chat-messages]");
  const typingIndicator =
    widget.querySelector<HTMLElement>("[data-chat-typing]");
  const quickReplies =
    widget.querySelectorAll<HTMLButtonElement>("[data-chat-quick]");

  if (
    !modal ||
    !backdrop ||
    !fab ||
    !closeBtn ||
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

  const scrollToBottom = () => {
    messageArea.scrollTop = messageArea.scrollHeight;
  };

  const setOpen = (next: boolean) => {
    isOpen = next;
    fab.setAttribute("aria-expanded", String(next));
    document.body.classList.toggle("overflow-hidden", next);

    if (next) {
      modal.hidden = false;
      backdrop.hidden = false;
      // Opening click (and mobile ghost-clicks) can land on the backdrop
      // after the FAB leaves hit-testing — ignore those briefly.
      backdrop.style.pointerEvents = "none";
      void modal.offsetWidth;
      widget.classList.add("chat-modal--open");
      fab.hidden = true;
      window.setTimeout(() => {
        if (isOpen) backdrop.style.pointerEvents = "";
      }, 350);
      input.focus();
      return;
    }

    widget.classList.remove("chat-modal--open");
    fab.hidden = false;
    backdrop.style.pointerEvents = "";
    window.setTimeout(() => {
      if (!isOpen) {
        modal.hidden = true;
        backdrop.hidden = true;
      }
    }, PANEL_CLOSE_MS);
  };

  const appendMessage = (text: string, isUser: boolean, meta?: string) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = isUser
      ? renderUserMessage(text, meta ?? strings.justNow)
      : renderBotMessage(
          text,
          meta ?? `${strings.system} • ${formatTime()}`,
        );
    const node = wrapper.firstElementChild;
    if (!node) return;
    messageArea.insertBefore(node, typingIndicator);
    scrollToBottom();
  };

  const renderWelcome = () => {
    messageArea
      .querySelectorAll(".chat-modal__message")
      .forEach((node) => node.remove());
    appendMessage(
      strings.welcome,
      false,
      `${strings.system} • ${formatTime()}`,
    );
  };

  try {
    if (history.length === 0) {
      renderWelcome();
    } else {
      history.forEach((item) => {
        appendMessage(item.content, item.role === "user", strings.justNow);
      });
    }
  } catch {
    renderWelcome();
  }

  fab.addEventListener("click", () => setOpen(!isOpen));
  closeBtn.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) setOpen(false);
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm(strings.clearConfirm)) return;
    history = [];
    writeHistory([]);
    renderWelcome();
    appendMessage(strings.historyCleared, false, strings.system);
  });

  const handleSend = async (message: string) => {
    const value = message.trim();
    if (!value || isSubmitting) return;

    isSubmitting = true;
    sendBtn.disabled = true;
    input.disabled = true;

    appendMessage(value, true);
    history.push({ role: "user", content: value });
    writeHistory(history);
    input.value = "";
    input.dispatchEvent(new Event("input"));
    input.style.height = "";
    input.style.overflowY = "hidden";

    typingIndicator.classList.remove("hidden");
    scrollToBottom();

    try {
      const response = await createAgentPromptClient({
        message: value,
        category: CHAT_CATEGORY,
        history: history.slice(0, -1),
      });

      const reply = response.reply || strings.replyAck;
      typingIndicator.classList.add("hidden");
      appendMessage(reply, false);
      history.push({ role: "assistant", content: reply });
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
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleSend(input.value);
  });

  quickReplies.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.chatQuick === "pricing") {
        window.location.href = "/layanan";
        return;
      }
      void handleSend(button.textContent?.trim() ?? "");
    });
  });
}

let cleanupBound = false;

export function initChatModal() {
  if (!cleanupBound) {
    cleanupBound = true;
    document.addEventListener("astro:before-preparation", () => {
      document.body.classList.remove("overflow-hidden");
    });
  }

  bindChatModal();
}
