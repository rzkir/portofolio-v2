import { defineMiddleware } from "astro:middleware";

import { AI_STUDIO_URL } from "@/data/portfolio";
import {
  LOCALE_COOKIE,
  normalizeLocale,
  resolveLocale,
} from "@/lib/i18n";

function isDevtoolsProbe(pathname: string): boolean {
  return (
    pathname === "/json" ||
    pathname.startsWith("/json/") ||
    pathname.startsWith("/devtools/")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (isDevtoolsProbe(context.url.pathname)) {
    return new Response(null, { status: 404 });
  }

  if (
    context.url.pathname === "/agent" ||
    context.url.pathname.startsWith("/agent/")
  ) {
    return context.redirect(AI_STUDIO_URL, 301);
  }

  const langParam = normalizeLocale(context.url.searchParams.get("lang"));

  if (langParam) {
    context.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  const cookie = context.cookies.get(LOCALE_COOKIE)?.value;
  context.locals.locale = resolveLocale(cookie);

  return next();
});
