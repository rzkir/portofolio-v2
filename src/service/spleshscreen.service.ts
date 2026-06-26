import { syncSiteHeader } from "@/service/header.service";

export const SPLASH_CONFIG = {
  splashId: "splash-screen",
  progressId: "splash-progress",
  holdMs: 2000,
  exitMs: 400,
  sessionKey: "splash-seen",
} as const;

function totalMs(): number {
  return SPLASH_CONFIG.holdMs + SPLASH_CONFIG.exitMs;
}

function restartSiteHeaderReveal(): void {
  const header = document.getElementById("site-header");
  if (!header) return;

  header
    .querySelectorAll<HTMLElement>(
      ".animate-focus, .site-header__mobile-dock, .site-header__nav-indicator",
    )
    .forEach((el) => {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
}

function unlockPage(): void {
  document.documentElement.classList.remove("splash-pending");
  restartSiteHeaderReveal();
  syncSiteHeader();
}

function setSplashProgress(progressEl: HTMLElement, value: number): void {
  progressEl.textContent = String(Math.min(100, Math.max(0, value))).padStart(
    3,
    "0",
  );
}

function animateSplashProgress(
  progressEl: HTMLElement,
  startTime: number,
): boolean {
  const elapsed = performance.now() - startTime;
  const ratio = Math.min(elapsed / totalMs(), 1);
  setSplashProgress(progressEl, Math.round(ratio * 100));
  return ratio < 1;
}

function finishSplash(splash: HTMLElement): void {
  try {
    sessionStorage.setItem(SPLASH_CONFIG.sessionKey, "1");
  } catch (_) {}
  unlockPage();
  document.documentElement.classList.add("splash-seen");
  splash.remove();
}

export function createSplashController(splash: HTMLElement): () => void {
  let exitTimer = 0;
  let doneTimer = 0;
  let progressRaf = 0;
  const progressEl = document.getElementById(SPLASH_CONFIG.progressId);

  const startSequence = () => {
    if (progressEl) {
      const startTime = performance.now();
      const tickProgress = () => {
        if (!progressEl) return;
        if (animateSplashProgress(progressEl, startTime)) {
          progressRaf = requestAnimationFrame(tickProgress);
        }
      };
      progressRaf = requestAnimationFrame(tickProgress);
    }

    exitTimer = window.setTimeout(() => {
      splash.removeAttribute("data-header-theme");
      unlockPage();
      splash.classList.add("is-exiting");
    }, SPLASH_CONFIG.holdMs);

    doneTimer = window.setTimeout(() => {
      if (progressEl) setSplashProgress(progressEl, 100);
      finishSplash(splash);
    }, totalMs());
  };

  requestAnimationFrame(startSequence);

  return () => {
    window.clearTimeout(exitTimer);
    window.clearTimeout(doneTimer);
    cancelAnimationFrame(progressRaf);
    splash.dataset.bound = "false";
  };
}

export function bindSplashScreen(root: ParentNode = document): void {
  const splash = root.getElementById(SPLASH_CONFIG.splashId);
  if (!splash || splash.dataset.bound === "true") return;

  if (document.documentElement.classList.contains("splash-seen")) {
    splash.remove();
    syncSiteHeader();
    return;
  }

  if (!document.documentElement.classList.contains("splash-pending")) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishSplash(splash);
    return;
  }

  splash.dataset.bound = "true";

  const cleanup = createSplashController(splash);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
    },
    { once: true },
  );
}
