import type { ImageMetadata } from "astro";

import { project1 } from "@/data/portfolio";

import {
  fetchProjectBySlug,
  fetchProjectsContents,
  fetchProjectsPage,
} from "@/utils/FetchProjects";

import type { ProjectsContentProps } from "@/types/projects";

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
    items.map((item) =>
      fetchProjectBySlug(item.slug).catch(() => null),
    ),
  );

  return items.map((item, index) => mapItem(item, index, details[index]));
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
