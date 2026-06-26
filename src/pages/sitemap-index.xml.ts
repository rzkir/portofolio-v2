import type { APIRoute } from "astro";

import { renderSitemapIndex } from "@/lib/sitemap-xml";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
} as const;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap.xml", site).href;

  return new Response(renderSitemapIndex([sitemapUrl]), {
    headers: XML_HEADERS,
  });
};
