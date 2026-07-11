import {
  buildPromptHistory,
  buildWebPreview,
  formatAgentTime,
  sendAgentPrompt,
  shouldShowCanvas,
} from "@/service/agent.service";
import { bindUiTabs, setUiTab } from "@/lib/ui-tabs";
import { highlightCode, toHighlightLanguage } from "@/lib/code-highlight";
import { saveAgentWebBuild } from "@/service/agent/builds.client";
import {
  loadAgentChatSession,
  saveAgentChatSession,
} from "@/lib/storage";
import { formatAgentMessageHtml } from "@/lib/agent-message";

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

  const storedSession = loadAgentChatSession(CHAT_STORAGE_KEY);
  const chatMessages: AgentChatMessage[] = storedSession?.messages ?? [];
  let isSubmitting = false;
  let sessionCategory: AgentPromptCategory | null =
    storedSession?.sessionCategory ??
    ((categoryInput?.value as AgentPromptCategory | "") || defaultCategory);
  let currentCanvasCode = "";
  let currentPreviewDocument = "";
  let currentFiles: AgentWebPreviewFiles = { html: "", css: "", js: "" };
  let activeCodeFile: keyof AgentWebPreviewFiles = "html";

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

    if (!meta) return;

    const build = saveAgentWebBuild({
      title: preview.title,
      prompt: meta.prompt,
      category: meta.category,
      model: meta.model,
      preview,
    });

    if (canvasDetails) {
      canvasDetails.href = `/agent/${build.id}`;
      canvasDetails.classList.remove("hidden");
    }
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
    canvasDetails?.classList.add("hidden");
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

  function renderUserMessage(message: AgentChatMessage) {
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
          Sent ${formatAgentTime(message.sentAt)}
        </span>
      </div>
    `;
    return block;
  }

  function renderAssistantMessage(message: AgentChatMessage) {
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
          Inference Complete${message.model ? ` · ${escapeHtml(message.model)}` : ""}
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
          Copy
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

  function renderLoading() {
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
          Processing
        </span>
      </div>
    `;
    return block;
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
    saveAgentChatSession(CHAT_STORAGE_KEY, chatMessages, sessionCategory);
  }

  function restoreChatFromStorage() {
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
  }

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
    const userNode = renderUserMessage(userMessage);
    appendMessageNode(userNode);
    const divider = appendDivider();
    const loadingNode = renderLoading();
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
      appendMessageNode(renderAssistantMessage(assistantMessage));

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
      showError(
        error instanceof Error
          ? error.message
          : "Gagal memproses prompt. Coba lagi.",
      );
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

  const categoryCards = root.querySelectorAll<HTMLButtonElement>(
    "[data-agent-category]",
  );
  categoryCards.forEach((card) => {
    card.addEventListener("click", onCategoryCardClick);
  });

  canvasClose?.addEventListener("click", onCanvasClose);
  canvasRefresh?.addEventListener("click", onCanvasRefresh);
  canvasCopy?.addEventListener("click", onCanvasCopy);
  canvasCodeCopy?.addEventListener("click", onCodeCopyClick);
  canvasCodeTabs?.addEventListener("click", onCodeTabClick);
  previewDialog?.addEventListener("toggle", onPreviewDialogToggle);
  form?.addEventListener("submit", onFormSubmit);

  return () => {
    cleanupTabs();
    categoryCards.forEach((card) => {
      card.removeEventListener("click", onCategoryCardClick);
    });
    canvasClose?.removeEventListener("click", onCanvasClose);
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
