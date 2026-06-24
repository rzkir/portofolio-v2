import { apiFetch } from "@/lib/apiFetch";

const MESSAGES_PATH = "/api/v1/messages";

export async function fetchNotedMessages(): Promise<NotedMessageProps[]> {
  try {
    return await apiFetch<NotedMessageProps[]>(MESSAGES_PATH, {
      revalidate: 60,
      tags: ["messages"],
    });
  } catch (error) {
    console.error("Error fetching noted messages:", error);
    return [];
  }
}
