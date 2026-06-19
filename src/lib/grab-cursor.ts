type CursorState = "default" | "hover" | "grab" | "grabbing" | "focus";

export function initGrabCursor() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (!finePointer || reducedMotion) return;

  const cursorRoot = document.getElementById("grab-cursor");
  if (!cursorRoot || cursorRoot.dataset.bound === "true") return;

  const cursor: HTMLElement = cursorRoot;
  const labelEl = cursor.querySelector<HTMLElement>(".grab-cursor__label");
  cursor.dataset.bound = "true";
  document.documentElement.classList.add("has-custom-cursor");

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let cx = mx;
  let cy = my;
  let rafId = 0;
  let visible = false;
  let state: CursorState = "default";
  let overGrab = false;

  const hoverSelector =
    "a, button, [data-dialog-open], input, textarea, select, summary, [role='button'], [data-cursor='hover']";
  const grabSelector = "[data-cursor='grab']";
  const focusSelector = "[data-cursor='focus']";

  function setLabel(text: string) {
    if (labelEl) labelEl.textContent = text;
  }

  function setState(next: CursorState) {
    state = next;
    cursor.dataset.state = next;
  }

  function resolveState(target: EventTarget | null): CursorState {
    if (!(target instanceof Element)) return "default";
    if (target.closest(grabSelector)) return "grab";
    if (target.closest(focusSelector)) return "focus";
    if (target.closest(hoverSelector)) return "hover";
    return "default";
  }

  function syncLabel(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      setLabel("Grab");
      return;
    }

    const focusEl = target.closest(focusSelector);
    if (focusEl) {
      setLabel(focusEl.getAttribute("data-cursor-label") || "View");
      return;
    }

    if (target.closest(grabSelector)) {
      setLabel("Grab");
      return;
    }

    setLabel("Grab");
  }

  function tick() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    rafId = requestAnimationFrame(tick);
  }

  function show() {
    if (visible) return;
    visible = true;
    cursor.classList.add("is-visible");
    rafId = requestAnimationFrame(tick);
  }

  function hide() {
    visible = false;
    cursor.classList.remove("is-visible");
    cancelAnimationFrame(rafId);
  }

  window.addEventListener(
    "mousemove",
    (event) => {
      mx = event.clientX;
      my = event.clientY;
      show();
    },
    { passive: true },
  );

  document.documentElement.addEventListener("mouseleave", hide);

  document.addEventListener("mouseover", (event) => {
    if (state === "grabbing") return;
    overGrab = event.target instanceof Element && Boolean(event.target.closest(grabSelector));
    syncLabel(event.target);
    setState(resolveState(event.target));
  });

  document.addEventListener("mousedown", () => {
    setState(overGrab || state === "grab" ? "grabbing" : state === "focus" ? "focus" : "hover");
  });

  document.addEventListener("mouseup", (event) => {
    syncLabel(event.target);
    setState(resolveState(event.target));
  });
}
