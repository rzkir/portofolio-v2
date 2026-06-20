import { projects, type Project } from "@/data/portfolio";

export type Work = Project;

/** Semua karya untuk section scroll. */
export function getWorks(): Work[] {
  return projects;
}

/** Tinggi section scroll = jumlah slide × viewport. */
export function getWorksScrollVh(count: number): number {
  return Math.max(count, 1) * 100;
}
