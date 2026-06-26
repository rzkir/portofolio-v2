export type ArchiveView = "grid" | "list";

export type ArchiveViewConfig = {
  archiveSelector: string;
  buttonSelector: string;
  storageKey: string;
};

export function getStoredArchiveView(config: ArchiveViewConfig): ArchiveView {
  try {
    const stored = localStorage.getItem(config.storageKey);
    if (stored === "grid" || stored === "list") return stored;
  } catch {
    /* ignore */
  }

  return "list";
}

export function setArchiveView(
  archive: HTMLElement,
  view: ArchiveView,
  config: ArchiveViewConfig,
): void {
  archive.dataset.view = view;

  archive
    .querySelectorAll<HTMLButtonElement>(config.buttonSelector)
    .forEach((btn) => {
      const active = btn.dataset.archiveViewBtn === view;
      btn.setAttribute("aria-pressed", String(active));
      btn.classList.toggle("is-active", active);
    });

  try {
    localStorage.setItem(config.storageKey, view);
  } catch {
    /* ignore */
  }
}

export function bindArchiveView(
  config: ArchiveViewConfig,
  root: ParentNode = document,
): void {
  const archive = root.querySelector<HTMLElement>(config.archiveSelector);
  if (!archive || archive.dataset.bound === "true") return;

  archive.dataset.bound = "true";
  setArchiveView(archive, getStoredArchiveView(config), config);

  const onClick = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      config.buttonSelector,
    );
    if (!target || !archive.contains(target)) return;

    const view = target.dataset.archiveViewBtn as ArchiveView | undefined;
    if (view === "grid" || view === "list") {
      setArchiveView(archive, view, config);
    }
  };

  archive.addEventListener("click", onClick);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      archive.removeEventListener("click", onClick);
      archive.dataset.bound = "false";
    },
    { once: true },
  );
}
