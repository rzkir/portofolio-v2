import type { APIRoute } from "astro";

import { renderSitemapUrlset } from "@/lib/sitemap-xml";
import {
  buildAstroSitemapData,
  buildFallbackSitemapMetadata,
} from "@/service/sitemap.service";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
} as const;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href ?? "https://rizkiramadhan.biz.id";

  try {
    const { metadata } = await buildAstroSitemapData(siteUrl);

    return new Response(renderSitemapUrlset(metadata), {
      headers: XML_HEADERS,
    });
  } catch (error) {
    console.error("[sitemap] Failed to build sitemap:", error);

    return new Response(renderSitemapUrlset(buildFallbackSitemapMetadata(siteUrl)), {
      headers: XML_HEADERS,
    });
  }
};
