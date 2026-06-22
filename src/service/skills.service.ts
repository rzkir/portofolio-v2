import { fetchSkillsContents } from "@/utils/FetchSkills";
import type { SkillCategory, SkillsContentProps } from "@/types/skills";

export type Skill = {
  title: string;
  imageUrl: string;
  category: SkillCategory;
};

export type GroupedSkills = Record<SkillCategory, Skill[]>;

export const SKILL_CATEGORY_LABELS: { key: SkillCategory; label: string }[] = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "tools", label: "Tools" },
];

const TITLE_CATEGORY: Record<string, SkillCategory> = {
  astro: "frontend",
  "nuxt.js": "frontend",
  "vue.js": "frontend",
  "three.js": "frontend",
  vite: "frontend",
  "react js": "frontend",
  "framer motion": "frontend",
  sass: "frontend",
  boostrap: "frontend",
  scrollreveal: "frontend",
  gsap: "frontend",
  swiper: "frontend",
  "next js": "frontend",
  talwind: "frontend",
  javascript: "frontend",
  typescript: "frontend",
  jqury: "frontend",
  axios: "frontend",
  "express.js": "backend",
  laravel: "backend",
  nodejs: "backend",
  mysql: "backend",
  php: "backend",
  mongodb: "backend",
  firebase: "backend",
  git: "tools",
  postman: "tools",
  "visual studio code": "tools",
  laragon: "tools",
  docker: "tools",
};

const BACKEND_PATTERN =
  /\b(express|laravel|node\.?js|mysql|postgres|mongodb|firebase|php|prisma|supabase|graphql|nestjs|fastapi|django)\b/i;
const TOOLS_PATTERN =
  /\b(git|postman|docker|figma|vscode|laragon|webpack|linux|vercel|netlify|aws|jira)\b/i;
const FRONTEND_PATTERN =
  /\b(react|next\.?js|astro|vue|nuxt|angular|svelte|typescript|javascript|tailwind|css|sass|bootstrap|gsap|framer|three\.?js|vite|swiper|jquery|axios)\b/i;

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function resolveApiCategory(category: string): SkillCategory | null {
  const value = category.toLowerCase();

  if (value.includes("front")) return "frontend";
  if (value.includes("back")) return "backend";
  if (value.includes("tool")) return "tools";

  return null;
}

function inferCategory(title: string): SkillCategory {
  if (BACKEND_PATTERN.test(title)) return "backend";
  if (TOOLS_PATTERN.test(title)) return "tools";
  if (FRONTEND_PATTERN.test(title)) return "frontend";

  return "tools";
}

function resolveSkillCategory(item: SkillsContentProps): SkillCategory {
  if (item.category) {
    const fromApi =
      typeof item.category === "string"
        ? resolveApiCategory(item.category)
        : item.category;

    if (fromApi) return fromApi;
  }

  return TITLE_CATEGORY[normalizeTitle(item.title)] ?? inferCategory(item.title);
}

function mapSkill(item: SkillsContentProps): Skill {
  return {
    title: item.title,
    imageUrl: item.imageUrl,
    category: resolveSkillCategory(item),
  };
}

export function groupSkillsByCategory(skills: Skill[]): GroupedSkills {
  const grouped: GroupedSkills = {
    frontend: [],
    backend: [],
    tools: [],
  };

  for (const skill of skills) {
    grouped[skill.category].push(skill);
  }

  return grouped;
}

/** Keahlian / tech stack dari API — di-fetch saat SSR/build. */
export async function getSkills(): Promise<Skill[]> {
  const items = await fetchSkillsContents();
  return items.map(mapSkill);
}

export async function getGroupedSkills(): Promise<GroupedSkills> {
  return groupSkillsByCategory(await getSkills());
}
