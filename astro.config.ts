import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

function guestNotesDevApi(): Plugin {
  return {
    name: "guest-notes-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/guest-notes" || req.method !== "POST") {
          return next();
        }

        const apiUrl = process.env.API_URL;
        const apiSecret = process.env.API_SECRET;

        if (!apiUrl) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "API_URL belum dikonfigurasi di .env" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (apiSecret) {
            headers.Authorization = `Bearer ${apiSecret}`;
          }

          const response = await fetch(`${apiUrl}/api/v1/messages`, {
            method: "POST",
            headers,
            body: Buffer.concat(chunks).toString(),
          });

          res.statusCode = response.status;
          res.setHeader("Content-Type", "application/json");
          res.end(await response.text());
        } catch {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Gagal mengirim catatan" }));
        }
      });
    },
  };
}

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
    plugins: [tailwindcss(), guestNotesDevApi()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});