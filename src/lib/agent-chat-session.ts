import { createAgentChatHistoryController } from "@/service/agent/chat-history.controller";

type MessageRenderer = (message: AgentChatMessage) => HTMLElement;

export interface AgentChatSessionOptions {
  storageKey: string;
  defaultCategory: AgentPromptCategory;
  chatMessages: AgentChatMessage[];
  getSessionCategory: () => AgentPromptCategory | null;
  setSessionCategory: (category: AgentPromptCategory | null) => void;
  categoryInput: HTMLInputElement | null;
  thread: HTMLElement | null;
  emptyState: HTMLElement | null;
  errorEl: HTMLElement | null;
  renderUserMessage: MessageRenderer;
  renderAssistantMessage: MessageRenderer;
  appendMessageNode: (node: HTMLElement) => void;
  appendDivider: () => HTMLElement | null;
  scrollToBottom: () => void;
  focusInput: () => void;
  onClear?: () => void;
  restoreCanvas?: () => void;
}

export function setupAgentChatSession(options: AgentChatSessionOptions) {
  const {
    storageKey,
    defaultCategory,
    chatMessages,
    getSessionCategory,
    setSessionCategory,
    categoryInput,
    thread,
    emptyState,
    errorEl,
    renderUserMessage,
    renderAssistantMessage,
    appendMessageNode,
    appendDivider,
    scrollToBottom,
    focusInput,
    onClear,
    restoreCanvas,
  } = options;

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function clearThreadUi() {
    if (!thread) return;

    thread
      .querySelectorAll(
        "[data-message-role], [data-message-divider], #agent-loading",
      )
      .forEach((node) => node.remove());
    emptyState?.classList.remove("hidden");
    onClear?.();
    clearError();
  }

  function renderStoredMessages() {
    if (chatMessages.length === 0) return;

    chatMessages.forEach((message, index) => {
      if (message.role === "user") {
        appendMessageNode(renderUserMessage(message));
        const next = chatMessages[index + 1];
        if (next?.role === "assistant") {
          appendDivider();
        }
        return;
      }

      if (message.role === "assistant") {
        appendMessageNode(renderAssistantMessage(message));
      }
    });

    restoreCanvas?.();
  }

  const chatHistory = createAgentChatHistoryController({
    storageKey,
    defaultCategory,
    chatMessages,
    getSessionCategory,
    setSessionCategory,
    setCategoryInputValue: (category) => {
      if (categoryInput) categoryInput.value = category;
    },
    clearThreadUi,
    renderStoredMessages,
    scrollToBottom,
    focusInput,
  });

  return {
    persist: () => chatHistory.persist(),
    bind: () => chatHistory.bind(),
    renderStoredMessages,
    getThreadId: () => chatHistory.threadId,
  };
}
