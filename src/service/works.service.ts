import type { ImageMetadata } from "astro";

import { project1 } from "@/data/portfolio";
import type { ProjectsContentProps } from "@/types/projects";
import {
  fetchProjectBySlug,
  fetchProjectsContents,
  fetchProjectsPage,
} from "@/utils/FetchProjects";
import { countPaginatedItems } from "@/utils/paginated.shared";

/** Tinggi section scroll = jumlah slide × viewport. */
export function getWorksScrollVh(count: number): number {
  return Math.max(count, 1) * 100;
}

// ── Works archive ────────────────────────────────────────────────────────────
// SSR: archive list, featured works, and total count from the API.

export type ArchiveWork = {
  no: string;
  title: string;
  tag: string;
  year: string;
  slug: string;
  image: ImageMetadata | string;
  previewUrl: string;
};

export type FeaturedWork = ArchiveWork & {
  desc: string;
};

function formatArchiveIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function formatArchiveYear(createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
}

async function mapProjectsToArchive<T extends ArchiveWork>(
  items: ProjectsContentProps[],
  mapItem: (
    item: ProjectsContentProps,
    index: number,
    detail: Awaited<ReturnType<typeof fetchProjectBySlug>> | null,
  ) => T,
): Promise<T[]> {
  const details = await Promise.all(
    items.map((item) => fetchProjectBySlug(item.slug).catch(() => null)),
  );

  return items.map((item, index) => mapItem(item, index, details[index]));
}

/** Jumlah total karya dari API. */
export async function getWorksCount(): Promise<number> {
  return countPaginatedItems((page, pageItem) =>
    fetchProjectsPage({ page, pageItem }),
  );
}

/** Karya arsip dari API — di-fetch saat SSR/build. */
export async function getWorksArchive(): Promise<ArchiveWork[]> {
  const items = await fetchProjectsContents();

  return mapProjectsToArchive(items, (item, index, detail) => ({
    no: formatArchiveIndex(index),
    title: item.title,
    tag: item.categoryDetail?.name ?? item.category,
    year: formatArchiveYear(item.createdAt),
    slug: item.slug,
    image: detail?.thumbnail ?? project1.src,
    previewUrl: item.previewLink,
  }));
}

/** Karya pilihan untuk section scroll — di-fetch saat SSR/build. */
export async function getFeaturedWorks(limit = 6): Promise<FeaturedWork[]> {
  const { data } = await fetchProjectsPage({ page: 1 });
  const items = data.slice(0, limit);

  return mapProjectsToArchive(items, (item, index, detail) => ({
    no: formatArchiveIndex(index),
    title: item.title,
    tag: item.categoryDetail?.name ?? item.category,
    year: formatArchiveYear(item.createdAt),
    slug: item.slug,
    image: detail?.thumbnail ?? project1.src,
    previewUrl: item.previewLink,
    desc: detail?.description ?? "",
  }));
}

// ── Works detail ─────────────────────────────────────────────────────────────
// SSR: single work page data and date formatting helpers.

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
