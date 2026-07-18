import { toast } from "@/lib/notifications";

export const SETTINGS_STORAGE_KEY = "agent-settings";
export const SETTINGS_CHANGE_EVENT = "agent-settings:change";
export const DRAFT_STORAGE_PREFIX = "agent-draft:";

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  desktopNotifications: true,
  autoSaveDrafts: true,
  betaFeatures: false,
  agentResponses: true,
  weeklyDigest: false,
  conciseResponses: false,
  rememberContext: true,
  notificationSound: "iphone",
};

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: "iphone",
    label: "iPhone",
    src: "/notifications/IPHONE_NOTIFICATION.mp3",
  },
  {
    id: "computer",
    label: "Computer",
    src: "/notifications/Computer_Notification.mp3",
  },
  {
    id: "off",
    label: "Off",
    src: "",
  },
];

const AUTOSAVE_INTERVAL_MS = 30_000;
const DRAFT_DEBOUNCE_MS = 600;

let cachedSettings: AgentSettings | null = null;
let audioContext: HTMLAudioElement | null = null;
let audioUnlocked = false;
let draftTimer: number | null = null;
let autosaveTimer: number | null = null;
let isContextBound = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNotificationSoundId(value: unknown): value is NotificationSoundId {
  return value === "computer" || value === "iphone" || value === "off";
}

function normalizeSettings(value: unknown): AgentSettings {
  const source =
    value && typeof value === "object" ? (value as Partial<AgentSettings>) : {};

  return {
    desktopNotifications: isBoolean(source.desktopNotifications)
      ? source.desktopNotifications
      : DEFAULT_AGENT_SETTINGS.desktopNotifications,
    autoSaveDrafts: isBoolean(source.autoSaveDrafts)
      ? source.autoSaveDrafts
      : DEFAULT_AGENT_SETTINGS.autoSaveDrafts,
    betaFeatures: isBoolean(source.betaFeatures)
      ? source.betaFeatures
      : DEFAULT_AGENT_SETTINGS.betaFeatures,
    agentResponses: isBoolean(source.agentResponses)
      ? source.agentResponses
      : DEFAULT_AGENT_SETTINGS.agentResponses,
    weeklyDigest: isBoolean(source.weeklyDigest)
      ? source.weeklyDigest
      : DEFAULT_AGENT_SETTINGS.weeklyDigest,
    conciseResponses: isBoolean(source.conciseResponses)
      ? source.conciseResponses
      : DEFAULT_AGENT_SETTINGS.conciseResponses,
    rememberContext: isBoolean(source.rememberContext)
      ? source.rememberContext
      : DEFAULT_AGENT_SETTINGS.rememberContext,
    notificationSound: isNotificationSoundId(source.notificationSound)
      ? source.notificationSound
      : DEFAULT_AGENT_SETTINGS.notificationSound,
  };
}

export function getAgentSettings(): AgentSettings {
  if (cachedSettings) return { ...cachedSettings };

  if (!isBrowser()) {
    return { ...DEFAULT_AGENT_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    cachedSettings = raw
      ? normalizeSettings(JSON.parse(raw))
      : { ...DEFAULT_AGENT_SETTINGS };
  } catch {
    cachedSettings = { ...DEFAULT_AGENT_SETTINGS };
  }

  return { ...cachedSettings };
}

export function saveAgentSettings(settings: AgentSettings): void {
  const normalized = normalizeSettings(settings);
  cachedSettings = normalized;

  if (!isBrowser()) return;

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  applyAgentSettings(normalized);
  window.dispatchEvent(
    new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { settings: normalized } }),
  );
}

export function updateAgentSetting<K extends AgentSettingsKey>(
  key: K,
  value: AgentSettings[K],
): AgentSettings {
  const next = { ...getAgentSettings(), [key]: value };
  saveAgentSettings(next);
  return next;
}

export function applyAgentSettings(settings: AgentSettings = getAgentSettings()): void {
  if (!isBrowser()) return;

  document.documentElement.dataset.betaFeatures = settings.betaFeatures
    ? "true"
    : "false";
}

function ensureNotificationAudio(): HTMLAudioElement {
  if (!audioContext) {
    audioContext = new Audio();
    audioContext.preload = "auto";
  }
  return audioContext;
}

/**
 * Browsers block Audio.play() outside a user gesture. Call this on
 * pointer/keydown or when submitting a prompt so later notifications work.
 */
export function unlockNotificationAudio(): void {
  if (!isBrowser() || audioUnlocked) return;

  const sound = NOTIFICATION_SOUNDS.find((item) => item.src);
  if (!sound?.src) return;

  try {
    const audio = ensureNotificationAudio();
    audio.src = sound.src;
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        audioUnlocked = true;
      })
      .catch(() => {
        // still blocked — will retry on next user gesture
      });
  } catch {
    // ignore unlock failures
  }
}

export function playNotificationSound(
  soundId: NotificationSoundId = getAgentSettings().notificationSound,
): void {
  if (!isBrowser() || soundId === "off") return;

  const sound = NOTIFICATION_SOUNDS.find((item) => item.id === soundId);
  if (!sound?.src) return;

  try {
    const audio = ensureNotificationAudio();
    audio.volume = 1;
    audio.src = sound.src;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // autoplay still blocked — unlock on next interaction
      audioUnlocked = false;
    });
  } catch {
    // ignore autoplay restrictions
  }
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowser() || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

export function showDesktopNotification(
  title: string,
  options?: NotificationOptions,
): void {
  if (!isBrowser() || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      ...options,
    });
  } catch {
    // ignore unsupported environments
  }
}

export function notifyAgentResponseComplete(options: {
  category: string;
  model?: string;
}): void {
  const settings = getAgentSettings();
  if (!settings.agentResponses) return;

  const description = options.model
    ? `${options.category} · ${options.model}`
    : options.category;

  toast.success("Agent response ready", description);

  if (settings.notificationSound !== "off") {
    playNotificationSound(settings.notificationSound);
  }

  if (settings.desktopNotifications) {
    showDesktopNotification("Agent response ready", {
      body: description,
      tag: "agent-response",
    });
  }
}

export function prepareAgentMessage(message: string): string {
  if (!getAgentSettings().conciseResponses) return message;
  return `[Prefer concise, direct answers.]\n\n${message}`;
}

export function resolveAgentHistory(
  history?: AgentHistoryItem[],
): AgentHistoryItem[] | undefined {
  if (!getAgentSettings().rememberContext) return undefined;
  return history;
}

export function saveAgentDraft(path: string, value: string): void {
  if (!isBrowser()) return;

  const trimmed = value.trim();
  const key = `${DRAFT_STORAGE_PREFIX}${path}`;

  if (!trimmed) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, trimmed);
}

export function loadAgentDraft(path: string): string {
  if (!isBrowser()) return "";

  try {
    return window.localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${path}`) ?? "";
  } catch {
    return "";
  }
}

export function clearAgentDraft(path: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${path}`);
}

function restorePromptDraft(root: ParentNode = document): void {
  const settings = getAgentSettings();
  const input = root.querySelector<HTMLTextAreaElement>("#main-prompt-input");
  if (!input || !settings.autoSaveDrafts) return;

  const draft = loadAgentDraft(window.location.pathname);
  if (!draft || input.value.trim()) return;

  input.value = draft;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function scheduleDraftSave(value: string): void {
  if (draftTimer) window.clearTimeout(draftTimer);

  draftTimer = window.setTimeout(() => {
    saveAgentDraft(window.location.pathname, value);
  }, DRAFT_DEBOUNCE_MS);
}

function bindDraftAutosave(root: ParentNode = document): () => void {
  const input = root.querySelector<HTMLTextAreaElement>("#main-prompt-input");
  if (!input || input.dataset.draftBound === "true") return () => {};

  input.dataset.draftBound = "true";

  const onInput = () => {
    if (!getAgentSettings().autoSaveDrafts) return;
    scheduleDraftSave(input.value);
  };

  const onFormSubmit = (event: Event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "agent-prompt-form") {
      return;
    }

    clearAgentDraft(window.location.pathname);
  };

  const onSettingsChange = () => {
    if (!getAgentSettings().autoSaveDrafts) {
      clearAgentDraft(window.location.pathname);
      return;
    }

    restorePromptDraft(root);
  };

  input.addEventListener("input", onInput);
  document.addEventListener("submit", onFormSubmit);
  window.addEventListener(SETTINGS_CHANGE_EVENT, onSettingsChange);

  if (autosaveTimer) window.clearInterval(autosaveTimer);
  autosaveTimer = window.setInterval(() => {
    if (!getAgentSettings().autoSaveDrafts || !input.value.trim()) return;
    saveAgentDraft(window.location.pathname, input.value);
  }, AUTOSAVE_INTERVAL_MS);

  restorePromptDraft(root);

  return () => {
    input.removeEventListener("input", onInput);
    document.removeEventListener("submit", onFormSubmit);
    window.removeEventListener(SETTINGS_CHANGE_EVENT, onSettingsChange);
    input.dataset.draftBound = "false";

    if (autosaveTimer) {
      window.clearInterval(autosaveTimer);
      autosaveTimer = null;
    }
  };
}

function syncSettingsToggle(
  root: ParentNode,
  key: AgentSettingsKey,
  checked: boolean,
): void {
  root
    .querySelectorAll<HTMLInputElement>(`[data-settings-key="${key}"]`)
    .forEach((input) => {
      input.checked = checked;
    });
}

function syncNotificationSoundPicker(
  root: ParentNode,
  soundId: NotificationSoundId,
): void {
  root
    .querySelectorAll<HTMLInputElement>('[data-settings-sound]')
    .forEach((input) => {
      input.checked = input.value === soundId;
    });
}

async function handleDesktopNotificationsToggle(
  enabled: boolean,
  input: HTMLInputElement,
): Promise<void> {
  if (!enabled) {
    updateAgentSetting("desktopNotifications", false);
    return;
  }

  const permission = await requestDesktopNotificationPermission();
  if (permission !== "granted") {
    input.checked = false;
    updateAgentSetting("desktopNotifications", false);
    toast.info(
      "Desktop notifications blocked",
      "Allow notifications in your browser to enable alerts.",
    );
    return;
  }

  updateAgentSetting("desktopNotifications", true);
  toast.success("Desktop notifications enabled");
}

export function bindSettingsPage(root: ParentNode = document): () => void {
  const page = root.querySelector("[data-settings-page]");
  if (!page || page.getAttribute("data-bound") === "true") return () => {};

  page.setAttribute("data-bound", "true");

  const settings = getAgentSettings();
  syncSettingsToggle(root, "desktopNotifications", settings.desktopNotifications);
  syncSettingsToggle(root, "autoSaveDrafts", settings.autoSaveDrafts);
  syncSettingsToggle(root, "betaFeatures", settings.betaFeatures);
  syncSettingsToggle(root, "agentResponses", settings.agentResponses);
  syncSettingsToggle(root, "weeklyDigest", settings.weeklyDigest);
  syncSettingsToggle(root, "conciseResponses", settings.conciseResponses);
  syncSettingsToggle(root, "rememberContext", settings.rememberContext);
  syncNotificationSoundPicker(root, settings.notificationSound);

  const onToggleChange = async (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const key = input.dataset.settingsKey as AgentSettingsKey | undefined;
    if (!key) return;

    if (key === "desktopNotifications") {
      await handleDesktopNotificationsToggle(input.checked, input);
      return;
    }

    updateAgentSetting(key, input.checked);

    if (key === "weeklyDigest" && input.checked) {
      toast.info(
        "Weekly digest enabled",
        "You will receive a summary of agent activity each week.",
      );
    }
  };

  const onSoundChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.settingsSound) {
      return;
    }

    const soundId = input.value;
    if (!isNotificationSoundId(soundId)) return;

    updateAgentSetting("notificationSound", soundId);
    if (soundId !== "off") {
      playNotificationSound(soundId);
    }
  };

  const onSoundPreview = (event: Event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "[data-settings-sound-preview]",
    );
    if (!button) return;

    const soundId = button.dataset.settingsSoundPreview;
    if (!isNotificationSoundId(soundId) || soundId === "off") return;

    playNotificationSound(soundId);
  };

  page.addEventListener("change", onToggleChange);
  page.addEventListener("change", onSoundChange);
  page.addEventListener("click", onSoundPreview);

  return () => {
    page.removeEventListener("change", onToggleChange);
    page.removeEventListener("change", onSoundChange);
    page.removeEventListener("click", onSoundPreview);
    page.setAttribute("data-bound", "false");
  };
}

export function bindSettingsContext(root: ParentNode = document): void {
  applyAgentSettings();
  bindDraftAutosave(root);

  if (isContextBound) return;
  isContextBound = true;

  const unlockOnGesture = () => {
    unlockNotificationAudio();
  };

  window.addEventListener("pointerdown", unlockOnGesture, { once: true });
  window.addEventListener("keydown", unlockOnGesture, { once: true });

  const onSettingsChange = (event: Event) => {
    const detail = (event as CustomEvent<{ settings?: AgentSettings }>).detail;
    applyAgentSettings(detail?.settings ?? getAgentSettings());
  };

  window.addEventListener(SETTINGS_CHANGE_EVENT, onSettingsChange);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, onSettingsChange);
      window.removeEventListener("pointerdown", unlockOnGesture);
      window.removeEventListener("keydown", unlockOnGesture);
      isContextBound = false;
    },
    { once: true },
  );
}
