import { apiFetch, CACHE_TTL } from "@/lib/apiFetch.server";

const GITHUB_STATS_PATH = "/api/v1/stats/wakatime";

export const fetchGithubStats = async (): Promise<GithubStatsResponse> => {
  try {
    const data = await apiFetch<GithubStatsResponse>(GITHUB_STATS_PATH, {
      ...CACHE_TTL.stats,
      tags: ["github-stats"],
    });
    return data;
  } catch (error) {
    console.error("Error fetching github stats:", error);
    throw error;
  }
};
