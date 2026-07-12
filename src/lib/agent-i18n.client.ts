import { getMessages, resolveLocale } from "@/lib/i18n";

export function getAgentStudioClient() {
  const locale = resolveLocale(document.documentElement.lang);
  return getMessages(locale).agentStudio;
}
