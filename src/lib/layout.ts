import { bindLang } from "@/lib/lang";

import { registerPwa } from "@/lib/pwa";

import { bindTheme } from "@/lib/theme";

export const SPLASH_INLINE_SCRIPT = `try {
  var isCrawler =
    /bot|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit/i.test(
      navigator.userAgent,
    );

  if (isCrawler || sessionStorage.getItem("splash-seen") === "1") {
    document.documentElement.classList.add("splash-seen");
  } else {
    document.documentElement.classList.add("splash-pending");
  }
} catch (_) {
  document.documentElement.classList.add("splash-pending");
}`;

export const THEME_INLINE_SCRIPT = `(function () {
  try {
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var root = document.documentElement;

    if (dark) root.classList.add("dark");
    root.setAttribute("data-theme", "system");
    root.setAttribute("data-theme-resolved", dark ? "dark" : "light");
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {}
})();`;

export function createGtmInlineScript(gtmId: string): string {
    const id = JSON.stringify(gtmId);

    return `(function (w, d) {
  function loadGtm() {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
    var j = d.createElement("script");
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + ${id};
    d.head.appendChild(j);
  }

  if ("requestIdleCallback" in w) {
    w.requestIdleCallback(loadGtm, { timeout: 3500 });
  } else {
    w.addEventListener("load", loadGtm, { once: true });
  }
})(window, document);`;
}

function initThemeAndLang(): void {
    bindTheme();
    bindLang();
}

export function initLayout(): void {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initThemeAndLang, {
            once: true,
        });
    } else {
        initThemeAndLang();
    }

    document.addEventListener("astro:page-load", initThemeAndLang);
    registerPwa();
}
