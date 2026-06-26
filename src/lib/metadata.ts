import { project1 } from "@/data/portfolio";

import type { Locale, Messages } from "@/lib/i18n";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type OgType = "website" | "article";

export type PageMetadataInput = {
  site: URL | string | undefined;
  pathname: string;
  locale: Locale;
  title: string;
  description: string;
  ogImage?: string;
  ogType?: OgType;
  breadcrumbCurrent?: string;
  noIndex?: boolean;
  messages: Messages;
};

export type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string | null;
  og: {
    type: OgType;
    title: string;
    description: string;
    url: string;
    image: string;
    siteName: string;
    locale: string;
    localeAlternate: string;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    image: string;
  };
  breadcrumbs: BreadcrumbItem[];
  breadcrumbJsonLd: string | null;
};

const SITE_NAME = "Rizki Ramadhan";

const OG_LOCALE: Record<Locale, string> = {
  id: "id_ID",
  en: "en_US",
};

function resolveSiteOrigin(site: URL | string | undefined): string {
  if (!site) return "https://rizkiramadhan.biz.id";
  return typeof site === "string" ? site.replace(/\/$/, "") : site.origin;
}

export function getDefaultOgImage(site: URL | string | undefined): string {
  return new URL(project1.src, resolveSiteOrigin(site)).href;
}

function toAbsoluteUrl(site: URL | string | undefined, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return new URL(value, resolveSiteOrigin(site)).href;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function resolveBreadcrumbs(
  pathname: string,
  nav: Messages["nav"],
  breadcrumbCurrent?: string,
): BreadcrumbItem[] {
  const path = normalizePath(pathname);
  const crumbs: BreadcrumbItem[] = [{ name: nav.home, path: "/" }];

  if (path === "/") return crumbs;

  const segments = path.split("/").filter(Boolean);
  const root = segments[0];

  if (root === "works") {
    crumbs.push({ name: nav.works, path: "/works" });
    if (segments[1]) {
      crumbs.push({
        name: breadcrumbCurrent ?? segments[1],
        path: `/works/${segments[1]}`,
      });
    }
    return crumbs;
  }

  if (root === "layanan") {
    crumbs.push({ name: nav.services, path: "/layanan" });
    return crumbs;
  }

  if (root === "achievements") {
    crumbs.push({ name: nav.achievements, path: "/achievements" });
    return crumbs;
  }

  if (root === "guest-notes") {
    crumbs.push({ name: nav.guestNotes, path: "/guest-notes" });
    return crumbs;
  }

  if (breadcrumbCurrent) {
    crumbs.push({ name: breadcrumbCurrent, path });
  }

  return crumbs;
}

function buildBreadcrumbJsonLd(
  site: URL | string | undefined,
  breadcrumbs: BreadcrumbItem[],
): string | null {
  if (breadcrumbs.length < 2) return null;

  const origin = resolveSiteOrigin(site);

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path === "/" ? "/" : item.path}`,
    })),
  });
}

export function resolvePageMetadata(input: PageMetadataInput): PageMetadata {
  const {
    site,
    pathname,
    locale,
    title,
    description,
    ogImage,
    ogType = "website",
    breadcrumbCurrent,
    noIndex = false,
    messages,
  } = input;

  const origin = resolveSiteOrigin(site);
  const path = normalizePath(pathname);
  const canonicalUrl = `${origin}${path === "/" ? "/" : path}`;
  const image = toAbsoluteUrl(site, ogImage ?? getDefaultOgImage(site));
  const alternateLocale: Locale = locale === "id" ? "en" : "id";

  const breadcrumbs = resolveBreadcrumbs(
    pathname,
    messages.nav,
    breadcrumbCurrent,
  );

  return {
    title,
    description,
    canonicalUrl,
    robots: noIndex ? "noindex, nofollow" : null,
    og: {
      type: ogType,
      title,
      description,
      url: canonicalUrl,
      image,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      localeAlternate: OG_LOCALE[alternateLocale],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image,
    },
    breadcrumbs,
    breadcrumbJsonLd: buildBreadcrumbJsonLd(site, breadcrumbs),
  };
}
