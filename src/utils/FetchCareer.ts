import { apiFetch, CACHE_TTL } from "@/lib/apiFetch.server";

const CAREER_PATH = "/api/v1/careers";

export const fetchCareerContents = async (): Promise<CareerContentProps[]> => {
  try {
    const data = await apiFetch<CareerContentProps[]>(CAREER_PATH, {
      ...CACHE_TTL.static,
      tags: ["career"],
    });
    return data;
  } catch (error) {
    console.error("Error fetching career contents:", error);
    throw error;
  }
};
