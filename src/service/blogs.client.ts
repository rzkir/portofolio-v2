import {
  bindArchiveView,
  type ArchiveView,
  type ArchiveViewConfig,
} from "@/lib/achive-view";

// ── Blog view ────────────────────────────────────────────────────────────────
// Client: grid/list toggle on the blog archive page.

export type BlogView = ArchiveView;

export const BLOG_VIEW_STORAGE_KEY = "blog-view";

export const BLOG_VIEW_CONFIG: ArchiveViewConfig = {
  archiveSelector: "[data-blog-archive]",
  buttonSelector: "[data-archive-view-btn]",
  storageKey: BLOG_VIEW_STORAGE_KEY,
};

export function bindBlogView(root: ParentNode = document): void {
  bindArchiveView(BLOG_VIEW_CONFIG, root);
}

// ── Blog filters ─────────────────────────────────────────────────────────────
// Client: category filter tabs on the blog archive page.

export function bindBlogFilters(root: ParentNode = document): void {
  const container = root.querySelector<HTMLElement>("[data-blog-root]");
  const filters = root.querySelector<HTMLElement>("[data-blog-filters]");
  if (!container || !filters || filters.dataset.bound === "true") return;

  filters.dataset.bound = "true";

  const lead = container.querySelector("[data-blog-lead]");
  const items = container.querySelectorAll("[data-blog-item]");
  const empty = container.querySelector("[data-blog-empty]");
  const countEl = root.querySelector("[data-blog-count]");
  const entriesTemplate =
    countEl?.textContent?.replace(/\d+/, "{count}") ?? "";

  const buttons =
    filters.querySelectorAll<HTMLButtonElement>("[data-blog-filter]");

  const applyFilter = (category: string) => {
    let visible = 0;

    const match = (el: Element | null) => {
      if (!el) return;
      const itemCategory = el.getAttribute("data-blog-category") ?? "";
      const show = category === "All" || itemCategory === category;
      el.classList.toggle("hidden", !show);
      if (show) visible += 1;
    };

    match(lead);
    items.forEach((item) => match(item));

    const archive = container.querySelector("[data-blog-archive]");
    const visibleArchiveItems = [...items].filter(
      (item) => !item.classList.contains("hidden"),
    ).length;
    archive?.classList.toggle("hidden", visibleArchiveItems === 0);

    empty?.classList.toggle("hidden", visible > 0);

    if (countEl && entriesTemplate) {
      countEl.textContent = entriesTemplate.replace(
        "{count}",
        String(visible),
      );
    }

    buttons.forEach((button) => {
      const value = button.getAttribute("data-blog-filter") ?? "";
      const active = value === category;
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.classList.toggle("text-foreground", active);
      button.classList.toggle("text-muted-foreground", !active);
      button
        .querySelector("[data-blog-prefix]")
        ?.classList.toggle("hidden", !active);
    });
  };

  const onClick = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-blog-filter]",
    );
    if (!button || !filters.contains(button)) return;

    applyFilter(button.getAttribute("data-blog-filter") ?? "All");
  };

  filters.addEventListener("click", onClick);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      filters.removeEventListener("click", onClick);
      filters.dataset.bound = "false";
    },
    { once: true },
  );
}
