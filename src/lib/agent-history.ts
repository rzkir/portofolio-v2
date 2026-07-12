import { getAgentStudioClient } from "@/lib/agent-i18n.client";
import { localeToBcp47, resolveLocale } from "@/lib/i18n";

export type AgentHistoryPeriod =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "older";

const PERIOD_ORDER: AgentHistoryPeriod[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "older",
];

function getHistoryStrings() {
  const studio = getAgentStudioClient();
  return {
    periods: studio.history.periods,
    newConversation: studio.common.newConversation,
    active: studio.common.active,
  };
}

export function getAgentHistoryPeriodLabels(): Record<AgentHistoryPeriod, string> {
  return getHistoryStrings().periods;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function deriveThreadTitle(messages: AgentChatMessage[]): string {
  const { newConversation } = getHistoryStrings();
  const firstUser = messages.find((message) => message.role === "user");
  const source = firstUser?.content.trim() || newConversation;
  return source.length > 52 ? `${source.slice(0, 52)}…` : source;
}

export function getAgentHistoryPeriod(isoDate: string): AgentHistoryPeriod {
  const date = startOfDay(new Date(isoDate));
  const today = startOfDay(new Date());
  const diffDays = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "last7";
  if (diffDays <= 30) return "last30";
  return "older";
}

export function groupThreadsByPeriod(
  threads: AgentChatThread[],
): Array<{ period: AgentHistoryPeriod; threads: AgentChatThread[] }> {
  const grouped = new Map<AgentHistoryPeriod, AgentChatThread[]>();

  for (const thread of threads) {
    const period = getAgentHistoryPeriod(thread.updatedAt);
    const list = grouped.get(period) ?? [];
    list.push(thread);
    grouped.set(period, list);
  }

  return PERIOD_ORDER.filter((period) => grouped.has(period)).map((period) => ({
    period,
    threads: grouped.get(period)!.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    ),
  }));
}

export function deriveThreadPreview(messages: AgentChatMessage[]): string {
  const { newConversation } = getHistoryStrings();
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const fallback = messages.find((message) => message.role === "user");
  const source =
    lastAssistant?.content.trim() || fallback?.content.trim() || "";
  if (!source) return newConversation;
  return source.length > 64 ? `${source.slice(0, 64)}…` : source;
}

export function formatHistoryTime(
  isoDate: string,
  period: AgentHistoryPeriod,
  isActive = false,
): string {
  const { active } = getHistoryStrings();
  if (isActive) return active;

  const locale = resolveLocale(document.documentElement.lang);
  const localeTag = localeToBcp47(locale);
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  if (period === "today" || period === "yesterday") {
    return date.toLocaleTimeString(localeTag, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(localeTag, {
    day: "numeric",
    month: "short",
  });
}
