type SitemapChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapRoute {
  loc: string;
  lastmod?: string;
  changefreq?: SitemapChangeFreq;
  priority?: number;
}

interface SitemapApiResponse {
  generatedAt: string;
  baseUrl: string;
  routes: SitemapRoute[];
}

interface SitemapEntryMeta {
  lastmod?: string;
  changefreq?: SitemapChangeFreq;
  priority?: number;
}

interface AstroSitemapData {
  customPages: string[];
  metadata: Map<string, SitemapEntryMeta>;
}
