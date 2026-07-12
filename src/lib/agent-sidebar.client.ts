function setSidebarToggleIcon(
  toggle: HTMLButtonElement,
  isOpen: boolean,
): void {
  const openIcon = toggle.querySelector<SVGElement>(
    ".agent-sidebar-toggle__open",
  );
  const closeIcon = toggle.querySelector<SVGElement>(
    ".agent-sidebar-toggle__close",
  );

  openIcon?.classList.toggle("hidden", isOpen);
  closeIcon?.classList.toggle("hidden", !isOpen);
}

export function bindAgentSidebar(root: ParentNode = document): void {
  const shell = root.querySelector<HTMLElement>(".agent-shell");
  if (!shell || shell.dataset.sidebarBound === "true") return;
  shell.dataset.sidebarBound = "true";

  const toggle = root.querySelector<HTMLButtonElement>("#agent-sidebar-toggle");
  const sidebar = root.querySelector<HTMLElement>("#agent-sidebar");
  const backdrop = root.querySelector<HTMLElement>("#agent-sidebar-backdrop");
  if (!toggle || !sidebar || !backdrop) return;

  const openNavigation =
    toggle.dataset.openLabel?.trim() || "Open navigation";
  const closeNavigation =
    toggle.dataset.closeLabel?.trim() || "Close navigation";

  const open = () => {
    if (window.matchMedia("(min-width: 768px)").matches) return;

    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    backdrop.classList.remove("pointer-events-none", "opacity-0");
    backdrop.classList.add("opacity-100");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", closeNavigation);
    setSidebarToggleIcon(toggle, true);
    document.body.classList.add("overflow-hidden");
  };

  const close = () => {
    sidebar.classList.add("-translate-x-full");
    sidebar.classList.remove("translate-x-0");
    backdrop.classList.add("pointer-events-none", "opacity-0");
    backdrop.classList.remove("opacity-100");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", openNavigation);
    setSidebarToggleIcon(toggle, false);
    document.body.classList.remove("overflow-hidden");
  };

  const onToggle = () => {
    if (toggle.getAttribute("aria-expanded") === "true") close();
    else open();
  };

  const onSidebarClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest("a[href]");
    if (!link || !sidebar.contains(link)) return;
    close();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };

  const onResize = () => {
    if (window.matchMedia("(min-width: 768px)").matches) close();
  };

  toggle.addEventListener("click", onToggle);
  backdrop.addEventListener("click", close);
  sidebar.addEventListener("click", onSidebarClick);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      toggle.removeEventListener("click", onToggle);
      backdrop.removeEventListener("click", close);
      sidebar.removeEventListener("click", onSidebarClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("overflow-hidden");
      shell.dataset.sidebarBound = "false";
    },
    { once: true },
  );
}
