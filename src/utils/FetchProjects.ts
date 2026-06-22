import { apiFetch } from "@/lib/apiFetch";
import type {
  ProjectDetails,
  ProjectsContentProps,
  ProjectsPaginatedResponse,
} from "@/types/projects";

const PROJECTS_PATH = "/api/v1/projects";

export interface FetchProjectsPageOptions {
  page?: number;
  pageItem?: number;
  revalidate?: number;
}

function buildProjectsUrl(options: FetchProjectsPageOptions = {}): string {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));

  if (options.pageItem) {
    params.set("pageItem", String(options.pageItem));
  }

  return `${PROJECTS_PATH}?${params.toString()}`;
}

export const fetchProjectsPage = async (
  options: FetchProjectsPageOptions = {},
): Promise<ProjectsPaginatedResponse> => {
  try {
    const data = await apiFetch<ProjectsPaginatedResponse>(
      buildProjectsUrl(options),
      {
        revalidate: options.revalidate ?? 3600,
        tags: ["projects"],
      },
    );
    return data;
  } catch (error) {
    console.error("Error fetching projects page:", error);
    throw error;
  }
};

export const fetchProjectsContents = async (): Promise<
  ProjectsContentProps[]
> => {
  try {
    const firstPage = await fetchProjectsPage({ page: 1 });
    const items = [...firstPage.data];

    for (let page = 2; page <= firstPage.totalPages; page++) {
      const nextPage = await fetchProjectsPage({
        page,
        pageItem: firstPage.pageItem,
      });
      items.push(...nextPage.data);
    }

    return items;
  } catch (error) {
    console.error("Error fetching projects contents:", error);
    throw error;
  }
};

export const fetchProjectBySlug = async (
  slug: string,
): Promise<ProjectDetails> => {
  try {
    const data = await apiFetch<ProjectDetails>(`${PROJECTS_PATH}/${slug}`, {
      revalidate: 3600,
      tags: ["projects"],
    });
    return data;
  } catch (error) {
    console.error("Error fetching project by slug:", error);
    if (
      error instanceof Error &&
      (error as Error & { status?: number }).status === 404
    ) {
      throw new Error(`Project with slug "${slug}" not found`);
    }
    throw error;
  }
};
