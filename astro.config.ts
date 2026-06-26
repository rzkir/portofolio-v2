import cloudflare from "@astrojs/cloudflare";
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const apiUrl = process.env.API_URL ?? "https://api.rizkiramadhan.biz.id";

// https://astro.build/config
export default defineConfig({
  site: "https://rizkiramadhan.biz.id",
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
});