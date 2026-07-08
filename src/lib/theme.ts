export const THEME_EVENT = "theme:change";

export type ThemePreference = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

const PREFERENCES: ThemePreference[] = ["light", "dark", "system"];

const THEME_ICONS: Record<ThemePreference, string> = {
  light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`,
  dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`,
  system: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path></svg>`,
};

let currentPreference: ThemePreference = "system";

export function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return PREFERENCES.includes(value as ThemePreference);
}

export function getCurrentTheme(): ThemePreference {
  return currentPreference;
}

export function resolveTheme(preference: ThemePreference): ThemeResolved {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function closeThemeMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-theme-menu]").forEach((menu) => {
    menu.hidden = true;
    const trigger = menu
      .closest("[data-theme-switch]")
      ?.querySelector<HTMLElement>("[data-theme-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
  });
}

function syncThemeSwitchUi(preference: ThemePreference): void {
  document.querySelectorAll<HTMLElement>("[data-theme-option]").forEach((button) => {
    const active = button.dataset.themeOption === preference;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll<HTMLElement>("[data-theme-switch]").forEach((root) => {
    const icon = root.querySelector<HTMLElement>(".theme-switch__trigger-icon");
    const label = root.querySelector<HTMLElement>(".theme-switch__trigger-label");
    const activeOption = root.querySelector<HTMLElement>(
      `[data-theme-option="${preference}"] span:last-child`,
    );

    if (icon) icon.innerHTML = THEME_ICONS[preference];
    if (label && activeOption) label.textContent = activeOption.textContent;
  });
}

export function applyTheme(
  root: HTMLElement,
  preference: ThemePreference,
): ThemeResolved {
  currentPreference = preference;
  const resolved = resolveTheme(preference);

  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-theme", preference);
  root.setAttribute("data-theme-resolved", resolved);
  root.style.colorScheme = resolved;

  syncThemeSwitchUi(preference);

  return resolved;
}

export function setTheme(
  root: HTMLElement,
  preference: ThemePreference,
): void {
  applyTheme(root, preference);
  closeThemeMenus();
  document.dispatchEvent(
    new CustomEvent(THEME_EVENT, { detail: { preference } }),
  );
}

let mediaQuery: MediaQueryList | null = null;
let mediaQueryHandler: (() => void) | null = null;
let isBound = false;

function onSystemThemeChange(): void {
  if (currentPreference !== "system") return;
  applyTheme(document.documentElement, "system");
}

function onDocumentClick(event: Event): void {
  const target = event.target as Element | null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>("[data-theme-trigger]");
  if (trigger) {
    const menu = trigger
      .closest("[data-theme-switch]")
      ?.querySelector<HTMLElement>("[data-theme-menu]");
    if (!menu) return;

    const shouldOpen = menu.hidden;
    closeThemeMenus();
    menu.hidden = !shouldOpen;
    trigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    return;
  }

  const option = target.closest<HTMLElement>("[data-theme-option]");
  if (option) {
    const preference = option.dataset.themeOption;
    if (!isThemePreference(preference)) return;
    setTheme(document.documentElement, preference);
    return;
  }

  if (!target.closest("[data-theme-switch]")) {
    closeThemeMenus();
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeThemeMenus();
}

export function bindTheme(): void {
  const stored = document.documentElement.getAttribute("data-theme");
  const initial = isThemePreference(stored) ? stored : currentPreference;
  applyTheme(document.documentElement, initial);

  if (!isBound) {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeydown);
    isBound = true;
  }

  if (!mediaQuery) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryHandler = onSystemThemeChange;
    mediaQuery.addEventListener("change", mediaQueryHandler);
  }
}
