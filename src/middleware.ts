import { defineMiddleware } from "astro:middleware";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  const langParam = context.url.searchParams.get("lang");

  if (isLocale(langParam)) {
    context.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  const cookie = context.cookies.get(LOCALE_COOKIE)?.value;
  context.locals.locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;

  return next();
});
