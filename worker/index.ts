interface Env {
  ASSETS: Fetcher;
  API_URL: string;
}

async function handleGuestNotesPost(request: Request, env: Env): Promise<Response> {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/guest-notes" && request.method === "POST") {
      return handleGuestNotesPost(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
