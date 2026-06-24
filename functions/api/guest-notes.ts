interface GuestNotesEnv {
  API_URL: string;
  API_SECRET?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: GuestNotesEnv;
}) {
  try {
    const payload = await context.request.json();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (context.env.API_SECRET) {
      headers.Authorization = `Bearer ${context.env.API_SECRET}`;
    }

    const response = await fetch(`${context.env.API_URL}/api/v1/messages`, {
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
