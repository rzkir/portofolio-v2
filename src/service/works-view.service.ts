export type WorksView = "grid" | "list";

export const WORKS_VIEW_STORAGE_KEY = "works-view";

export const WORKS_VIEW_CONFIG = {
  archiveSelector: "[data-works-archive]",
  buttonSelector: "[data-works-view-btn]",
} as const;

export function getStoredWorksView(): WorksView {
  try {
    const stored = localStorage.getItem(WORKS_VIEW_STORAGE_KEY);
    if (stored === "grid" || stored === "list") return stored;
  } catch {
    /* ignore */
  }
  return "list";
}

export function setWorksView(archive: HTMLElement, view: WorksView): void {
  archive.dataset.view = view;

  archive.querySelectorAll<HTMLButtonElement>(WORKS_VIEW_CONFIG.buttonSelector).forEach((btn) => {
    const active = btn.dataset.worksViewBtn === view;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("is-active", active);
  });

  try {
    localStorage.setItem(WORKS_VIEW_STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}

export function bindWorksView(root: ParentNode = document): void {
  const archive = root.querySelector<HTMLElement>(WORKS_VIEW_CONFIG.archiveSelector);
  if (!archive || archive.dataset.bound === "true") return;

  archive.dataset.bound = "true";
  setWorksView(archive, getStoredWorksView());

  const onClick = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      WORKS_VIEW_CONFIG.buttonSelector,
    );
    if (!target || !archive.contains(target)) return;

    const view = target.dataset.worksViewBtn as WorksView | undefined;
    if (view === "grid" || view === "list") {
      setWorksView(archive, view);
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
