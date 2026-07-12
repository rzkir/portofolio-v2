import type { AgentCategoryCard } from "@/service/agent.service";
import {
  buildPromptHistory,
  formatAgentTime,
  sendAgentPrompt,
} from "@/service/agent.service";
import { setAgentBusy } from "@/lib/agent-busy";
import { setupAgentChatSession } from "@/lib/agent-chat-session";
import { formatAgentMessageHtml } from "@/lib/agent-message";

export const FINANCE_AGENT_CATEGORY: AgentPromptCategory = "finance";
const CHAT_STORAGE_KEY = "finance";

export const FINANCE_CATEGORY_CARDS: AgentCategoryCard[] = [
  {
    title: "Budget Planner",
    categoryLabel: "Finance · Personal",
    description:
      "Susun anggaran bulanan yang realistis, lengkap dengan pos wajib, tabungan, dan spending limit.",
    category: "finance",
    prompt:
      "Bantu saya bikin budget bulanan. Saya punya pemasukan Rp..., pengeluaran wajib Rp..., dan target tabungan Rp...; buat alokasi yang masuk akal.",
  },
  {
    title: "Debt Payoff Strategy",
    categoryLabel: "Finance · Debt",
    description:
      "Buat strategi pelunasan utang (snowball/avalanche) beserta estimasi waktu dan prioritas cicilan.",
    category: "finance",
    prompt:
      "Bantu saya menyusun strategi pelunasan utang. Berikut daftar utang (saldo, bunga, cicilan minimum). Pilihkan metode terbaik dan rencana langkahnya.",
  },
  {
    title: "Investment Plan",
    categoryLabel: "Finance · Investing",
    description:
      "Rancang rencana investasi sesuai profil risiko, horizon waktu, dan tujuan finansial.",
    category: "finance",
    prompt:
      "Bantu saya membuat rencana investasi. Profil risiko saya..., horizon..., tujuan..., dan kondisi dana darurat...; buat strategi yang prudent.",
  },
  {
    title: "Cashflow Audit",
    categoryLabel: "Finance · Audit",
    description:
      "Audit pemasukan-pengeluaran, temukan kebocoran, dan saran optimasi cashflow yang actionable.",
    category: "finance",
    prompt:
      "Audit cashflow saya. Berikut pemasukan dan pengeluaran 3 bulan terakhir; temukan kebocoran dan berikan rekomendasi penghematan + prioritas.",
  },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createFinanceAgentController(root: ParentNode): () => void {
  const form = root.querySelector<HTMLFormElement>("#agent-prompt-form");
  const input = root.querySelector<HTMLInputElement>("#main-prompt-input");
  const sendBtn = root.querySelector<HTMLButtonElement>("#main-prompt-input-send");
  const categoryInput = form?.elements.namedItem("category") as
    | HTMLInputElement
    | null;
  const thread = root.querySelector<HTMLElement>("#agent-thread");
  const messagesViewport = root.querySelector<HTMLElement>("#agent-messages");
  const emptyState = root.querySelector<HTMLElement>("#agent-empty-state");
  const errorEl = root.querySelector<HTMLElement>("#agent-error");

  const chatMessages: AgentChatMessage[] = [];
  let isSubmitting = false;
  let sessionCategory: AgentPromptCategory | null = FINANCE_AGENT_CATEGORY;

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

  function applyCategoryPreset(prompt: string) {
    sessionCategory = FINANCE_AGENT_CATEGORY;
    if (categoryInput) categoryInput.value = FINANCE_AGENT_CATEGORY;
    if (!input) return;

    input.value = prompt;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    clearError();
  }

  function onCategoryCardClick(event: Event) {
    const trigger = event.currentTarget as HTMLButtonElement | null;
    if (!trigger) return;

    const prompt = trigger.dataset.agentPrompt?.trim();
    if (!prompt) return;

    applyCategoryPreset(prompt);
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

  const chatSession = setupAgentChatSession({
    storageKey: CHAT_STORAGE_KEY,
    defaultCategory: FINANCE_AGENT_CATEGORY,
    chatMessages,
    getSessionCategory: () => sessionCategory,
    setSessionCategory: (category) => {
      sessionCategory = category;
    },
    categoryInput,
    thread,
    emptyState,
    errorEl,
    renderUserMessage,
    renderAssistantMessage,
    appendMessageNode,
    appendDivider,
    scrollToBottom,
    focusInput: () => input?.focus(),
  });

  function persistChat() {
    chatSession.persist();
  }

  async function onFormSubmit(event: Event) {
    event.preventDefault();
    if (isSubmitting || !input?.value.trim() || !thread) return;

    clearError();

    const message = input.value.trim();
    if (categoryInput) categoryInput.value = FINANCE_AGENT_CATEGORY;

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
        category: FINANCE_AGENT_CATEGORY,
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

  chatSession.renderStoredMessages();
  const cleanupHistory = chatSession.bind();

  const categoryCards = root.querySelectorAll<HTMLButtonElement>(
    "[data-agent-category]",
  );
  categoryCards.forEach((card) => {
    card.addEventListener("click", onCategoryCardClick);
  });

  form?.addEventListener("submit", onFormSubmit);

  return () => {
    cleanupHistory();
    categoryCards.forEach((card) => {
      card.removeEventListener("click", onCategoryCardClick);
    });
    form?.removeEventListener("submit", onFormSubmit);
  };
}

function mountFinanceAgent(root: ParentNode = document): void {
  const shell = root.querySelector<HTMLElement>(".agent-shell");
  if (!shell || shell.dataset.bound === "true") return;

  shell.dataset.bound = "true";

  const cleanup = createFinanceAgentController(root);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
      shell.dataset.bound = "false";
    },
    { once: true },
  );
}

export function bindFinanceAgent(root: ParentNode = document): void {
  mountFinanceAgent(root);
  document.addEventListener("astro:page-load", () => mountFinanceAgent(document));
}
