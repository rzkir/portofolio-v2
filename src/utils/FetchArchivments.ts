import { apiFetch } from "@/lib/apiFetch";
import type { AchievementsContentProps } from "@/types/archivments";

const ACHIEVEMENTS_PATH = "/api/v1/achievements";

export const fetchAchievementsContents = async (): Promise<
  AchievementsContentProps[]
> => {
  try {
    const data = await apiFetch<AchievementsContentProps[]>(ACHIEVEMENTS_PATH, {
      revalidate: 3600,
      tags: ["achievements"],
    });
    return data;
  } catch (error) {
    console.error("Error fetching achievements contents:", error);
    throw error;
  }
};