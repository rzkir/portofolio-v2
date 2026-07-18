import { createAgentPromptClient } from "@/utils/FetchAgent";
import { formatAgentMessageHtml } from "@/lib/agent-message";
import {
  playNotificationSound,
  unlockNotificationAudio,
} from "@/service/settings.service";

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

function createMessageNode(
  text: string,
  isUser: boolean,
  meta: string,
): HTMLElement {
  const root = document.createElement("div");
  root.className = `chat-modal__message chat-modal__message--${isUser ? "user" : "bot"}`;

  const bubble = document.createElement("div");
  bubble.className = isUser
    ? "chat-modal__bubble chat-modal__bubble--user"
    : "chat-modal__bubble chat-modal__bubble--ai agent-message-content";

  if (isUser) {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = formatAgentMessageHtml(text);
  }

  const metaEl = document.createElement("span");
  metaEl.className = "chat-modal__meta";
  metaEl.textContent = meta;

  root.append(bubble, metaEl);
  return root;
}

function resetChatInput(input: HTMLTextAreaElement) {
  input.value = "";
  input.style.height = "";
  input.style.overflowY = "hidden";
  input.dispatchEvent(new Event("input", { bubbles: true }));
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
  const sendBtn = widget.querySelector<HTMLButtonElement>(
    "#chat-modal-input-send",
  );
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
      unlockNotificationAudio();
      modal.hidden = false;
      backdrop.hidden = false;
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
    const node = createMessageNode(
      text,
      isUser,
      meta ??
        (isUser
          ? strings.justNow
          : `${strings.system} • ${formatTime()}`),
    );
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

    unlockNotificationAudio();

    isSubmitting = true;
    sendBtn.disabled = true;
    input.disabled = true;

    appendMessage(value, true);
    history.push({ role: "user", content: value });
    writeHistory(history);
    resetChatInput(input);

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
      playNotificationSound();
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
