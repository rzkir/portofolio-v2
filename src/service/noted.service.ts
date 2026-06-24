import { fetchNotedMessages } from "@/utils/FetchNoted";

function mapNotedMessage(item: NotedMessageProps): GuestNote {
  return {
    id: item._id,
    name: item.name,
    message: item.description,
    provider: item.provider,
    createdAt: item.createdAt,
  };
}

export function formatGuestNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

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

  return messages
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map(mapNotedMessage);
}
