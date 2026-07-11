const STORAGE_PREFIX = "agent-chat:";
const MAX_MESSAGES = 100;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidMessage(value: unknown): value is AgentChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as AgentChatMessage;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.sentAt === "string"
  );
}

function normalizeSession(value: unknown): AgentChatSession | null {
  if (!value || typeof value !== "object") return null;

  const session = value as AgentChatSession;
  if (!Array.isArray(session.messages)) return null;

  const messages = session.messages.filter(isValidMessage);
  if (messages.length === 0) return null;

  return {
    messages,
    sessionCategory: session.sessionCategory ?? null,
    updatedAt:
      typeof session.updatedAt === "string"
        ? session.updatedAt
        : new Date().toISOString(),
  };
}

export function loadAgentChatSession(
  storageKey: string,
): AgentChatSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveAgentChatSession(
  storageKey: string,
  messages: AgentChatMessage[],
  sessionCategory?: AgentPromptCategory | null,
): void {
  if (!isBrowser()) return;

  const session: AgentChatSession = {
    messages: messages.slice(-MAX_MESSAGES),
    sessionCategory: sessionCategory ?? null,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${storageKey}`,
      JSON.stringify(session),
    );
  } catch {
    // ignore quota errors
  }
}

export function clearAgentChatSession(storageKey: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
  } catch {
    // ignore storage errors
  }
}
