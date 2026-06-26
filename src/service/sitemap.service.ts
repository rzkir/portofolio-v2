import { fetchSitemap } from "../utils/FetchSitemap";

const LOCAL_STATIC_ROUTES: Array<SitemapRoute & { path: string }> = [
  { path: "/", changefreq: "daily", priority: 1 },
  { path: "/works", changefreq: "weekly", priority: 0.9 },
  { path: "/achievements", changefreq: "monthly", priority: 0.8 },
  { path: "/layanan", changefreq: "monthly", priority: 0.8 },
  { path: "/guest-notes", changefreq: "weekly", priority: 0.6 },
];

const EXCLUDED_PATHS = new Set(["/about", "/accounts", "/articles", "/projects"]);

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "");
}

function toAbsoluteUrl(siteUrl: string, pathname: string): string {
  return new URL(pathname, `${normalizeSiteUrl(siteUrl)}/`).href;
}

function shouldExcludePath(pathname: string): boolean {
  if (EXCLUDED_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/articles/")) return true;
  return false;
}

function mapApiPathname(pathname: string): string | null {
  if (shouldExcludePath(pathname)) return null;

  if (pathname.startsWith("/projects/")) {
    return pathname.replace(/^\/projects\//, "/works/");
  }

  return pathname;
}

function addEntry(
  entries: Map<string, SitemapEntryMeta>,
  url: string,
  meta: SitemapEntryMeta = {},
): void {
  const existing = entries.get(url);

  entries.set(url, {
    lastmod: meta.lastmod ?? existing?.lastmod,
    changefreq: meta.changefreq ?? existing?.changefreq,
    priority: meta.priority ?? existing?.priority,
  });
}

function buildLocalStaticEntries(siteUrl: string): Map<string, SitemapEntryMeta> {
  const entries = new Map<string, SitemapEntryMeta>();

  for (const route of LOCAL_STATIC_ROUTES) {
    addEntry(entries, toAbsoluteUrl(siteUrl, route.path), {
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  return entries;
}

function mapApiRoutes(
  siteUrl: string,
  routes: SitemapRoute[],
): Map<string, SitemapEntryMeta> {
  const entries = new Map<string, SitemapEntryMeta>();

  for (const route of routes) {
    const pathname = mapApiPathname(new URL(route.loc).pathname);
    if (!pathname) continue;

    addEntry(entries, toAbsoluteUrl(siteUrl, pathname), {
      lastmod: route.lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  return entries;
}

export async function buildAstroSitemapData(
  siteUrl: string,
): Promise<AstroSitemapData> {
  const entries = buildLocalStaticEntries(siteUrl);

  try {
    const apiSitemap = await fetchSitemap();
    const apiEntries = mapApiRoutes(siteUrl, apiSitemap.routes);

    for (const [url, meta] of apiEntries) {
      addEntry(entries, url, meta);
    }
  } catch (error) {
    console.warn(
      "[sitemap] API unavailable — using local static routes only.",
      error,
    );
  }

  return {
    customPages: [...entries.keys()],
    metadata: entries,
  };
}
