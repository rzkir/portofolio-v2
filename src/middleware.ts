import { defineMiddleware } from "astro:middleware";

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
