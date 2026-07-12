import messages from "@/data/i8n.json";
import type { APIContext } from "astro";

export type Locale = "id" | "en" | "ja";

export const LOCALES: Locale[] = ["id", "en", "ja"];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "lang";

export type Messages = (typeof messages)[Locale];

const LOCALE_ALIASES: Record<string, Locale> = {
  id: "id",
  en: "en",
  ja: "ja",
  jpn: "ja",
  jp: "ja",
};

export function normalizeLocale(value: string | undefined | null): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return LOCALE_ALIASES[normalized] ?? null;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return normalizeLocale(value) !== null;
}

export function resolveLocale(value: string | undefined | null): Locale {
  return normalizeLocale(value) ?? DEFAULT_LOCALE;
}

export function localeToBcp47(locale: Locale): string {
  const map: Record<Locale, string> = {
    id: "id-ID",
    en: "en-US",
    ja: "ja-JP",
  };
  return map[locale];
}

export function getLocale(context: Pick<APIContext, "cookies">): Locale {
  const cookie = context.cookies.get(LOCALE_COOKIE)?.value;
  return resolveLocale(cookie);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] as Messages;
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

export function absoluteLangHref(
  origin: string,
  pathname: string,
  search: string,
  locale: Locale,
): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${langHref(pathname, search, locale)}`;
}
