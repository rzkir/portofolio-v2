import messages from "@/data/i8n.json";
import type { APIContext } from "astro";

export type Locale = "id" | "en";

export const LOCALES: Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "lang";

export type Messages = (typeof messages)["id"];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "id" || value === "en";
}

export function getLocale(context: Pick<APIContext, "cookies">): Locale {
  const cookie = context.cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function useTranslations(locale: Locale) {
  const dict = getMessages(locale);

  return function t(
    key: string,
    vars?: Record<string, string | number>,
  ): string {
    const value = key.split(".").reduce<unknown>((node, part) => {
      if (node && typeof node === "object" && part in node) {
        return (node as Record<string, unknown>)[part];
      }
      return undefined;
    }, dict);

    if (typeof value !== "string") return key;

    if (!vars) return value;

    return Object.entries(vars).reduce(
      (text, [name, replacement]) =>
        text.replaceAll(`{${name}}`, String(replacement)),
      value,
    );
  };
}

export function langHref(
  pathname: string,
  search: string,
  locale: Locale,
): string {
  const params = new URLSearchParams(search);
  params.set("lang", locale);
  const query = params.toString();
  return query ? `${pathname}?${query}` : `${pathname}?lang=${locale}`;
}
