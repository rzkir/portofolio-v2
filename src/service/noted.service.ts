import { fetchNotedMessages } from "@/utils/FetchNoted";

export const MESSAGE_PROVIDERS: { value: MessageProvider; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
  { value: "other", label: "Lainnya" },
];

const PROVIDER_LABELS = Object.fromEntries(
  MESSAGE_PROVIDERS.map(({ value, label }) => [value, label]),
) as Record<MessageProvider, string>;

export function getProviderLabel(provider: MessageProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

function mapNotedMessage(item: NotedMessageProps): GuestNote {
  return {
    id: item._id,
    name: item.name,
    message: item.description,
    provider: item.provider,
    createdAt: item.createdAt,
  };
}

/** Catatan tamu dari API — di-fetch saat SSR/build. */
export async function getGuestNotes(): Promise<GuestNote[]> {
  const items = await fetchNotedMessages();
  return items.map(mapNotedMessage);
}
