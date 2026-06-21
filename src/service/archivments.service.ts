import { fetchAchievementsContents } from "@/utils/FetchArchivments";
import type { AchievementsContentProps } from "@/types/archivments";

export type Credential = {
  code: string;
  title: string;
  issuer: string;
  year: string;
  imageUrl: string;
};

function parseAchievementTitle(title: string): { issuer: string; name: string } {
  const sep = title.indexOf(" - ");
  if (sep === -1) return { issuer: "Sertifikasi", name: title };

  return {
    issuer: title.slice(0, sep).trim(),
    name: title.slice(sep + 3).trim(),
  };
}

function formatCredentialIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function formatCredentialYear(createdAt?: string): string {
  if (!createdAt) return "—";

  const year = new Date(createdAt).getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
}

function mapAchievement(
  item: AchievementsContentProps,
  index: number,
): Credential {
  const { issuer, name } = parseAchievementTitle(item.title);

  return {
    code: formatCredentialIndex(index),
    title: name,
    issuer,
    year: formatCredentialYear(item.createdAt),
    imageUrl: item.imageUrl,
  };
}

/** Kredensial / sertifikasi dari API — di-fetch saat SSR/build. */
export async function getCredentials(): Promise<Credential[]> {
  const items = await fetchAchievementsContents();
  return items.map(mapAchievement);
}
