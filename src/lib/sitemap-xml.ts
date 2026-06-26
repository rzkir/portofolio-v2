function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemapUrlset(
  entries: Map<string, SitemapEntryMeta>,
): string {
  const urls = [...entries.entries()]
    .map(([loc, meta]) => {
      const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];

      if (meta.lastmod) {
        lines.push(`    <lastmod>${escapeXml(meta.lastmod)}</lastmod>`);
      }

      if (meta.changefreq) {
        lines.push(`    <changefreq>${meta.changefreq}</changefreq>`);
      }

      if (meta.priority != null) {
        lines.push(`    <priority>${meta.priority.toFixed(1)}</priority>`);
      }

      lines.push(`  </url>`);
      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function renderSitemapIndex(locations: string[]): string {
  const items = locations
    .map(
      (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;
}
