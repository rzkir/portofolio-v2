import { apiFetch, CACHE_TTL } from "@/lib/apiFetch";

const ARTICLES_PATH = "/api/v1/articles";

function buildArticlesUrl(options: FetchArticlesPageOptions = {}): string {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));

  if (options.pageItem) {
    params.set("pageItem", String(options.pageItem));
  }

  return `${ARTICLES_PATH}?${params.toString()}`;
}

export const fetchArticlesPage = async (
  options: FetchArticlesPageOptions = {},
): Promise<ArticlesPaginatedResponse> => {
  try {
    return await apiFetch<ArticlesPaginatedResponse>(buildArticlesUrl(options), {
      revalidate: options.revalidate ?? CACHE_TTL.content.revalidate,
      staleTime: CACHE_TTL.content.staleTime,
      tags: ["articles"],
    });
  } catch (error) {
    console.error("Error fetching articles page:", error);
    throw error;
  }
};

export const fetchArticlesContents = async (): Promise<ArticlesContentProps[]> => {
  try {
    const firstPage = await fetchArticlesPage({ page: 1 });
    const items = [...firstPage.data];

    for (let page = 2; page <= firstPage.totalPages; page++) {
      const nextPage = await fetchArticlesPage({
        page,
        pageItem: firstPage.pageItem,
      });
      items.push(...nextPage.data);
    }

    return items;
  } catch (error) {
    console.error("Error fetching articles contents:", error);
    throw error;
  }
};

export const fetchArticleBySlug = async (
  slug: string,
): Promise<ArticleDetails> => {
  try {
    return await apiFetch<ArticleDetails>(`${ARTICLES_PATH}/${slug}`, {
      ...CACHE_TTL.content,
      tags: ["articles"],
    });
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    if (
      error instanceof Error &&
      (error as Error & { status?: number }).status === 404
    ) {
      throw new Error(`Article with slug "${slug}" not found`);
    }
    throw error;
  }
};
