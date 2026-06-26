import { handle } from "@astrojs/cloudflare/handler";

interface Env {
  ASSETS: Fetcher;
  API_URL: string;
  API_SECRET?: string;
}

type GuestNotesCache = {
  body: string;
  fingerprint: string;
  freshUntil: number;
  staleUntil: number;
};

const GUEST_NOTES_TTL = { revalidate: 60, staleTime: 300 };
let guestNotesCache: GuestNotesCache | null = null;
let guestNotesInflight: Promise<string> | null = null;

function guestNotesFingerprint(body: string): string {
  try {
    const items = JSON.parse(body) as Array<{
      createdAt?: string;
      updatedAt?: string;
    }>;
    if (!Array.isArray(items)) return body.length.toString();
    const latest = items
      .map((item) => item.updatedAt ?? item.createdAt ?? "")
      .filter(Boolean)
      .sort()
      .pop();
    return `${items.length}:${latest ?? ""}`;
  } catch {
    return body.length.toString();
  }
}

async function fetchGuestNotesFromApi(env: Env): Promise<string> {
  const response = await fetch(`${env.API_URL}/api/v1/messages`, {
    cache: "no-store",
  });
  return response.text();
}

function buildProxyHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const cfIp = request.headers.get("cf-connecting-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (cfIp) headers["cf-connecting-ip"] = cfIp;
  if (forwardedFor) {
    headers["x-forwarded-for"] = forwardedFor;
  } else if (cfIp) {
    headers["x-forwarded-for"] = cfIp;
  }

  return headers;
}

async function getGuestNotesBody(
  env: Env,
  force = false,
): Promise<{ body: string; status: number }> {
  const now = Date.now();
  const { revalidate, staleTime } = GUEST_NOTES_TTL;

  if (!force && guestNotesCache && now < guestNotesCache.freshUntil) {
    return { body: guestNotesCache.body, status: 200 };
  }

  if (
    !force &&
    guestNotesCache &&
    now < guestNotesCache.staleUntil &&
    guestNotesInflight
  ) {
    const body = await guestNotesInflight;
    return { body, status: 200 };
  }

  const previous = guestNotesCache;

  if (!guestNotesInflight) {
    guestNotesInflight = (async () => {
      try {
        const body = await fetchGuestNotesFromApi(env);
        const fp = guestNotesFingerprint(body);

        if (previous && fp === previous.fingerprint) {
          previous.freshUntil = Date.now() + revalidate * 1000;
          previous.staleUntil = Date.now() + (revalidate + staleTime) * 1000;
          return previous.body;
        }

        guestNotesCache = {
          body,
          fingerprint: fp,
          freshUntil: Date.now() + revalidate * 1000,
          staleUntil: Date.now() + (revalidate + staleTime) * 1000,
        };
        return body;
      } catch {
        if (previous) return previous.body;
        return "[]";
      } finally {
        guestNotesInflight = null;
      }
    })();
  }

  const body = await guestNotesInflight;
  return { body, status: 200 };
}

async function handleGuestNotesGet(env: Env): Promise<Response> {
  try {
    const { body, status } = await getGuestNotesBody(env);

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
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
      headers: buildProxyHeaders(request),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      guestNotesCache = null;
    }

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

async function handleGuestNotesPatch(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const payload = await request.json();

    const response = await fetch(`${env.API_URL}/api/v1/messages`, {
      method: "PATCH",
      headers: buildProxyHeaders(request),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      guestNotesCache = null;
    }

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal memperbarui catatan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleGuestNotesDelete(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "ID catatan wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `${env.API_URL}/api/v1/messages?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: buildProxyHeaders(request),
      },
    );

    if (response.ok) {
      guestNotesCache = null;
    }

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal menghapus catatan" }), {
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
      if (request.method === "PATCH") return handleGuestNotesPatch(request, env);
      if (request.method === "DELETE") return handleGuestNotesDelete(request, env);
    }

    return handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
