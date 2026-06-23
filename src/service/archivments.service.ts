import {
  fetchAchievementsContents,
  fetchAchievementsPage,
} from "@/utils/FetchArchivments";

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

function mapAchievements(items: AchievementsContentProps[]): Credential[] {
  return items.map(mapAchievement);
}

/** Kredensial halaman pertama — untuk section landing. */
export async function getFeaturedCredentials(): Promise<Credential[]> {
  const { data } = await fetchAchievementsPage({ page: 1 });
  return mapAchievements(data);
}

/** Semua kredensial / sertifikasi dari API — di-fetch saat SSR/build. */
export async function getCredentials(): Promise<Credential[]> {
  const items = await fetchAchievementsContents();
  return mapAchievements(items);
}

/** Arsip lengkap kredensial dengan nomor urut global. */
export async function getCredentialsArchive(): Promise<Credential[]> {
  return getCredentials();
}
