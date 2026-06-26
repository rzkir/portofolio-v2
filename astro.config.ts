import cloudflare from "@astrojs/cloudflare";
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

import sitemap from "@astrojs/sitemap";

import { buildAstroSitemapData } from "./src/service/sitemap.service";

const apiUrl = process.env.API_URL ?? "https://api.rizkiramadhan.biz.id";
const siteUrl = "https://rizkiramadhan.biz.id";

const { customPages, metadata: sitemapMetadata } =
  await buildAstroSitemapData(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "server",

  adapter: cloudflare({
    imageService: "compile",
  }),

  env: {
    schema: {
      API_URL: envField.string({
        context: "server",
        access: "secret",
        url: true,
      }),
      API_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "",
      }),
      GOOGLE_SEARCH_CONSOLE_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "",
      }),
      GOOGLE_TAG_MANAGER_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "",
      }),
      BING_VERIFICATION: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api/guest-notes": {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/guest-notes/, "/api/v1/messages"),
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },

  integrations: [
    sitemap({
      customPages,
      filter: (page) => sitemapMetadata.has(page),
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
      serialize(item) {
        const meta = sitemapMetadata.get(item.url);
        if (!meta) return item;

        if (meta.lastmod) item.lastmod = meta.lastmod;
        if (meta.changefreq) item.changefreq = meta.changefreq;
        if (meta.priority != null) item.priority = meta.priority;

        return item;
      },
    }),
  ],
});
