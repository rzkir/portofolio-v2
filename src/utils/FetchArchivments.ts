import { apiFetch, CACHE_TTL } from "@/lib/apiFetch";

const ACHIEVEMENTS_PATH = "/api/v1/achievements";

function buildAchievementsUrl(
  options: FetchAchievementsPageOptions = {},
): string {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));

  if (options.pageItem) {
    params.set("pageItem", String(options.pageItem));
  }

  return `${ACHIEVEMENTS_PATH}?${params.toString()}`;
}

export const fetchAchievementsPage = async (
  options: FetchAchievementsPageOptions = {},
): Promise<AchievementsPaginatedResponse> => {
  try {
    const data = await apiFetch<AchievementsPaginatedResponse>(
      buildAchievementsUrl(options),
      {
        revalidate: options.revalidate ?? CACHE_TTL.semiStatic.revalidate,
        staleTime: CACHE_TTL.semiStatic.staleTime,
        tags: ["achievements"],
      },
    );
    return data;
  } catch (error) {
    console.error("Error fetching achievements page:", error);
    throw error;
  }
};

export const fetchAchievementsContents = async (): Promise<
  AchievementsContentProps[]
> => {
  try {
    const firstPage = await fetchAchievementsPage({ page: 1 });
    const items = [...firstPage.data];

    for (let page = 2; page <= firstPage.totalPages; page++) {
      const nextPage = await fetchAchievementsPage({
        page,
        pageItem: firstPage.pageItem,
      });
      items.push(...nextPage.data);
    }

    return items;
  } catch (error) {
    console.error("Error fetching achievements contents:", error);
    throw error;
  }
};
