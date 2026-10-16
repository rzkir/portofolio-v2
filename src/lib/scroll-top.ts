const SCROLL_TOP_ID = "scroll-top-fab";
const SCROLL_THRESHOLD = 320;

export function bindScrollTop(root: ParentNode = document): void {
  const fab = root.getElementById(SCROLL_TOP_ID);
  if (!fab || fab.dataset.bound === "true") return;

  fab.dataset.bound = "true";

  let visible = false;

  const update = () => {
    const shouldShow = window.scrollY > SCROLL_THRESHOLD;
    if (shouldShow === visible) return;

    visible = shouldShow;
    fab.dataset.visible = shouldShow ? "true" : "false";
    fab.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (shouldShow) fab.removeAttribute("tabindex");
    else fab.setAttribute("tabindex", "-1");
  };

  fab.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });

  update();
  window.addEventListener("scroll", update, { passive: true });
}
