export function setUiTab(root: ParentNode, tabId: string): void {
  const container =
    root instanceof HTMLElement && root.matches("[data-ui-tabs]")
      ? root
      : root.querySelector<HTMLElement>("[data-ui-tabs]");

  if (!container) return;

  const triggers = container.querySelectorAll<HTMLButtonElement>(
    "[data-tab-trigger]",
  );
  const panels = container.querySelectorAll<HTMLElement>("[data-tab-panel]");

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
    const onClick = (event: Event) => {
      const trigger = (event.target as HTMLElement | null)?.closest<
        HTMLButtonElement
      >("[data-tab-trigger]");

      if (!trigger || !container.contains(trigger)) return;

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
