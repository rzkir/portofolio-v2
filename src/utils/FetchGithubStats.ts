import { apiFetch, CACHE_TTL } from "@/lib/apiFetch.server";

const GITHUB_STATS_PATH = "/api/v1/stats/wakatime";

export const fetchGithubStats = async (): Promise<GithubStatsResponse | null> => {
  try {
    return await apiFetch<GithubStatsResponse>(GITHUB_STATS_PATH, {
      ...CACHE_TTL.stats,
      tags: ["github-stats"],
    });
  } catch (error) {
    console.warn("[github-stats] API unavailable — section will use fallback.", error);
    return null;
  }
};
