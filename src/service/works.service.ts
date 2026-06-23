import { projects, type Project } from "@/data/portfolio";

type Work = Project;

export const WORKS_SCROLL_CONFIG = {
  sectionSelector: "[data-works-scroll]",
  transitionStart: 0.48,
  followSpeed: 14,
  settleEpsilon: 0.0005,
} as const;

/** Semua karya untuk section scroll. */
export function getWorks(): Work[] {
  return projects;
}

/** Tinggi section scroll = jumlah slide × viewport. */
export function getWorksScrollVh(count: number): number {
  return Math.max(count, 1) * 100;
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function getScrollProgress(
  scrollY: number,
  stageStart: number,
  scrollRange: number,
): number {
  if (scrollRange <= 0) return 0;

  return Math.min(Math.max((scrollY - stageStart) / scrollRange, 0), 1);
}

export function getTargetVisualIndex(
  progress: number,
  count: number,
  transitionStart = WORKS_SCROLL_CONFIG.transitionStart,
): number {
  const maxIndex = count - 1;
  if (maxIndex <= 0) return 0;

  const segmentSize = 1 / maxIndex;
  const scaled = progress / segmentSize;
  const baseIndex = Math.min(maxIndex, Math.floor(scaled + 0.0001));
  const local = scaled - baseIndex;

  const raw =
    local <= transitionStart
      ? 0
      : (local - transitionStart) / (1 - transitionStart);

  return baseIndex + smoothstep(raw);
}

export function formatWorksCounter(index: number, count: number): string {
  return `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
}

function setWorksAnimateState(el: HTMLElement, visible: boolean): void {
  el.dataset.ready = "true";

  if (el.hasAttribute("data-astro-fade-in-text")) {
    el.dataset.state = visible ? "animate" : "hidden";
    return;
  }

  if (el.hasAttribute("data-astro-scale-in")) {
    el.dataset.state = visible ? "visible" : "hidden";
  }
}

function syncWorksSlideAnimations(
  slides: NodeListOf<HTMLElement>,
  activeIndex: number,
): void {
  slides.forEach((slide, i) => {
    const visible = i === activeIndex;
    slide.querySelectorAll<HTMLElement>(
      "[data-astro-fade-in-text][data-enhance='true'], [data-astro-scale-in][data-enhance='true']",
    ).forEach((el) => setWorksAnimateState(el, visible));
  });
}

export function createWorksScrollController(section: HTMLElement): () => void {
  const track = section.querySelector<HTMLElement>("[data-works-track]");
  const bar = section.querySelector<HTMLElement>("[data-works-bar]");
  const counter = section.querySelector<HTMLElement>("[data-works-counter]");
  const slides = section.querySelectorAll<HTMLElement>("[data-works-slide]");
  const count = slides.length;

  if (!track || count <= 1) return () => { };

  const viewport = section.querySelector<HTMLElement>(".works-scroll__viewport");
  const stage = section.querySelector<HTMLElement>("[data-works-stage]");
  if (!viewport || !stage) return () => { };

  let slideHeight = 0;
  let scrollRange = 0;
  let currentVisualIndex = 0;
  let activeSlideIndex = -1;
  let rafId = 0;
  let lastTime = 0;
  let resizeObserver: ResizeObserver | undefined;

  const measureStage = () => {
    scrollRange = Math.max(stage.offsetHeight - window.innerHeight, 0);
  };

  const getStageStart = () =>
    stage.getBoundingClientRect().top + window.scrollY;

  const layoutSlides = () => {
    slideHeight = viewport.clientHeight;
    if (slideHeight <= 0) return;

    track.style.height = `${slideHeight * count}px`;
    slides.forEach((slide) => {
      slide.style.height = `${slideHeight}px`;
      slide.style.minHeight = `${slideHeight}px`;
    });

    measureStage();
  };

  const render = (time: number) => {
    if (slideHeight <= 0) {
      rafId = 0;
      return;
    }

    measureStage();

    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
    lastTime = time;

    const progress = getScrollProgress(
      window.scrollY,
      getStageStart(),
      scrollRange,
    );
    const targetVisualIndex = getTargetVisualIndex(progress, count);
    const follow = 1 - Math.exp(-dt * WORKS_SCROLL_CONFIG.followSpeed);
    currentVisualIndex += (targetVisualIndex - currentVisualIndex) * follow;

    const offset = currentVisualIndex * slideHeight;
    track.style.transform = `translate3d(0, ${-offset}px, 0)`;

    const index = Math.min(
      count - 1,
      Math.max(0, Math.round(currentVisualIndex)),
    );

    if (index !== activeSlideIndex) {
      activeSlideIndex = index;
      syncWorksSlideAnimations(slides, index);
    }

    if (bar) {
      bar.style.width = `${((currentVisualIndex + 1) / count) * 100}%`;
    }

    if (counter) {
      counter.textContent = formatWorksCounter(index, count);
    }

    const settling =
      Math.abs(targetVisualIndex - currentVisualIndex) >
      WORKS_SCROLL_CONFIG.settleEpsilon;
    const inStage = progress > 0 && progress < 1;

    if (settling || inStage) {
      rafId = requestAnimationFrame(render);
    } else {
      rafId = 0;
    }
  };

  const kickRender = () => {
    if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(render);
    }
  };

  const onResize = () => {
    layoutSlides();
    currentVisualIndex = getTargetVisualIndex(
      getScrollProgress(window.scrollY, getStageStart(), scrollRange),
      count,
    );
    kickRender();
  };

  layoutSlides();
  currentVisualIndex = getTargetVisualIndex(
    getScrollProgress(window.scrollY, getStageStart(), scrollRange),
    count,
  );
  kickRender();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      layoutSlides();
      kickRender();
    });
    resizeObserver.observe(viewport);
    resizeObserver.observe(stage);
  }

  window.addEventListener("scroll", kickRender, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    cancelAnimationFrame(rafId);
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", kickRender);
    window.removeEventListener("resize", onResize);
    section.dataset.bound = "false";
  };
}

export function bindWorksScroll(root: ParentNode = document): void {
  const section = root.querySelector<HTMLElement>(
    WORKS_SCROLL_CONFIG.sectionSelector,
  );
  if (!section || section.dataset.bound === "true") return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  section.dataset.bound = "true";

  const cleanup = createWorksScrollController(section);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
    },
    { once: true },
  );
}
