import { fetchCareerContents } from "@/utils/FetchCareer";

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

function formatCareerMonth(value: string): string {
  if (!/^\d{4}(-\d{2})?$/.test(value)) return value;

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

function mapCareer(item: CareerContentProps): Career {
  return {
    org: item.company,
    role: item.position,
    range: formatCareerRange(item.date),
    desc: item.description,
  };
}

/** Pengalaman karier dari API — di-fetch saat SSR/build. Urutan & "present" di-handle BE. */
export async function getCareers(): Promise<Career[]> {
  const items = await fetchCareerContents();
  return items.map(mapCareer);
}
