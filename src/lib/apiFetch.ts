import { API_SECRET, API_URL } from "astro:env/server";

interface ApiFetchOptions {
  /** Fresh period — serve cache without network (seconds). */
  revalidate?: number;
  /** Extra stale window after fresh expires (seconds). */
  staleTime?: number;
  tags?: string[];
}

type CacheEntry = {
  data: unknown;
  fingerprint: string;
  freshUntil: number;
  staleUntil: number;
};

/** Preset TTL per jenis data — jarang berubah = cache lebih lama. */
export const CACHE_TTL = {
  /** Karier, skills — hampir statis. */
  static: { revalidate: 3600, staleTime: 86400 },
  /** Sertifikasi / achievements. */
  semiStatic: { revalidate: 1800, staleTime: 43200 },
  /** Proyek / karya. */
  content: { revalidate: 300, staleTime: 3600 },
  /** GitHub + WakaTime stats. */
  stats: { revalidate: 300, staleTime: 1800 },
  /** Guest notes — lebih sering berubah. */
  dynamic: { revalidate: 60, staleTime: 300 },
} as const;

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function buildCacheKey(url: string, tags?: string[]): string {
  return tags?.length ? `${url}::${tags.join(",")}` : url;
}

function getCachedEntry(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.staleUntil) {
    cache.delete(key);
    return null;
  }

  return entry;
}

function setCached(
  key: string,
  data: unknown,
  fingerprint: string,
  revalidate: number,
  staleTime: number,
): void {
  const now = Date.now();
  cache.set(key, {
    data,
    fingerprint,
    freshUntil: now + revalidate * 1000,
    staleUntil: now + (revalidate + staleTime) * 1000,
  });
}

function extendFresh(entry: CacheEntry, revalidate: number, staleTime: number): void {
  const now = Date.now();
  entry.freshUntil = now + revalidate * 1000;
  entry.staleUntil = now + (revalidate + staleTime) * 1000;
}

/** Fingerprint ringan — deteksi perubahan tanpa hash seluruh payload. */
export function fingerprintData(data: unknown): string {
  if (data == null) return "null";

  if (Array.isArray(data)) {
    const items = data as Array<{ updatedAt?: string; createdAt?: string }>;
    const latest = items
      .map((item) => item.updatedAt ?? item.createdAt ?? "")
      .filter(Boolean)
      .sort()
      .pop();
    return `arr:${items.length}:${latest ?? ""}`;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.fetchedAt === "string") return `fetched:${obj.fetchedAt}`;
    if (typeof obj.updatedAt === "string") return `updated:${obj.updatedAt}`;

    if (Array.isArray(obj.data)) {
      const items = obj.data as Array<{ updatedAt?: string; createdAt?: string }>;
      const latest = items
        .map((item) => item.updatedAt ?? item.createdAt ?? "")
        .filter(Boolean)
        .sort()
        .pop();
      return `page:${obj.totalPages ?? ""}:${items.length}:${latest ?? ""}`;
    }
  }

  return `raw:${Date.now()}`;
}

async function networkFetch<T>(url: string): Promise<T> {
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

  return (await response.json()) as T;
}

async function fetchAndCache<T>(
  cacheKey: string,
  url: string,
  revalidate: number,
  staleTime: number,
  previous?: CacheEntry,
): Promise<T> {
  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    try {
      const data = await networkFetch<T>(url);
      const fp = fingerprintData(data);

      if (previous && fp === previous.fingerprint) {
        extendFresh(previous, revalidate, staleTime);
        return previous.data as T;
      }

      setCached(cacheKey, data, fp, revalidate, staleTime);
      return data;
    } catch (error) {
      if (previous) return previous.data as T;
      throw error;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

/** Hapus cache by tag — misal setelah POST guest note. */
export function invalidateCacheByTag(tag: string): void {
  const suffix = `::${tag}`;
  for (const key of cache.keys()) {
    if (key.endsWith(suffix) || key.includes(`${suffix},`)) {
      cache.delete(key);
    }
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const revalidate = options.revalidate ?? 60;
  const staleTime = options.staleTime ?? revalidate * 10;
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const cacheKey = buildCacheKey(url, options.tags);

  if (revalidate <= 0) {
    return networkFetch<T>(url);
  }

  const entry = getCachedEntry(cacheKey);
  const now = Date.now();

  if (entry && now < entry.freshUntil) {
    return entry.data as T;
  }

  if (entry && now < entry.staleUntil) {
    return fetchAndCache<T>(cacheKey, url, revalidate, staleTime, entry);
  }

  return fetchAndCache<T>(cacheKey, url, revalidate, staleTime);
}
