function replayFadeIn(root: ParentNode) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  root
    .querySelectorAll<HTMLElement>(
      '[data-astro-fade-in-text][data-enhance="true"]',
    )
    .forEach((el) => {
      el.dataset.ready = "true";
      el.dataset.state = "hidden";

      requestAnimationFrame(() => {
        el.dataset.state = "animate";
      });
    });
}

export function bindCvDialogAnimations(root: ParentNode = document): void {
  const dialog = root.querySelector("#cv-dialog");
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (dialog.dataset.cvAnimBound === "true") return;
  dialog.dataset.cvAnimBound = "true";

  const play = () => {
    requestAnimationFrame(() => replayFadeIn(dialog));
  };

  root
    .querySelectorAll<HTMLElement>('[data-dialog-open="cv-dialog"]')
    .forEach((trigger) => {
      trigger.addEventListener("click", play);
    });
}
