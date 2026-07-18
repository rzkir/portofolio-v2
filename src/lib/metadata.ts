import { contact, project1, socialLinks } from "@/data/portfolio";

import {
  BING_VERIFICATION,
  GOOGLE_SEARCH_CONSOLE_ID,
  GOOGLE_TAG_MANAGER_ID,
} from "astro:env/server";

import type { Locale, Messages } from "@/lib/i18n";

import { LOCALES } from "@/lib/i18n";

import {
  resolveBreadcrumbs,
  serializeBreadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/breadcrumbs";

export type { BreadcrumbItem };

export { resolveBreadcrumbs };

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
  siteJsonLd: string | null;
};

export type SiteVerification = {
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  googleTagManagerId: string | null;
};

function normalizeEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getSiteVerification(): SiteVerification {
  return {
    googleSiteVerification: normalizeEnv(GOOGLE_SEARCH_CONSOLE_ID),
    bingSiteVerification: normalizeEnv(BING_VERIFICATION),
    googleTagManagerId: normalizeEnv(GOOGLE_TAG_MANAGER_ID),
  };
}

const SITE_NAME = "Rizki Ramadhan";
const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const OG_LOCALE: Record<Locale, string> = {
  id: "id_ID",
  en: "en_US",
  ja: "ja_JP",
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

function buildHomeJsonLd(
  site: URL | string | undefined,
  description: string,
): string {
  const origin = resolveSiteOrigin(site);
  const image = toAbsoluteUrl(site, getDefaultOgImage(site));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: SITE_NAME,
        url: `${origin}/`,
        description,
        inLanguage: ["id-ID", "en-US", "ja-JP"],
        publisher: { "@id": `${origin}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${origin}/#person`,
        name: SITE_NAME,
        url: `${origin}/`,
        image,
        jobTitle: "Fullstack Developer",
        email: contact.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bogor",
          addressCountry: "ID",
        },
        sameAs: socialLinks
          .map((link) => link.href)
          .filter((href) => href.startsWith("http")),
      },
    ],
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
  const alternateLocale: Locale =
    LOCALES.find((item) => item !== locale) ?? "en";

  const breadcrumbs = resolveBreadcrumbs(
    pathname,
    messages.nav,
    breadcrumbCurrent,
  );

  return {
    title,
    description,
    canonicalUrl,
    robots: noIndex ? "noindex, nofollow" : DEFAULT_ROBOTS,
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
    breadcrumbJsonLd: serializeBreadcrumbJsonLd(site, breadcrumbs),
    siteJsonLd:
      !noIndex && path === "/"
        ? buildHomeJsonLd(site, description)
        : null,
  };
}
