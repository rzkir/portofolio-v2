import { apiFetch } from "@/lib/apiFetch";

import type { ProjectDetails, ProjectsContentProps } from "@/types/projects";

const PROJECTS_PATH = "/api/v1/projects";

export const fetchProjectsContents = async (): Promise<
  ProjectsContentProps[]
> => {
  try {
    const data = await apiFetch<ProjectsContentProps[]>(PROJECTS_PATH, {
      revalidate: 3600,
      tags: ["projects"],
    });
    return data;
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
    if (error instanceof Error && (error as Error & { status?: number }).status === 404) {
      throw new Error(`Project with slug "${slug}" not found`);
    }
    throw error;
  }
};
