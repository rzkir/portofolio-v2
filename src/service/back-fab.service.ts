export function bindBackFab(
  id: string,
  root: ParentNode = document,
  threshold = 160,
): void {
  const fab = root.getElementById(id);
  if (!fab || fab.dataset.bound === "true") return;

  fab.dataset.bound = "true";

  let visible = false;

  const update = () => {
    const shouldShow = window.scrollY > threshold;
    if (shouldShow === visible) return;

    visible = shouldShow;
    fab.dataset.visible = shouldShow ? "true" : "false";
    fab.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}
