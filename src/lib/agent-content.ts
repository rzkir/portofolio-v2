import type { AgentCategoryCard } from "@/service/agent.service";
import { getMessages, type Locale } from "@/lib/i18n";

export type AgentStudioCategoryKey =
  | "studio"
  | "programming"
  | "seo"
  | "marketing"
  | "finance"
  | "health"
  | "trivia"
  | "academia"
  | "technology"
  | "science"
  | "translation"
  | "legal";

type AgentStudioMessages = ReturnType<typeof getMessages>["agentStudio"];

type AgentStudioCategoryCard = AgentStudioMessages["categories"][AgentStudioCategoryKey]["cards"][number];

export function getAgentStudio(locale: Locale): AgentStudioMessages {
  return getMessages(locale).agentStudio;
}

export function getAgentCategoryCards(
  locale: Locale,
  key: AgentStudioCategoryKey,
): AgentCategoryCard[] {
  const category = getAgentStudio(locale).categories[key];
  return category.cards.map((card: AgentStudioCategoryCard) => ({
    title: card.title,
    categoryLabel: card.categoryLabel,
    description: card.description,
    category: card.category,
    prompt: card.prompt,
  }));
}

export function getAgentSidebarItems(locale: Locale) {
  const { sidebar } = getAgentStudio(locale);
  return [
    { id: "chat", href: "/agent", label: sidebar.items.chat, icon: "agent" as const },
    {
      id: "programming",
      href: "/agent/programming",
      label: sidebar.items.programming,
      icon: "programming" as const,
    },
    { id: "seo", href: "/agent/seo", label: sidebar.items.seo, icon: "seo" as const },
    {
      id: "marketing",
      href: "/agent/marketing",
      label: sidebar.items.marketing,
      icon: "marketing" as const,
    },
    {
      id: "finance",
      href: "/agent/finance",
      label: sidebar.items.finance,
      icon: "finance" as const,
    },
    {
      id: "health",
      href: "/agent/health",
      label: sidebar.items.health,
      icon: "health" as const,
    },
    {
      id: "trivia",
      href: "/agent/trivia",
      label: sidebar.items.trivia,
      icon: "trivia" as const,
    },
    {
      id: "academia",
      href: "/agent/academia",
      label: sidebar.items.academia,
      icon: "academia" as const,
    },
    {
      id: "technology",
      href: "/agent/technology",
      label: sidebar.items.technology,
      icon: "technology" as const,
    },
    {
      id: "science",
      href: "/agent/science",
      label: sidebar.items.science,
      icon: "science" as const,
    },
    {
      id: "translation",
      href: "/agent/translation",
      label: sidebar.items.translation,
      icon: "translation" as const,
    },
    { id: "legal", href: "/agent/legal", label: sidebar.items.legal, icon: "legal" as const },
  ];
}
