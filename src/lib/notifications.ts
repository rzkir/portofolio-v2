export const NOTIFICATION_TEMPLATE_ID = "notification-template";
export const NOTIFICATION_EVENT = "app:notify";
export const NOTIFICATION_DISMISS_EVENT = "app:notify-dismiss";

export type NotificationVariant = "default" | "success" | "error" | "info";

export type NotificationPayload = {
  id: string;
  title: string;
  description?: string;
  variant: NotificationVariant;
  duration: number;
};

const VARIANT_LABELS: Record<NotificationVariant, string> = {
  default: "Notice",
  success: "Done",
  error: "Error",
  info: "Note",
};

const DEFAULT_DURATION = 4500;
const MAX_VISIBLE = 4;

const timers = new Map<string, number>();

function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function notify(options: {
  title: string;
  description?: string;
  variant?: NotificationVariant;
  duration?: number;
}): string {
  const id = generateId();
  const detail: NotificationPayload = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant ?? "default",
    duration: options.duration ?? DEFAULT_DURATION,
  };

  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail }));
  return id;
}

export const toast = {
  show: notify,
  success(title: string, description?: string) {
    return notify({ title, description, variant: "success" });
  },
  error(title: string, description?: string) {
    return notify({ title, description, variant: "error" });
  },
  info(title: string, description?: string) {
    return notify({ title, description, variant: "info" });
  },
  dismiss(id: string) {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_DISMISS_EVENT, { detail: { id } }),
    );
  },
};

function dismissToast(el: HTMLElement, id: string): void {
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }

  if (el.classList.contains("is-exiting")) return;

  el.classList.add("is-exiting");

  const remove = () => el.remove();
  el.addEventListener("animationend", remove, { once: true });
  window.setTimeout(remove, 480);
}

function scheduleDismiss(el: HTMLElement, id: string, duration: number): void {
  if (duration <= 0) return;

  const timer = window.setTimeout(() => dismissToast(el, id), duration);
  timers.set(id, timer);

  el.addEventListener("mouseenter", () => {
    const active = timers.get(id);
    if (active) window.clearTimeout(active);
  });

  el.addEventListener("mouseleave", () => {
    const next = window.setTimeout(() => dismissToast(el, id), 1600);
    timers.set(id, next);
  });
}

function createToastElement(
  item: NotificationPayload,
  template: HTMLTemplateElement,
): HTMLElement {
  const node = template.content.firstElementChild?.cloneNode(true);
  if (!(node instanceof HTMLElement)) {
    throw new Error("Notification template is missing a root element.");
  }

  node.dataset.notificationId = item.id;
  node.classList.add(`notification--${item.variant}`);

  const label = node.querySelector("[data-notification-label]");
  const title = node.querySelector("[data-notification-title]");
  const description = node.querySelector("[data-notification-description]");

  if (label) label.textContent = VARIANT_LABELS[item.variant];
  if (title) title.textContent = item.title;

  if (description) {
    if (item.description) {
      description.textContent = item.description;
      description.classList.remove("hidden");
    } else {
      description.textContent = "";
      description.classList.add("hidden");
    }
  }

  node
    .querySelector<HTMLButtonElement>("[data-notification-dismiss]")
    ?.addEventListener("click", () => dismissToast(node, item.id));

  scheduleDismiss(node, item.id, item.duration);

  return node;
}

function trimStack(viewport: HTMLElement): void {
  const items = viewport.querySelectorAll<HTMLElement>("[data-notification-id]");
  const excess = items.length - MAX_VISIBLE;
  if (excess <= 0) return;

  for (let i = 0; i < excess; i += 1) {
    const el = items[i];
    const id = el?.dataset.notificationId;
    if (el && id) dismissToast(el, id);
  }
}

export function bindNotifications(root: ParentNode = document): void {
  const viewport = root.querySelector<HTMLElement>("[data-notification-viewport]");
  const template = root.getElementById(
    NOTIFICATION_TEMPLATE_ID,
  ) as HTMLTemplateElement | null;

  if (!viewport || !template || viewport.dataset.bound === "true") return;

  viewport.dataset.bound = "true";

  const onNotify = (event: Event) => {
    const detail = (event as CustomEvent<NotificationPayload>).detail;
    if (!detail?.id) return;

    const el = createToastElement(detail, template);
    viewport.appendChild(el);
    trimStack(viewport);
  };

  const onDismiss = (event: Event) => {
    const id = (event as CustomEvent<{ id: string }>).detail?.id;
    if (!id) return;

    const el = viewport.querySelector<HTMLElement>(
      `[data-notification-id="${id}"]`,
    );
    if (el) dismissToast(el, id);
  };

  window.addEventListener(NOTIFICATION_EVENT, onNotify);
  window.addEventListener(NOTIFICATION_DISMISS_EVENT, onDismiss);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      window.removeEventListener(NOTIFICATION_EVENT, onNotify);
      window.removeEventListener(NOTIFICATION_DISMISS_EVENT, onDismiss);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      viewport.dataset.bound = "false";
    },
    { once: true },
  );
}
