export const EXPERIENCE_TIMELINE_CONFIG = {
  timelineSelector: ".experience-timeline",
  spineSelector: ".experience-timeline__spine",
  itemSelector: ".experience-timeline__item",
  nodeSelector: ".experience-timeline__node",
  nodeOffsetY: 26,
  scrollTriggerRatio: 0.58,
  minSpineProgress: 0.08,
} as const;

export function formatExperienceIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function getSpineProgress(
  nodeCenterYs: readonly number[],
  viewportHeight: number,
  config = EXPERIENCE_TIMELINE_CONFIG,
): number {
  const trigger = viewportHeight * config.scrollTriggerRatio;
  let progress = 0;

  nodeCenterYs.forEach((centerY, i) => {
    if (centerY <= trigger) {
      progress = (i + 1) / nodeCenterYs.length;
    }
  });

  return Math.max(progress, config.minSpineProgress);
}

function getItemNodeCenterY(
  item: HTMLElement,
  config = EXPERIENCE_TIMELINE_CONFIG,
): number {
  const node = item.querySelector<HTMLElement>(config.nodeSelector);
  if (node) {
    const rect = node.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }

  return item.getBoundingClientRect().top + config.nodeOffsetY;
}

export function createExperienceTimelineController(
  timeline: HTMLElement,
): () => void {
  const spine = timeline.querySelector<HTMLElement>(
    EXPERIENCE_TIMELINE_CONFIG.spineSelector,
  );
  const items = timeline.querySelectorAll<HTMLElement>(
    EXPERIENCE_TIMELINE_CONFIG.itemSelector,
  );

  if (!spine || !items.length) return () => {};

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    spine.style.transform = "scaleY(1)";
    return () => {};
  }

  const syncSpine = () => {
    const nodeCenterYs = Array.from(items).map((item) =>
      getItemNodeCenterY(item),
    );
    const progress = getSpineProgress(nodeCenterYs, window.innerHeight);
    spine.style.transform = `scaleY(${progress})`;
  };

  syncSpine();
  window.addEventListener("scroll", syncSpine, { passive: true });
  window.addEventListener("resize", syncSpine, { passive: true });

  return () => {
    window.removeEventListener("scroll", syncSpine);
    window.removeEventListener("resize", syncSpine);
    timeline.dataset.bound = "false";
  };
}

export function bindExperienceTimeline(root: ParentNode = document): void {
  const timeline = root.querySelector<HTMLElement>(
    EXPERIENCE_TIMELINE_CONFIG.timelineSelector,
  );
  if (!timeline || timeline.dataset.bound === "true") return;

  timeline.dataset.bound = "true";

  const cleanup = createExperienceTimelineController(timeline);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
    },
    { once: true },
  );
}
