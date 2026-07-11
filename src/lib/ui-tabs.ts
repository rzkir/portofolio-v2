function getTabTriggers(container: HTMLElement): HTMLButtonElement[] {
  const tablist = container.querySelector<HTMLElement>('[role="tablist"]');
  if (!tablist) return [];

  return Array.from(
    tablist.querySelectorAll<HTMLButtonElement>(":scope > [data-tab-trigger]"),
  );
}

function getTabPanels(container: HTMLElement): HTMLElement[] {
  const panelsRoot =
    container.querySelector<HTMLElement>(":scope > .ui-tabs__panels") ??
    container.querySelector<HTMLElement>(
      ":scope > .agent-code-editor__workspace",
    );

  if (!panelsRoot) return [];

  return Array.from(
    panelsRoot.querySelectorAll<HTMLElement>(":scope > [data-tab-panel]"),
  );
}

export function setUiTab(root: ParentNode, tabId: string): void {
  const container =
    root instanceof HTMLElement && root.matches("[data-ui-tabs]")
      ? root
      : root.querySelector<HTMLElement>("[data-ui-tabs]");

  if (!container) return;

  const triggers = getTabTriggers(container);
  const panels = getTabPanels(container);

  triggers.forEach((trigger) => {
    const isActive = trigger.dataset.tabTrigger === tabId;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabId;
    panel.classList.toggle("ui-tabs__panel--hidden", !isActive);
    panel.toggleAttribute("hidden", !isActive);
  });
}

export function bindUiTabs(root: ParentNode): () => void {
  const containers = root.querySelectorAll<HTMLElement>("[data-ui-tabs]");
  const cleanups: Array<() => void> = [];

  containers.forEach((container) => {
    const ownedTriggers = getTabTriggers(container);

    const onClick = (event: Event) => {
      const trigger = (event.target as HTMLElement | null)?.closest<
        HTMLButtonElement
      >("[data-tab-trigger]");

      if (!trigger || !ownedTriggers.includes(trigger)) return;

      const tabId = trigger.dataset.tabTrigger;
      if (!tabId) return;

      setUiTab(container, tabId);
    };

    container.addEventListener("click", onClick);
    cleanups.push(() => container.removeEventListener("click", onClick));
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
