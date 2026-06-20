type CursorState = "default" | "hover" | "grab" | "grabbing" | "focus";
type CursorSurface = "light" | "invert";

const INVERSE_SELECTOR =
  '[data-header-theme="inverse"], [data-cursor-surface="invert"], .bg-accent, .bg-foreground';

let colorCtx: CanvasRenderingContext2D | null = null;

function parseColor(color: string) {
  if (!colorCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    colorCtx = canvas.getContext("2d");
  }
  if (!colorCtx) return null;

  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = color;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;

  return { r, g, b };
}

function getLuminance(color: string) {
  const rgb = parseColor(color);
  if (!rgb) return 1;

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function getEffectiveBackground(el: Element) {
  let node: Element | null = el;

  while (node) {
    const { backgroundColor } = getComputedStyle(node);
    if (
      backgroundColor &&
      backgroundColor !== "rgba(0, 0, 0, 0)" &&
      backgroundColor !== "transparent"
    ) {
      return backgroundColor;
    }
    node = node.parentElement;
  }

  return getComputedStyle(document.body).backgroundColor;
}

function getTargetAt(x: number, y: number) {
  const cursorEl = document.getElementById("grab-cursor");
  if (!cursorEl) return document.elementFromPoint(x, y);

  const previousVisibility = cursorEl.style.visibility;
  cursorEl.style.visibility = "hidden";
  const target = document.elementFromPoint(x, y);
  cursorEl.style.visibility = previousVisibility;

  return target;
}

function resolveSurface(x: number, y: number): CursorSurface {
  const target = getTargetAt(x, y);
  if (!(target instanceof Element)) return "light";

  if (target.closest(INVERSE_SELECTOR)) return "invert";

  return getLuminance(getEffectiveBackground(target)) < 0.72 ? "invert" : "light";
}

type PopoverCursor = HTMLElement & {
  showPopover: () => void;
  hidePopover: () => void;
  matches: (selectors: string) => boolean;
};

function bindDialogCursorLayer(cursor: HTMLElement, reveal: () => void) {
  const elevate = () => {
    const openDialog = document.querySelector("dialog[data-dialog][open]");

    if ("showPopover" in cursor) {
      const popover = cursor as PopoverCursor;
      if (openDialog) {
        if (popover.matches(":popover-open")) popover.hidePopover();
        popover.showPopover();
      } else if (!popover.matches(":popover-open")) {
        popover.showPopover();
      }
      reveal();
      return;
    }

    if (openDialog instanceof HTMLDialogElement) {
      if (cursor.parentElement !== openDialog) openDialog.appendChild(cursor);
      reveal();
      return;
    }

    if (cursor.parentElement !== document.body) document.body.appendChild(cursor);
  };

  const restore = () => {
    if ("hidePopover" in cursor) {
      const popover = cursor as PopoverCursor;
      if (!popover.matches(":popover-open")) popover.showPopover();
      return;
    }

    if (cursor.parentElement !== document.body) document.body.appendChild(cursor);
  };

  document.querySelectorAll("dialog[data-dialog]").forEach((node) => {
    if (!(node instanceof HTMLDialogElement)) return;
    if (node.dataset.cursorLayerBound === "true") return;
    node.dataset.cursorLayerBound = "true";

    node.addEventListener("close", restore);
    new MutationObserver(elevate).observe(node, {
      attributes: true,
      attributeFilter: ["open"],
    });
  });

  elevate();
}

export function initGrabCursor() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (!finePointer || reducedMotion) return;

  const cursorRoot = document.getElementById("grab-cursor");
  if (!cursorRoot) return;

  if (cursorRoot.dataset.bound === "true") {
    bindDialogCursorLayer(cursorRoot, () => {
      cursorRoot.classList.add("is-visible");
    });
    return;
  }

  const cursor: HTMLElement = cursorRoot;
  const labelEl = cursor.querySelector<HTMLElement>(".grab-cursor__label");
  cursor.dataset.bound = "true";
  cursor.dataset.surface = "light";
  document.documentElement.classList.add("has-custom-cursor");

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let cx = mx;
  let cy = my;
  let rafId = 0;
  let visible = false;
  let state: CursorState = "default";
  let surface: CursorSurface = "light";
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

  function syncFocusMode(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      delete cursor.dataset.focusLink;
      return;
    }

    const focusEl = target.closest(focusSelector);
    if (focusEl?.matches("a, button, [role='button']")) {
      cursor.dataset.focusLink = "true";
      return;
    }

    delete cursor.dataset.focusLink;
  }

  function setSurface(next: CursorSurface) {
    if (surface === next) return;
    surface = next;
    cursor.dataset.surface = next;
  }

  function syncSurface(x: number, y: number) {
    setSurface(resolveSurface(x, y));
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
    syncSurface(mx, my);
    rafId = requestAnimationFrame(tick);
  }

  function show() {
    if (visible) return;
    visible = true;
    cursor.classList.add("is-visible");
    rafId = requestAnimationFrame(tick);
  }

  function hide() {
    if (document.querySelector("dialog[data-dialog][open]")) return;
    visible = false;
    cursor.classList.remove("is-visible");
    cancelAnimationFrame(rafId);
  }

  window.addEventListener(
    "mousemove",
    (event) => {
      mx = event.clientX;
      my = event.clientY;
      syncSurface(mx, my);
      show();
    },
    { passive: true },
  );

  document.documentElement.addEventListener("mouseleave", hide);

  document.addEventListener("mouseover", (event) => {
    if (state === "grabbing") return;
    overGrab = event.target instanceof Element && Boolean(event.target.closest(grabSelector));
    syncLabel(event.target);
    syncFocusMode(event.target);
    setState(resolveState(event.target));
    if (event instanceof MouseEvent) syncSurface(event.clientX, event.clientY);
  });

  document.addEventListener("mousedown", () => {
    cursor.dataset.pressed = "true";
    setState(overGrab || state === "grab" ? "grabbing" : state === "focus" ? "focus" : "hover");
  });

  document.addEventListener("mouseup", (event) => {
    delete cursor.dataset.pressed;
    syncLabel(event.target);
    syncFocusMode(event.target);
    setState(resolveState(event.target));
  });

  bindDialogCursorLayer(cursor, show);
}
