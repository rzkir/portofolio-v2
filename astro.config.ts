import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadDotEnvFiles(mode: string): Record<string, string> {
  const env: Record<string, string> = {};
  const cwd = process.cwd();

  for (const file of [".env", `.env.${mode}`, ".env.local", `.env.${mode}.local`]) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  }

  return env;
}

function guestNotesDevApi() {
  return {
    name: "guest-notes-dev-api",
    configureServer(server: { config: { mode: string }; middlewares: { use: Function } }) {
      const env = loadDotEnvFiles(server.config.mode);

      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/guest-notes" || req.method !== "POST") {
          return next();
        }

        const apiUrl = env.API_URL;
        const apiSecret = env.API_SECRET;

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