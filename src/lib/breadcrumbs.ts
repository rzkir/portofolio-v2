import type { Messages } from "@/lib/i18n";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

function resolveSiteOrigin(site: URL | string | undefined): string {
  if (!site) return "https://rizkiramadhan.biz.id";
  return typeof site === "string" ? site.replace(/\/$/, "") : site.origin;
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

  if (root === "agent") {
    crumbs.push({ name: nav.agentStudio, path: "/agent" });
    if (segments[1]) {
      crumbs.push({
        name: breadcrumbCurrent ?? segments[1],
        path,
      });
    }
    return crumbs;
  }

  if (breadcrumbCurrent) {
    crumbs.push({ name: breadcrumbCurrent, path });
  }

  return crumbs;
}

export function serializeBreadcrumbJsonLd(
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
