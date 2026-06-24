interface Env {
  ASSETS: Fetcher;
  API_URL: string;
  API_SECRET?: string;
}

async function handleGuestNotesPost(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await request.json();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.API_SECRET) {
      headers.Authorization = `Bearer ${env.API_SECRET}`;
    }

    const response = await fetch(`${env.API_URL}/api/v1/messages`, {
      method: "POST",
      headers,
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/guest-notes" && request.method === "POST") {
      return handleGuestNotesPost(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
