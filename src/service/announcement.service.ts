export const ANNOUNCEMENT_CONFIG = {
  bannerId: "announcement-banner",
  hiddenClass: "is-announcement-hidden",
  scrollThreshold: 8,
  scrollDelta: 4,
} as const;

export function createAnnouncementController(
  root: HTMLElement = document.documentElement,
): () => void {
  const banner = document.getElementById(ANNOUNCEMENT_CONFIG.bannerId);
  if (!banner) return () => {};

  let ticking = false;
  let isHidden = false;
  let lastScrollY = window.scrollY;

  const setHidden = (shouldHide: boolean) => {
    if (shouldHide === isHidden) return;
    isHidden = shouldHide;
    root.classList.toggle(ANNOUNCEMENT_CONFIG.hiddenClass, shouldHide);
  };

  const update = () => {
    ticking = false;

    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    if (currentScrollY <= ANNOUNCEMENT_CONFIG.scrollThreshold) {
      setHidden(false);
    } else if (delta > ANNOUNCEMENT_CONFIG.scrollDelta) {
      setHidden(true);
    } else if (delta < -ANNOUNCEMENT_CONFIG.scrollDelta) {
      setHidden(false);
    }

    lastScrollY = currentScrollY;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });

  return () => {
    window.removeEventListener("scroll", requestUpdate);
    root.classList.remove(ANNOUNCEMENT_CONFIG.hiddenClass);
    banner.dataset.bound = "false";
  };
}

export function bindAnnouncementBanner(root: ParentNode = document): void {
  const banner = root.querySelector<HTMLElement>(
    `#${ANNOUNCEMENT_CONFIG.bannerId}`,
  );
  if (!banner || banner.dataset.bound === "true") return;

  banner.dataset.bound = "true";

  const cleanup = createAnnouncementController();

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
    },
    { once: true },
  );
}
