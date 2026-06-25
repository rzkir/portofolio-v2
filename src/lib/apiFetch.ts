import { API_SECRET, API_URL } from "astro:env/server";

interface ApiFetchOptions {
  revalidate?: number;
  tags?: string[];
}

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCached(key: string, data: unknown, revalidate: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + revalidate * 1000,
  });
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const revalidate = options.revalidate ?? 60;
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const cacheKey = options.tags?.length
    ? `${url}::${options.tags.join(",")}`
    : url;

  if (revalidate > 0) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (API_SECRET) {
    headers.Authorization = `Bearer ${API_SECRET}`;
  }

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error: Error & { status?: number } = new Error(
      `Failed to fetch: ${response.statusText}`,
    );
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as T;

  if (revalidate > 0) {
    setCached(cacheKey, data, revalidate);
  }

  return data;
}
