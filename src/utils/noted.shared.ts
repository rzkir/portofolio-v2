export const GUEST_NOTES_PROXY = "/api/guest-notes";

export function mapNotedMessage(item: NotedMessageProps): GuestNote {
  return {
    id: item._id,
    name: item.name,
    message: item.description,
    provider: item.provider,
    createdAt: item.createdAt,
  };
}

export function sortNotedMessages(
  messages: NotedMessageProps[],
): NotedMessageProps[] {
  return [...messages].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
