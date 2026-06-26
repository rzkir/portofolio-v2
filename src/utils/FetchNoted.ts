import { apiFetch, CACHE_TTL } from "@/lib/apiFetch";

const MESSAGES_PATH = "/api/v1/messages";

export async function fetchNotedMessages(): Promise<NotedMessageProps[]> {
  try {
    return await apiFetch<NotedMessageProps[]>(MESSAGES_PATH, {
      ...CACHE_TTL.dynamic,
      tags: ["messages"],
    });
  } catch (error) {
    console.error("Error fetching noted messages:", error);
    return [];
  }
}
