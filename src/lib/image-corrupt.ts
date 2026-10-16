const BOUND = "imageFallbackBound";

function hasLoadedSource(img: HTMLImageElement): boolean {
  return Boolean(img.currentSrc || img.getAttribute("src"));
}

function isBroken(img: HTMLImageElement): boolean {
  return (
    hasLoadedSource(img) &&
    img.complete &&
    img.naturalWidth === 0 &&
    img.naturalHeight === 0
  );
}

function showWrappedFallback(img: HTMLImageElement): void {
  const root = img.closest("[data-safe-image]") ?? img.parentElement;
  const fallback = root?.querySelector<HTMLElement>("[data-safe-image-fallback]");
  if (!fallback) return;

  img.style.visibility = "hidden";
  img.setAttribute("aria-hidden", "true");
  fallback.hidden = false;
  fallback.classList.remove("hidden");
}

function showClonedFallback(img: HTMLImageElement): void {
  if (img.dataset.imageCorruptReplaced === "true") return;

  const template = document.getElementById(
    "image-corrupt-template",
  ) as HTMLTemplateElement | null;
  const clone = template?.content.firstElementChild?.cloneNode(true);
  if (!(clone instanceof HTMLElement)) return;

  img.dataset.imageCorruptReplaced = "true";
  clone.classList.add(...img.classList);
  img.replaceWith(clone);
}

function bindImage(img: HTMLImageElement, wrapped: boolean): void {
  if (img.dataset[BOUND] === "true") return;
  img.dataset[BOUND] = "true";

  const show = () => {
    if (!hasLoadedSource(img)) return;
    if (wrapped) showWrappedFallback(img);
    else showClonedFallback(img);
  };

  img.addEventListener("error", show);
  if (isBroken(img)) show();
}

export function bindImageCorruptFallback(root: ParentNode = document): void {
  root.querySelectorAll("[data-safe-image]").forEach((wrap) => {
    const img = wrap.querySelector("img");
    if (img) bindImage(img, true);
  });

  root
    .querySelectorAll<HTMLImageElement>("[data-image-fallback-root] img")
    .forEach((img) => {
      if (img.closest("[data-safe-image]")) return;
      bindImage(img, false);
    });
}
