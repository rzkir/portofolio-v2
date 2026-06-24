import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const apiUrl = process.env.API_URL ?? "https://api.rizkiramadhan.biz.id";

// https://astro.build/config
export default defineConfig({
  site: "https://rizkiramadhan.biz.id",
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