import {
  fetchNotedMessages,
  mapNotedMessage,
  sortNotedMessages,
} from "@/utils/FetchNoted";

export function formatGuestNoteDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Catatan tamu dari website — di-fetch saat SSR/build. */
export async function getGuestNotes(): Promise<GuestNote[]> {
  const messages = await fetchNotedMessages();

  return sortNotedMessages(messages).map(mapNotedMessage);
}

export { mapNotedMessage };
