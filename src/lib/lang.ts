function closeLangMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-lang-menu]").forEach((menu) => {
    menu.hidden = true;
    const trigger = menu
      .closest("[data-lang-switch]")
      ?.querySelector<HTMLElement>("[data-lang-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
  });
}

function onDocumentClick(event: Event): void {
  const target = event.target as Element | null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>("[data-lang-trigger]");
  if (trigger) {
    const menu = trigger
      .closest("[data-lang-switch]")
      ?.querySelector<HTMLElement>("[data-lang-menu]");
    if (!menu) return;

    const shouldOpen = menu.hidden;
    closeLangMenus();
    menu.hidden = !shouldOpen;
    trigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    return;
  }

  if (!target.closest("[data-lang-switch]")) {
    closeLangMenus();
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeLangMenus();
}

let isBound = false;

export function bindLang(): void {
  if (isBound) return;

  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKeydown);
  isBound = true;
}
