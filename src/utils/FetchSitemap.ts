import { apiFetch, CACHE_TTL } from "../lib/apiFetch";

const SITEMAP_PATH = "/api/v1/sitemap";

export const fetchSitemap = async (): Promise<SitemapApiResponse> => {
  try {
    return await apiFetch<SitemapApiResponse>(SITEMAP_PATH, {
      ...CACHE_TTL.semiStatic,
      tags: ["sitemap"],
    });
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    throw error;
  }
};
