import {
  fetchProjectBySlug,
  fetchProjectsContents,
} from "@/utils/FetchProjects";
import type { ProjectDetails } from "@/types/projects";

export async function getWorkSlugs(): Promise<string[]> {
  const items = await fetchProjectsContents();
  return items.map((item) => item.slug);
}

export async function getWorkBySlug(slug: string): Promise<ProjectDetails> {
  return fetchProjectBySlug(slug);
}

export function formatWorkDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getWorkYear(iso: string): string {
  const year = new Date(iso).getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
}
