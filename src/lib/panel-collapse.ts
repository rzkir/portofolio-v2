const STORAGE_PREFIX = "agent-panel-collapsed:";

interface PanelCollapseOptions {
  root: HTMLElement;
  collapseBtn: HTMLButtonElement | null;
  expandBtn: HTMLButtonElement | null;
  storageKey: string;
  collapsedClass?: string;
  desktopOnly?: boolean;
}

function isDesktop(): boolean {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function bindPanelCollapse(options: PanelCollapseOptions): {
  cleanup: () => void;
  restore: () => void;
} {
  const {
    root,
    collapseBtn,
    expandBtn,
    storageKey,
    collapsedClass = "is-collapsed",
    desktopOnly = true,
  } = options;
  const storageId = `${STORAGE_PREFIX}${storageKey}`;

  const setCollapsed = (collapsed: boolean, persist = true) => {
    if (desktopOnly && !isDesktop()) {
      root.classList.remove(collapsedClass);
      return;
    }

    root.classList.toggle(collapsedClass, collapsed);
    collapseBtn?.setAttribute("aria-expanded", String(!collapsed));
    expandBtn?.setAttribute("aria-expanded", String(!collapsed));

    if (persist) {
      try {
        sessionStorage.setItem(storageId, collapsed ? "1" : "0");
      } catch {
        // ignore storage errors
      }
    }
  };

  const onCollapse = () => setCollapsed(true);
  const onExpand = () => setCollapsed(false);

  const onResize = () => {
    if (desktopOnly && !isDesktop()) {
      root.classList.remove(collapsedClass);
    }
  };

  const restore = () => {
    try {
      const saved = sessionStorage.getItem(storageId);
      setCollapsed(saved === "1", false);
    } catch {
      // ignore storage errors
    }
  };

  try {
    const saved = sessionStorage.getItem(storageId);
    if (saved === "1") setCollapsed(true, false);
  } catch {
    // ignore storage errors
  }

  collapseBtn?.addEventListener("click", onCollapse);
  expandBtn?.addEventListener("click", onExpand);
  window.addEventListener("resize", onResize);

  const cleanup = () => {
    collapseBtn?.removeEventListener("click", onCollapse);
    expandBtn?.removeEventListener("click", onExpand);
    window.removeEventListener("resize", onResize);
  };

  return { cleanup, restore };
}

export function isPanelCollapsed(
  root: HTMLElement | null,
  collapsedClass = "is-collapsed",
): boolean {
  return root?.classList.contains(collapsedClass) ?? false;
}

export function setPanelCollapsed(
  root: HTMLElement | null,
  collapsed: boolean,
  collapsedClass = "is-collapsed",
): void {
  root?.classList.toggle(collapsedClass, collapsed);
}
