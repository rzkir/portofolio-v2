import {
  AGENT_HISTORY_PERIOD_LABELS,
  deriveThreadPreview,
  formatHistoryTime,
  getAgentHistoryPeriod,
  groupThreadsByPeriod,
} from "@/lib/agent-history";
import {
  deleteAgentChatThread,
  getActiveAgentChatThreadId,
  getPinnedAgentChatThreadIds,
  loadAgentChatThreads,
  togglePinnedAgentChatThread,
} from "@/lib/storage";
import { isAgentBusy } from "@/lib/agent-busy";
import { bindPanelCollapse } from "@/lib/panel-collapse";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const PIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5" aria-hidden="true"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;

const PIN_OFF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5" aria-hidden="true"><path d="M12 17v5"></path><path d="M15 9.34V5a1 1 0 0 0-1-1 2 2 0 0 0 0-4H7.89"></path><path d="m2 2 20 20"></path><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h3.34"></path></svg>`;

const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5" aria-hidden="true"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>`;

export function notifyAgentHistoryUpdated(storageKey: string): void {
  document.dispatchEvent(
    new CustomEvent("agent-history:updated", {
      detail: { storageKey },
    }),
  );
}

function sortThreads(
  threads: AgentChatThread[],
  pinnedIds: Set<string>,
): AgentChatThread[] {
  return [...threads].sort((left, right) => {
    const leftPinned = pinnedIds.has(left.id);
    const rightPinned = pinnedIds.has(right.id);
    if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

function renderHistoryEmpty(list: HTMLElement, query: string): void {
  const templateId = query.trim()
    ? "agent-history-empty-search"
    : "agent-history-empty-default";
  const template = document.getElementById(
    templateId,
  ) as HTMLTemplateElement | null;

  if (template?.content) {
    list.replaceChildren(template.content.cloneNode(true));
    return;
  }

  list.innerHTML = `
    <div class="agent-history-empty px-3 pt-2">
      <p>${query.trim() ? "Tidak ada percakapan yang cocok." : "Belum ada riwayat."}</p>
    </div>
  `;
}

function filterThreads(
  threads: AgentChatThread[],
  query: string,
): AgentChatThread[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return threads;

  return threads.filter((thread) => {
    const preview = deriveThreadPreview(thread.messages);
    const haystack = `${thread.title} ${preview}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

function renderHistoryItem(
  thread: AgentChatThread,
  activeThreadId: string | null,
  pinnedIds: Set<string>,
): string {
  const isActive = thread.id === activeThreadId;
  const isPinned = pinnedIds.has(thread.id);
  const period = getAgentHistoryPeriod(thread.updatedAt);
  const preview = deriveThreadPreview(thread.messages);
  const meta = formatHistoryTime(thread.updatedAt, period, isActive);

  return `
    <div
      class="agent-history-item group${isActive ? " is-active" : ""}"
      data-history-thread-id="${escapeHtml(thread.id)}"
      role="button"
      tabindex="0"
      title="${escapeHtml(thread.title)}"
    >
      <div class="agent-history-item__head">
        <span class="agent-history-item__title">${escapeHtml(thread.title)}</span>
        <span class="agent-history-item__meta">${escapeHtml(meta)}</span>
      </div>
      <p class="agent-history-item__preview">${escapeHtml(preview)}</p>
      <div class="agent-history-item__actions${isActive ? " is-visible" : ""}">
        <button
          type="button"
          class="agent-history-action agent-history-action--pin${isPinned ? " is-pinned" : ""}"
          data-history-pin-id="${escapeHtml(thread.id)}"
          aria-label="${isPinned ? "Lepas pin" : "Pin percakapan"}"
        >
          ${isPinned ? PIN_OFF_ICON : PIN_ICON}
        </button>
        <button
          type="button"
          class="agent-history-action agent-history-action--delete"
          data-history-delete-id="${escapeHtml(thread.id)}"
          aria-label="Hapus percakapan"
        >
          ${DELETE_ICON}
        </button>
      </div>
    </div>
  `;
}

function renderHistoryList(
  list: HTMLElement,
  storageKey: string,
  activeThreadId: string | null,
  query = "",
): void {
  const pinnedIds = new Set(getPinnedAgentChatThreadIds(storageKey));
  const threads = sortThreads(
    filterThreads(
      loadAgentChatThreads(storageKey).filter(
        (thread) => thread.messages.length > 0,
      ),
      query,
    ),
    pinnedIds,
  );
  const groups = groupThreadsByPeriod(threads);

  if (groups.length === 0) {
    renderHistoryEmpty(list, query);
    return;
  }

  list.innerHTML = groups
    .map(({ period, threads: periodThreads }) => {
      const items = sortThreads(periodThreads, pinnedIds)
        .map((thread) => renderHistoryItem(thread, activeThreadId, pinnedIds))
        .join("");

      return `
        <section class="agent-history-period">
          <span class="agent-history-period__label">${AGENT_HISTORY_PERIOD_LABELS[period]}</span>
          <div class="agent-history-period__track">${items}</div>
        </section>
      `;
    })
    .join("");
}

function setHistoryOpen(
  root: HTMLElement,
  panel: HTMLElement,
  backdrop: HTMLElement,
  toggle: HTMLButtonElement | null,
  isOpen: boolean,
): void {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  if (isDesktop) {
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    panel.classList.add("is-open");
    backdrop.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.classList.add("is-active");
    return;
  }

  root.classList.toggle("is-open", isOpen);
  root.setAttribute("aria-hidden", String(!isOpen));
  panel.classList.toggle("is-open", isOpen);
  backdrop.classList.toggle("is-open", isOpen);
  toggle?.setAttribute("aria-expanded", String(isOpen));
  toggle?.classList.toggle("is-active", isOpen);

  if (isOpen) document.body.classList.add("overflow-hidden");
  else document.body.classList.remove("overflow-hidden");
}

export function bindAgentHistory(root: ParentNode, storageKey: string): () => void {
  const historyRoot = root.querySelector<HTMLElement>("#agent-history-root");
  const panel = root.querySelector<HTMLElement>("#agent-history-panel");
  const backdrop = root.querySelector<HTMLElement>("#agent-history-backdrop");
  const toggle = root.querySelector<HTMLButtonElement>("#agent-history-toggle");
  const closeBtn = root.querySelector<HTMLButtonElement>("#agent-history-close");
  const collapseBtn = root.querySelector<HTMLButtonElement>("#agent-history-collapse");
  const expandBtn = root.querySelector<HTMLButtonElement>("#agent-history-expand");
  const newBtn = root.querySelector<HTMLButtonElement>("#agent-history-new");
  const searchInput = root.querySelector<HTMLInputElement>("#agent-history-search");
  const list = root.querySelector<HTMLElement>("#agent-history-list");

  if (!historyRoot || !panel || !backdrop || !closeBtn || !newBtn || !list) {
    return () => {};
  }

  let searchQuery = "";

  const refresh = () => {
    renderHistoryList(
      list,
      storageKey,
      getActiveAgentChatThreadId(storageKey),
      searchQuery,
    );
  };

  const open = () =>
    setHistoryOpen(historyRoot, panel, backdrop, toggle, true);
  const close = () =>
    setHistoryOpen(historyRoot, panel, backdrop, toggle, false);

  const onToggle = () => {
    if (isAgentBusy()) return;
    if (historyRoot.classList.contains("is-open")) close();
    else open();
  };

  const onNewChat = () => {
    if (isAgentBusy()) return;
    document.dispatchEvent(
      new CustomEvent("agent-history:new", {
        detail: { storageKey },
      }),
    );
    if (!window.matchMedia("(min-width: 768px)").matches) close();
  };

  const onListClick = (event: Event) => {
    if (isAgentBusy()) return;

    const target = event.target as HTMLElement | null;

    const pinBtn = target?.closest<HTMLButtonElement>("[data-history-pin-id]");
    if (pinBtn) {
      event.preventDefault();
      event.stopPropagation();
      const threadId = pinBtn.dataset.historyPinId;
      if (!threadId) return;
      togglePinnedAgentChatThread(storageKey, threadId);
      refresh();
      return;
    }

    const deleteBtn = target?.closest<HTMLButtonElement>(
      "[data-history-delete-id]",
    );
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      const threadId = deleteBtn.dataset.historyDeleteId;
      if (!threadId) return;

      const wasActive = getActiveAgentChatThreadId(storageKey) === threadId;
      const nextActiveId = deleteAgentChatThread(storageKey, threadId);

      if (wasActive) {
        document.dispatchEvent(
          new CustomEvent("agent-history:delete", {
            detail: { storageKey, threadId, nextActiveId },
          }),
        );
      }

      refresh();
      notifyAgentHistoryUpdated(storageKey);
      return;
    }

    const selectBtn = target?.closest<HTMLElement>(
      "[data-history-thread-id]",
    );
    if (!selectBtn) return;

    if (
      target?.closest("[data-history-pin-id], [data-history-delete-id]")
    ) {
      return;
    }

    const threadId = selectBtn.dataset.historyThreadId;
    if (!threadId) return;

    document.dispatchEvent(
      new CustomEvent("agent-history:select", {
        detail: { storageKey, threadId },
      }),
    );
    if (!window.matchMedia("(min-width: 768px)").matches) close();
  };

  const onSearch = () => {
    searchQuery = searchInput?.value ?? "";
    refresh();
  };

  const onUpdated = (event: Event) => {
    const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
    if (detail?.storageKey && detail.storageKey !== storageKey) return;
    refresh();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !window.matchMedia("(min-width: 768px)").matches) {
      close();
    }
  };

  const onResize = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      document.body.classList.remove("overflow-hidden");
      open();
    } else if (!historyRoot.classList.contains("is-open")) {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
    }
  };

  const onBusy = (event: Event) => {
    const busy = (event as CustomEvent<{ busy?: boolean }>).detail?.busy ?? false;
    document.documentElement.classList.toggle("agent-is-busy", busy);
    historyRoot.classList.toggle("is-locked", busy);
    panel.setAttribute("aria-busy", String(busy));
    newBtn.disabled = busy;
    if (searchInput) searchInput.disabled = busy;
    toggle?.toggleAttribute("disabled", busy);
  };

  toggle?.addEventListener("click", onToggle);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  newBtn.addEventListener("click", onNewChat);
  searchInput?.addEventListener("input", onSearch);
  list.addEventListener("click", onListClick);
  document.addEventListener("agent-history:updated", onUpdated);
  document.addEventListener("agent:busy", onBusy);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  if (window.matchMedia("(min-width: 768px)").matches) open();
  refresh();

  const { cleanup: cleanupCollapse } = bindPanelCollapse({
    root: historyRoot,
    collapseBtn,
    expandBtn,
    storageKey: `history:${storageKey}`,
    desktopOnly: true,
  });

  return () => {
    cleanupCollapse();
    toggle?.removeEventListener("click", onToggle);
    closeBtn.removeEventListener("click", close);
    backdrop.removeEventListener("click", close);
    newBtn.removeEventListener("click", onNewChat);
    searchInput?.removeEventListener("input", onSearch);
    list.removeEventListener("click", onListClick);
    document.removeEventListener("agent-history:updated", onUpdated);
    document.removeEventListener("agent:busy", onBusy);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", onResize);
    document.body.classList.remove("overflow-hidden");
    close();
  };
}

export function mountAgentHistory(root: ParentNode = document): void {
  const panels = root.querySelectorAll<HTMLElement>("[data-agent-history]");

  panels.forEach((panel) => {
    if (panel.dataset.bound === "true") return;

    const storageKey = panel.dataset.agentHistory;
    if (!storageKey) return;

    panel.dataset.bound = "true";
    const cleanup = bindAgentHistory(root, storageKey);

    document.addEventListener(
      "astro:before-preparation",
      () => {
        cleanup();
        panel.dataset.bound = "false";
      },
      { once: true },
    );
  });
}

export function bindAgentHistoryPanel(root: ParentNode = document): void {
  mountAgentHistory(root);
  document.addEventListener("astro:page-load", () => mountAgentHistory(document));
}
