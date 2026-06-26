import {
  GUEST_NOTES_PROXY,
  mapNotedMessage,
  sortNotedMessages,
} from "@/utils/noted.shared";

const OWNED_NOTE_KEY = "guest-note-owned-id";

export { GUEST_NOTES_PROXY, mapNotedMessage, sortNotedMessages };

async function parseNotedError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as NotedApiError;
    if (body.error) return body.error;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export async function fetchNotedMessagesClient(): Promise<NotedMessageProps[]> {
  try {
    const response = await fetch(GUEST_NOTES_PROXY);
    if (!response.ok) return [];

    const data = (await response.json()) as NotedMessageProps[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createNotedMessageClient(
  payload: CreateNotedPayload,
): Promise<NotedMessageProps> {
  const response = await fetch(GUEST_NOTES_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseNotedError(response, "Gagal mengirim catatan. Coba lagi."),
    );
  }

  return (await response.json()) as NotedMessageProps;
}

export async function updateNotedMessageClient(
  payload: UpdateNotedPayload,
): Promise<NotedMessageProps> {
  const response = await fetch(GUEST_NOTES_PROXY, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseNotedError(response, "Gagal memperbarui catatan. Coba lagi."),
    );
  }

  return (await response.json()) as NotedMessageProps;
}

export async function deleteNotedMessageClient(id: string): Promise<void> {
  const response = await fetch(
    `${GUEST_NOTES_PROXY}?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(
      await parseNotedError(response, "Gagal menghapus catatan. Coba lagi."),
    );
  }
}

export function getOwnedNoteId(): string | null {
  try {
    return localStorage.getItem(OWNED_NOTE_KEY);
  } catch {
    return null;
  }
}

export function setOwnedNoteId(id: string): void {
  try {
    localStorage.setItem(OWNED_NOTE_KEY, id);
  } catch {
    // ignore storage errors
  }
}

export function clearOwnedNoteId(): void {
  try {
    localStorage.removeItem(OWNED_NOTE_KEY);
  } catch {
    // ignore storage errors
  }
}
