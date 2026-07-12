import {
  createAgentChatThread,
  getAgentChatThread,
  initializeAgentChatState,
  saveAgentChatSession,
  setActiveAgentChatThreadId,
} from "@/lib/storage";
import { notifyAgentHistoryUpdated } from "@/service/agent/history.service";

interface AgentChatHistoryController {
  threadId: string;
  sessionCategory: AgentPromptCategory | null;
  persist: () => void;
  loadThread: (threadId: string) => void;
  startNewChat: () => void;
  bind: () => () => void;
}

interface AgentChatHistoryOptions {
  storageKey: string;
  defaultCategory: AgentPromptCategory;
  chatMessages: AgentChatMessage[];
  getSessionCategory: () => AgentPromptCategory | null;
  setSessionCategory: (category: AgentPromptCategory | null) => void;
  setCategoryInputValue: (category: AgentPromptCategory) => void;
  clearThreadUi: () => void;
  renderStoredMessages: () => void;
  scrollToBottom: () => void;
  focusInput: () => void;
}

export function createAgentChatHistoryController(
  options: AgentChatHistoryOptions,
): AgentChatHistoryController {
  const {
    storageKey,
    defaultCategory,
    chatMessages,
    getSessionCategory,
    setSessionCategory,
    setCategoryInputValue,
    clearThreadUi,
    renderStoredMessages,
    scrollToBottom,
    focusInput,
  } = options;

  const initialState = initializeAgentChatState(storageKey, defaultCategory);
  let threadId = initialState.threadId;

  chatMessages.push(...initialState.messages);
  setSessionCategory(initialState.sessionCategory ?? defaultCategory);
  setCategoryInputValue(getSessionCategory() ?? defaultCategory);

  function persist() {
    saveAgentChatSession(storageKey, chatMessages, getSessionCategory());
    notifyAgentHistoryUpdated(storageKey);
  }

  function loadThread(nextThreadId: string) {
    const storedThread = getAgentChatThread(storageKey, nextThreadId);
    if (!storedThread) return;

    threadId = nextThreadId;
    setActiveAgentChatThreadId(storageKey, nextThreadId);
    chatMessages.length = 0;
    chatMessages.push(...storedThread.messages);
    setSessionCategory(storedThread.sessionCategory ?? defaultCategory);
    setCategoryInputValue(getSessionCategory() ?? defaultCategory);
    clearThreadUi();
    renderStoredMessages();
    notifyAgentHistoryUpdated(storageKey);
    scrollToBottom();
  }

  function resetAfterDeletedThread() {
    chatMessages.length = 0;
    clearThreadUi();

    const thread = createAgentChatThread(
      storageKey,
      getSessionCategory() ?? defaultCategory,
    );
    threadId = thread.id;
    setSessionCategory(thread.sessionCategory ?? defaultCategory);
    setCategoryInputValue(getSessionCategory() ?? defaultCategory);
    notifyAgentHistoryUpdated(storageKey);
    focusInput();
  }

  function startNewChat() {
    if (chatMessages.length === 0) {
      focusInput();
      return;
    }

    const thread = createAgentChatThread(storageKey, getSessionCategory());
    threadId = thread.id;
    chatMessages.length = 0;
    setSessionCategory(thread.sessionCategory ?? defaultCategory);
    setCategoryInputValue(getSessionCategory() ?? defaultCategory);
    clearThreadUi();
    notifyAgentHistoryUpdated(storageKey);
    focusInput();
  }

  function handleThreadDeleted(nextActiveId: string | null) {
    if (nextActiveId && getAgentChatThread(storageKey, nextActiveId)) {
      loadThread(nextActiveId);
      return;
    }

    resetAfterDeletedThread();
  }

  function bind() {
    const onHistoryNew = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
      if (detail?.storageKey !== storageKey) return;
      startNewChat();
    };

    const onHistorySelect = (event: Event) => {
      const detail = (
        event as CustomEvent<{ storageKey?: string; threadId?: string }>
      ).detail;
      if (detail?.storageKey !== storageKey || !detail.threadId) return;
      loadThread(detail.threadId);
    };

    const onHistoryDelete = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          storageKey?: string;
          nextActiveId?: string | null;
        }>
      ).detail;
      if (detail?.storageKey !== storageKey) return;
      handleThreadDeleted(detail.nextActiveId ?? null);
    };

    document.addEventListener("agent-history:new", onHistoryNew);
    document.addEventListener("agent-history:select", onHistorySelect);
    document.addEventListener("agent-history:delete", onHistoryDelete);

    notifyAgentHistoryUpdated(storageKey);

    return () => {
      document.removeEventListener("agent-history:new", onHistoryNew);
      document.removeEventListener("agent-history:select", onHistorySelect);
      document.removeEventListener("agent-history:delete", onHistoryDelete);
    };
  }

  return {
    get threadId() {
      return threadId;
    },
    get sessionCategory() {
      return getSessionCategory();
    },
    persist,
    loadThread,
    startNewChat,
    bind,
  };
}
