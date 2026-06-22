import { fetchCareerContents } from "@/utils/FetchCareer";
import type { CareerContentProps } from "@/types/carrier";

export type Career = {
  org: string;
  role: string;
  range: string;
  desc: string;
};

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

function parseCareerTimestamp(value: string): number {
  if (value === "present") return Date.now();

  const [year, month = "01"] = value.split("-");
  return new Date(Number(year), Number(month) - 1).getTime();
}

function formatCareerMonth(value: string): string {
  if (value === "present") return "Sekarang";

  const [year, month = "01"] = value.split("-");
  const monthIndex = Number(month) - 1;

  if (monthIndex >= 0 && monthIndex < 12) {
    return `${MONTHS_ID[monthIndex]} ${year}`;
  }

  return year;
}

function formatCareerRange(date: CareerContentProps["date"]): string {
  const start = formatCareerMonth(date.start);
  const end = formatCareerMonth(date.end);
  return `${start} — ${end}`;
}

function sortCareers(items: CareerContentProps[]): CareerContentProps[] {
  return [...items].sort(
    (a, b) => parseCareerTimestamp(b.date.start) - parseCareerTimestamp(a.date.start),
  );
}

function mapCareer(item: CareerContentProps): Career {
  return {
    org: item.company,
    role: item.position,
    range: formatCareerRange(item.date),
    desc: item.description,
  };
}

/** Pengalaman karier dari API — di-fetch saat SSR/build. */
export async function getCareers(): Promise<Career[]> {
  const items = await fetchCareerContents();
  return sortCareers(items).map(mapCareer);
}
