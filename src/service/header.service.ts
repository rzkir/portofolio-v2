export const HEADER_CONFIG = {
  headerId: "site-header",
  inverseThemeSelector: "[data-header-theme='inverse']",
  menuSelector: "[data-header-menu]",
  menuToggleSelector: "[data-header-menu-toggle]",
  menuLinkSelector: "[data-header-menu-link]",
  scrollThreshold: 12,
  mobileBreakpoint: 768,
} as const;

export function isHeaderInverse(
  header: HTMLElement,
  scrollY: number,
  inverseSections: NodeListOf<HTMLElement>,
): boolean {
  const probeY = scrollY + header.offsetHeight * 0.5;

  for (const section of inverseSections) {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (probeY >= top && probeY < bottom) return true;
  }

  return false;
}

export function createSiteHeaderController(header: HTMLElement): () => void {
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

  const setMenuOpen = (open: boolean) => {
    header.classList.toggle("is-menu-open", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
    menu?.setAttribute("aria-hidden", String(!open));
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
    const open = !header.classList.contains("is-menu-open");
    setMenuOpen(open);
  };

  const onResize = () => {
    if (window.innerWidth >= HEADER_CONFIG.mobileBreakpoint) closeMenu();
    requestUpdate();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeMenu();
  };

  menuToggle?.addEventListener("click", onMenuToggle);
  menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("keydown", onKeydown);

  requestUpdate();

  return () => {
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKeydown);
    menuToggle?.removeEventListener("click", onMenuToggle);
    menuLinks.forEach((link) => link.removeEventListener("click", closeMenu));
    closeMenu();
    header.dataset.bound = "false";
  };
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
