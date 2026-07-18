export const HEADER_SYNC_EVENT = "site-header:sync";

export const HEADER_CONFIG = {
  headerId: "site-header",
  inverseThemeSelector: "[data-header-theme='inverse']",
  navSelector: "[data-header-nav]",
  navLinkSelector: "[data-header-nav-link]",
  navIndicatorSelector: "[data-header-nav-indicator]",
  menuSelector: "[data-header-menu]",
  menuToggleSelector: "[data-header-menu-toggle]",
  menuLinkSelector: "[data-header-menu-link]",
  scrollThreshold: 12,
  mobileBreakpoint: 1280,
} as const;

export function updateNavIndicator(
  nav: HTMLElement,
  target?: HTMLElement | null,
): void {
  const indicator = nav.querySelector<HTMLElement>(
    HEADER_CONFIG.navIndicatorSelector,
  );
  if (!indicator) return;

  const active =
    target ??
    nav.querySelector<HTMLElement>(
      `${HEADER_CONFIG.navLinkSelector}[aria-current="page"]`,
    );

  if (!active) return;

  const navRect = nav.getBoundingClientRect();
  const rect = active.getBoundingClientRect();

  indicator.style.width = `${rect.width}px`;
  indicator.style.height = `${rect.height}px`;
  indicator.style.transform = `translate3d(${rect.left - navRect.left + nav.scrollLeft}px, ${rect.top - navRect.top}px, 0)`;
}

export function isHeaderInverse(
  header: HTMLElement,
  scrollY: number,
  inverseSections: NodeListOf<HTMLElement>,
): boolean {
  const probeY = scrollY + header.getBoundingClientRect().height * 0.5;

  for (const section of inverseSections) {
    const rect = section.getBoundingClientRect();
    const top = scrollY + rect.top;
    const bottom = top + rect.height;
    if (probeY >= top && probeY < bottom) return true;
  }

  return false;
}

export function createSiteHeaderController(header: HTMLElement): () => void {
  const nav = header.querySelector<HTMLElement>(HEADER_CONFIG.navSelector);
  const menu = header.querySelector<HTMLElement>(HEADER_CONFIG.menuSelector);
  const menuToggle = header.querySelector<HTMLButtonElement>(
    HEADER_CONFIG.menuToggleSelector,
  );
  const menuLinks = header.querySelectorAll<HTMLAnchorElement>(
    HEADER_CONFIG.menuLinkSelector,
  );

  const inverseSections = () =>
    document.querySelectorAll<HTMLElement>(HEADER_CONFIG.inverseThemeSelector);

  let ticking = false;
  let indicatorTimer = 0;

  const syncNavIndicator = () => {
    if (!nav || window.innerWidth < HEADER_CONFIG.mobileBreakpoint) return;
    updateNavIndicator(nav);
  };

  const revealIndicators = () => {
    syncNavIndicator();
    header
      .querySelectorAll<HTMLElement>(HEADER_CONFIG.navIndicatorSelector)
      .forEach((indicator) => indicator.classList.add("is-visible"));
  };

  const setMenuOpen = (open: boolean) => {
    header.classList.toggle("is-menu-open", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
    menu?.setAttribute("aria-hidden", String(!open));

    const openLabel = menuToggle?.dataset.labelOpen;
    const closeLabel = menuToggle?.dataset.labelClose;
    if (menuToggle && openLabel && closeLabel) {
      menuToggle.setAttribute("aria-label", open ? closeLabel : openLabel);
    }

    document.documentElement.classList.toggle("overflow-hidden", open);
    document.body.classList.toggle("overflow-hidden", open);
  };

  const closeMenu = () => setMenuOpen(false);

  const update = () => {
    ticking = false;
    header.classList.toggle(
      "is-inverse",
      isHeaderInverse(header, window.scrollY, inverseSections()),
    );
    header.classList.toggle(
      "is-scrolled",
      window.scrollY > HEADER_CONFIG.scrollThreshold,
    );
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const onMenuToggle = () => {
    setMenuOpen(!header.classList.contains("is-menu-open"));
  };

  const onResize = () => {
    if (window.innerWidth >= HEADER_CONFIG.mobileBreakpoint) closeMenu();
    requestUpdate();
    syncNavIndicator();
  };

  const onSync = () => {
    requestUpdate();
    syncNavIndicator();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeMenu();
  };

  menuToggle?.addEventListener("click", onMenuToggle);
  menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener(HEADER_SYNC_EVENT, onSync);
  document.addEventListener("keydown", onKeydown);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => syncNavIndicator())
      : null;
  if (nav) resizeObserver?.observe(nav);

  requestUpdate();
  syncNavIndicator();
  indicatorTimer = window.setTimeout(revealIndicators, 700);

  return () => {
    window.clearTimeout(indicatorTimer);
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", onResize);
    window.removeEventListener(HEADER_SYNC_EVENT, onSync);
    document.removeEventListener("keydown", onKeydown);
    menuToggle?.removeEventListener("click", onMenuToggle);
    menuLinks.forEach((link) => link.removeEventListener("click", closeMenu));
    closeMenu();
    header.dataset.bound = "false";
  };
}

export function syncSiteHeader(): void {
  window.dispatchEvent(new Event(HEADER_SYNC_EVENT));
}

export function bindSiteHeader(root: ParentNode = document): void {
  const header = root.querySelector<HTMLElement>(`#${HEADER_CONFIG.headerId}`);
  if (!header || header.dataset.bound === "true") return;

  header.dataset.bound = "true";

  const cleanup = createSiteHeaderController(header);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
    },
    { once: true },
  );
}
