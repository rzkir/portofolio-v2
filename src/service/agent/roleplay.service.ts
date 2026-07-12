import {
  buildPromptHistory,
  buildWebPreview,
  resolveCanvasPreviewFromMessages,
  sendAgentPrompt,
  shouldShowCanvas,
} from "@/service/agent.service";
import { bindUiTabs, setUiTab } from "@/lib/ui-tabs";
import { highlightCode, toHighlightLanguage } from "@/lib/code-highlight";
import {
  hideAgentCanvasDetailsLink,
  notifyAgentCanvasOpen,
  syncAgentCanvasDetailsLink,
} from "@/service/agent/canvas-panel.service";
import { setAgentBusy } from "@/lib/agent-busy";
import { createAgentChatHistoryController } from "@/service/agent/chat-history.controller";
import {
  getAgentErrorMessage,
  renderAgentAssistantMessage,
  renderAgentLoading,
  renderAgentUserMessage,
} from "@/lib/agent-chat-ui";
import { copyAgentCode } from "@/lib/agent-chat-ui";

const CHAT_STORAGE_KEY = "studio";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createRoleplayAgentController(root: ParentNode): () => void {
  const defaultCategory: AgentPromptCategory = "roleplay";
  const form = root.querySelector<HTMLFormElement>("#agent-prompt-form");
  const input = root.querySelector<HTMLInputElement>("#main-prompt-input");
  const sendBtn = root.querySelector<HTMLButtonElement>("#main-prompt-input-send");
  const main = root.querySelector<HTMLElement>("#agent-main");
  const canvas = root.querySelector<HTMLElement>("#agent-canvas");
  const canvasFrame = root.querySelector<HTMLIFrameElement>("#agent-canvas-frame");
  const canvasCodeTabs = root.querySelector<HTMLElement>("#agent-canvas-code-tabs");
  const canvasLang = root.querySelector<HTMLElement>("#agent-canvas-language");
  const canvasClose = root.querySelector<HTMLElement>("#agent-canvas-close");
  const canvasCopy = root.querySelector<HTMLElement>("#agent-canvas-copy");
  const canvasRefresh = root.querySelector<HTMLElement>("#agent-canvas-refresh");
  const canvasDetails = root.querySelector<HTMLAnchorElement>("#agent-canvas-details");
  const canvasCodeCopy = root.querySelector<HTMLButtonElement>(
    "#agent-canvas-code-copy",
  );
  const canvasTabs = root.querySelector<HTMLElement>("#agent-canvas-tabs");
  const previewDialog = root.querySelector<HTMLDialogElement>("#agent-preview-dialog");
  const previewDialogFrame = root.querySelector<HTMLIFrameElement>(
    "#agent-preview-dialog-frame",
  );
  const previewDialogLang = root.querySelector<HTMLElement>(
    "#agent-preview-dialog-language",
  );
  const categoryInput = form?.elements.namedItem("category") as
    | HTMLInputElement
    | null;
  const thread = root.querySelector<HTMLElement>("#agent-thread");
  const messagesViewport = root.querySelector<HTMLElement>("#agent-messages");
  const emptyState = root.querySelector<HTMLElement>("#agent-empty-state");
  const errorEl = root.querySelector<HTMLElement>("#agent-error");

  const chatMessages: AgentChatMessage[] = [];
  let isSubmitting = false;
  let sessionCategory: AgentPromptCategory | null = defaultCategory;
  let currentCanvasCode = "";
  let currentPreviewDocument = "";
  let currentFiles: AgentWebPreviewFiles = { html: "", css: "", js: "" };
  let activeCodeFile: keyof AgentWebPreviewFiles = "html";
  let currentBuildId: string | null = null;
  let getActiveThreadId: () => string = () => "";

  function renderCodePanel(
    panel: HTMLElement | null,
    code: string,
    fileId: keyof AgentWebPreviewFiles,
  ) {
    if (!panel) return;

    const codeEl = panel.querySelector("code");
    const gutter = panel.querySelector(".agent-code-editor__gutter");
    const value = code;

    if (codeEl) {
      codeEl.innerHTML = highlightCode(value, toHighlightLanguage(fileId));
    }
    if (gutter) {
      const lineCount = Math.max(1, value ? value.split("\n").length : 1);
      gutter.textContent = Array.from({ length: lineCount }, (_, index) =>
        String(index + 1),
      ).join("\n");
    }
  }

  function renderCodeFiles(files: AgentWebPreviewFiles) {
    currentFiles = files;
    if (!canvasCodeTabs) return;

    const entries: Array<{
      id: keyof AgentWebPreviewFiles;
      content: string;
    }> = [
      { id: "html", content: files.html },
      { id: "css", content: files.css },
      { id: "js", content: files.js },
    ];

    let firstVisible: keyof AgentWebPreviewFiles | null = null;

    entries.forEach(({ id, content }) => {
      const trigger = canvasCodeTabs.querySelector<HTMLElement>(
        `[data-tab-trigger="${id}"]`,
      );
      const panel = canvasCodeTabs.querySelector<HTMLElement>(
        `[data-tab-panel="${id}"]`,
      );
      const hasContent = content.trim().length > 0;

      trigger?.classList.toggle("is-hidden", !hasContent);

      if (!hasContent) {
        panel?.classList.add("ui-tabs__panel--hidden");
        panel?.setAttribute("hidden", "");
        return;
      }

      if (!firstVisible) firstVisible = id;
      panel?.classList.remove("ui-tabs__panel--hidden");
      panel?.removeAttribute("hidden");
      renderCodePanel(panel, content, id);
    });

    if (firstVisible) {
      setUiTab(canvasCodeTabs, firstVisible);
      activeCodeFile = firstVisible;
    }
  }

  function scrollToBottom() {
    if (!messagesViewport) return;
    messagesViewport.scrollTop = messagesViewport.scrollHeight;
  }

  function setLoading(loading: boolean) {
    isSubmitting = loading;
    setAgentBusy(loading);
    if (input) input.disabled = loading;
    if (sendBtn) sendBtn.disabled = loading;
  }

  function showError(message: string) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function applyCategoryPreset(category: AgentPromptCategory, prompt: string) {
    sessionCategory = category;
    if (categoryInput) categoryInput.value = category;
    if (!input) return;

    input.value = prompt;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    clearError();
  }

  function onCategoryCardClick(event: Event) {
    const trigger = event.currentTarget as HTMLButtonElement | null;
    if (!trigger) return;

    const category = trigger.dataset.agentCategory as
      | AgentPromptCategory
      | undefined;
    const prompt = trigger.dataset.agentPrompt?.trim();
    if (!category || !prompt) return;

    applyCategoryPreset(category, prompt);
  }

  function syncPreviewFrames() {
    if (canvasFrame && currentPreviewDocument) {
      canvasFrame.srcdoc = currentPreviewDocument;
    }
    if (previewDialogFrame && currentPreviewDocument) {
      previewDialogFrame.srcdoc = currentPreviewDocument;
    }
  }

  function renderPreview(preview: AgentWebPreview) {
    currentCanvasCode = preview.source;
    currentPreviewDocument = preview.document;
    renderCodeFiles(preview.files);
    if (canvasLang) canvasLang.textContent = preview.language || "live";
    if (previewDialogLang) {
      previewDialogLang.textContent = preview.language || "live";
    }
    syncPreviewFrames();
  }

  function openCanvas(
    preview: AgentWebPreview,
    meta?: {
      prompt: string;
      category: AgentPromptCategory;
      model?: string;
    },
  ) {
    renderPreview(preview);
    if (canvasTabs) setUiTab(canvasTabs, "preview");
    canvas?.classList.add("is-open");
    canvas?.setAttribute("aria-hidden", "false");
    main?.classList.add("agent-main--with-canvas");
    notifyAgentCanvasOpen();
    currentBuildId =
      syncAgentCanvasDetailsLink(
        canvasDetails,
        preview,
        chatMessages,
        sessionCategory ?? defaultCategory,
        meta,
        {
          buildId: currentBuildId,
          threadId: getActiveThreadId(),
        },
      ) ?? currentBuildId;
  }

  function closeCanvas() {
    canvas?.classList.remove("is-open");
    canvas?.setAttribute("aria-hidden", "true");
    main?.classList.remove("agent-main--with-canvas");
    if (canvasTabs) setUiTab(canvasTabs, "preview");
    if (canvasFrame) canvasFrame.srcdoc = "";
    if (previewDialogFrame) previewDialogFrame.srcdoc = "";
    if (previewDialog?.open) previewDialog.close();
    currentCanvasCode = "";
    currentPreviewDocument = "";
    currentFiles = { html: "", css: "", js: "" };
    activeCodeFile = "html";
    hideAgentCanvasDetailsLink(canvasDetails);
  }

  function onCanvasDetailsClick(event: MouseEvent) {
    if (!canvasDetails) return;

    const href = canvasDetails.getAttribute("href");
    if (!href || href === "#") {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const onCanvasClose = () => closeCanvas();

  function onCanvasRefresh() {
    if (!currentPreviewDocument) return;
    syncPreviewFrames();
  }

  function onPreviewDialogToggle() {
    if (!previewDialog?.open || !currentPreviewDocument) return;
    syncPreviewFrames();
  }

  async function copyActiveCodeFile(trigger?: HTMLButtonElement) {
    const content =
      currentFiles[activeCodeFile]?.trim() ||
      currentCanvasCode ||
      currentPreviewDocument;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      if (!trigger) return;

      const label = trigger.querySelector<HTMLElement>("[data-code-copy-label]");
      trigger.classList.add("is-copied");
      if (label) label.textContent = "Copied";

      window.setTimeout(() => {
        trigger.classList.remove("is-copied");
        if (label) label.textContent = "Copy";
      }, 1600);
    } catch {
      // ignore clipboard errors
    }
  }

  async function onCanvasCopy() {
    await copyActiveCodeFile();
  }

  async function onCodeCopyClick() {
    await copyActiveCodeFile(canvasCodeCopy ?? undefined);
  }

  function onCodeTabClick(event: Event) {
    const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-tab-trigger]",
    );
    if (!trigger || !canvasCodeTabs?.contains(trigger)) return;

    const fileId = trigger.dataset.tabTrigger;
    if (fileId === "html" || fileId === "css" || fileId === "js") {
      activeCodeFile = fileId;
    }
  }




  function appendDivider() {
    if (!thread) return null;
    const divider = document.createElement("div");
    divider.className = "agent-gradient-divider";
    divider.dataset.messageDivider = "true";
    thread.appendChild(divider);
    return divider;
  }

  function appendMessageNode(node: HTMLElement) {
    if (!thread) return;
    emptyState?.classList.add("hidden");
    thread.appendChild(node);
    scrollToBottom();
  }

  function removeLoading() {
    root.querySelector("#agent-loading")?.remove();
  }

  function persistChat() {
    chatHistory.persist();
  }

  function clearThreadUi() {
    if (!thread) return;

    currentBuildId = null;
    thread
      .querySelectorAll(
        "[data-message-role], [data-message-divider], #agent-loading",
      )
      .forEach((node) => node.remove());
    emptyState?.classList.remove("hidden");
    closeCanvas();
    clearError();
  }

  function restoreCanvasFromMessages() {
    const preview = resolveCanvasPreviewFromMessages(
      chatMessages,
      sessionCategory ?? defaultCategory,
    );
    if (preview) openCanvas(preview);
  }

  function renderStoredMessages() {
    if (chatMessages.length === 0) return;

    chatMessages.forEach((message, index) => {
      if (message.role === "user") {
        appendMessageNode(renderAgentUserMessage(message));
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

    restoreCanvasFromMessages();
  }

  function restoreChatFromStorage() {
    renderStoredMessages();
  }

  const chatHistory = createAgentChatHistoryController({
    storageKey: CHAT_STORAGE_KEY,
    defaultCategory,
    chatMessages,
    getSessionCategory: () => sessionCategory,
    setSessionCategory: (category) => {
      sessionCategory = category;
    },
    setCategoryInputValue: (category) => {
      if (categoryInput) categoryInput.value = category;
    },
    clearThreadUi,
    renderStoredMessages,
    scrollToBottom,
    focusInput: () => input?.focus(),
  });
  getActiveThreadId = () => chatHistory.threadId;

  async function onFormSubmit(event: Event) {
    event.preventDefault();
    if (isSubmitting || !input?.value.trim() || !thread) return;

    clearError();

    const message = input.value.trim();
    const category = sessionCategory ?? (categoryInput?.value as AgentPromptCategory | "");

    if (!category) {
      showError("Pilih category terlebih dahulu sebelum mengirim prompt.");
      input.focus();
      return;
    }

    if (categoryInput) categoryInput.value = category;

    const userMessage: AgentChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      sentAt: new Date().toISOString(),
    };

    chatMessages.push(userMessage);
    persistChat();
    const userNode = renderAgentUserMessage(userMessage);
    appendMessageNode(userNode);
    const divider = appendDivider();
    const loadingNode = renderAgentLoading();
    appendMessageNode(loadingNode);

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setLoading(true);

    try {
      const history = buildPromptHistory(chatMessages.slice(0, -1));
      const response = await sendAgentPrompt({
        message,
        category,
        history: history.length > 0 ? history : undefined,
      });

      removeLoading();

      const assistantMessage: AgentChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        sentAt: new Date().toISOString(),
        model: response.model,
        category: response.category,
      };

      chatMessages.push(assistantMessage);
      sessionCategory = response.category;
      persistChat();
      appendMessageNode(renderAgentAssistantMessage(assistantMessage));

      if (shouldShowCanvas(message, response.category, response.reply)) {
        const preview = buildWebPreview(response.reply);
        if (preview) {
          openCanvas(preview, {
            prompt: message,
            category: response.category,
            model: response.model,
          });
        }
      }
    } catch (error) {
      removeLoading();
      chatMessages.pop();
      persistChat();
      userNode.remove();
      divider?.remove();
      input.value = message;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (chatMessages.length === 0) {
        emptyState?.classList.remove("hidden");
      }
      showError(getAgentErrorMessage(error));
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  const cleanupTabs = bindUiTabs(root);

  if (categoryInput && !categoryInput.value) {
    categoryInput.value = defaultCategory;
  }

  if (sessionCategory && categoryInput) {
    categoryInput.value = sessionCategory;
  }

  restoreChatFromStorage();
  const cleanupHistory = chatHistory.bind();

  const categoryCards = root.querySelectorAll<HTMLButtonElement>(
    "[data-agent-category]",
  );
  categoryCards.forEach((card) => {
    card.addEventListener("click", onCategoryCardClick);
  });

  canvasClose?.addEventListener("click", onCanvasClose);
  canvasDetails?.addEventListener("click", onCanvasDetailsClick);
  canvasRefresh?.addEventListener("click", onCanvasRefresh);
  canvasCopy?.addEventListener("click", onCanvasCopy);
  canvasCodeCopy?.addEventListener("click", onCodeCopyClick);
  canvasCodeTabs?.addEventListener("click", onCodeTabClick);
  previewDialog?.addEventListener("toggle", onPreviewDialogToggle);
  form?.addEventListener("submit", onFormSubmit);

  return () => {
    cleanupTabs();
    cleanupHistory();
    categoryCards.forEach((card) => {
      card.removeEventListener("click", onCategoryCardClick);
    });
    canvasClose?.removeEventListener("click", onCanvasClose);
    canvasDetails?.removeEventListener("click", onCanvasDetailsClick);
    canvasRefresh?.removeEventListener("click", onCanvasRefresh);
    canvasCopy?.removeEventListener("click", onCanvasCopy);
    canvasCodeCopy?.removeEventListener("click", onCodeCopyClick);
    canvasCodeTabs?.removeEventListener("click", onCodeTabClick);
    previewDialog?.removeEventListener("toggle", onPreviewDialogToggle);
    form?.removeEventListener("submit", onFormSubmit);
    closeCanvas();
  };
}

function mountRoleplayAgent(root: ParentNode = document): void {
  const shell = root.querySelector<HTMLElement>(".agent-shell");
  if (!shell || shell.dataset.bound === "true") return;

  shell.dataset.bound = "true";

  const cleanup = createRoleplayAgentController(root);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
      shell.dataset.bound = "false";
    },
    { once: true },
  );
}

export function bindRoleplayAgent(root: ParentNode = document): void {
  mountRoleplayAgent(root);
  document.addEventListener("astro:page-load", () => mountRoleplayAgent(document));
}
