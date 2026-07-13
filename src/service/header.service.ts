export const HEADER_SYNC_EVENT = "site-header:sync";

export const HEADER_CONFIG = {
  headerId: "site-header",
  inverseThemeSelector: "[data-header-theme='inverse']",
  navSelector: "[data-header-nav]",
  navMobileSelector: "[data-header-nav-mobile]",
  navLinkSelector: "[data-header-nav-link]",
  navIndicatorSelector: "[data-header-nav-indicator]",
  scrollThreshold: 12,
  mobileBreakpoint: 1024,
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

function scrollActiveNavLinkIntoView(nav: HTMLElement): void {
  if (nav.scrollWidth <= nav.clientWidth) return;

  const active = nav.querySelector<HTMLElement>(
    `${HEADER_CONFIG.navLinkSelector}[aria-current="page"]`,
  );
  if (!active) return;

  active.scrollIntoView({
    inline: "center",
    block: "nearest",
    behavior: "smooth",
  });
}

export function createSiteHeaderController(header: HTMLElement): () => void {
  const nav = header.querySelector<HTMLElement>(HEADER_CONFIG.navSelector);
  const navMobile = header.querySelector<HTMLElement>(
    HEADER_CONFIG.navMobileSelector,
  );

  const inverseSections = () =>
    document.querySelectorAll<HTMLElement>(HEADER_CONFIG.inverseThemeSelector);

  let ticking = false;
  let indicatorTimer = 0;

  const activeNav = () =>
    window.innerWidth < HEADER_CONFIG.mobileBreakpoint ? navMobile : nav;

  const syncNavIndicator = () => {
    const currentNav = activeNav();
    if (!currentNav) return;
    updateNavIndicator(currentNav);
  };

  const revealIndicators = () => {
    syncNavIndicator();
    header
      .querySelectorAll<HTMLElement>(HEADER_CONFIG.navIndicatorSelector)
      .forEach((indicator) => indicator.classList.add("is-visible"));
    if (navMobile) scrollActiveNavLinkIntoView(navMobile);
  };

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

  const onResize = () => {
    requestUpdate();
    syncNavIndicator();
    if (navMobile && window.innerWidth < HEADER_CONFIG.mobileBreakpoint) {
      scrollActiveNavLinkIntoView(navMobile);
    }
  };

  const onSync = () => {
    requestUpdate();
    syncNavIndicator();
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener(HEADER_SYNC_EVENT, onSync);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => syncNavIndicator())
      : null;
  if (nav) resizeObserver?.observe(nav);
  if (navMobile) resizeObserver?.observe(navMobile);

  requestUpdate();
  syncNavIndicator();
  indicatorTimer = window.setTimeout(revealIndicators, 700);

  return () => {
    window.clearTimeout(indicatorTimer);
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", onResize);
    window.removeEventListener(HEADER_SYNC_EVENT, onSync);
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
