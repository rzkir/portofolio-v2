import { handle } from "@astrojs/cloudflare/handler";

interface Env {
  ASSETS: Fetcher;
  API_URL: string;
  API_SECRET?: string;
}

async function handleGuestNotesGet(env: Env): Promise<Response> {
  try {
    const response = await fetch(`${env.API_URL}/api/v1/messages`, {
      cache: "no-store",
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleGuestNotesPost(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const payload = await request.json();

    const response = await fetch(`${env.API_URL}/api/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal mengirim catatan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/guest-notes") {
      if (request.method === "GET") return handleGuestNotesGet(env);
      if (request.method === "POST") return handleGuestNotesPost(request, env);
    }

    return handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
