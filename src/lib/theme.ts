export const THEME_EVENT = "theme:change";

export type ThemePreference = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

const PREFERENCES: ThemePreference[] = ["light", "dark", "system"];

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

  document.querySelectorAll<HTMLElement>("[data-theme-option]").forEach((button) => {
    const active = button.dataset.themeOption === preference;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  return resolved;
}

export function setTheme(
  root: HTMLElement,
  preference: ThemePreference,
): void {
  applyTheme(root, preference);
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

function onThemeSwitchClick(event: Event): void {
  const button = (event.target as Element | null)?.closest<HTMLElement>(
    "[data-theme-option]",
  );
  if (!button) return;

  const preference = button.dataset.themeOption;
  if (!isThemePreference(preference)) return;

  setTheme(document.documentElement, preference);
}

export function bindTheme(): void {
  applyTheme(document.documentElement, currentPreference);

  if (!isBound) {
    document.addEventListener("click", onThemeSwitchClick);
    isBound = true;
  }

  if (!mediaQuery) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryHandler = onSystemThemeChange;
    mediaQuery.addEventListener("change", mediaQueryHandler);
  }
}
