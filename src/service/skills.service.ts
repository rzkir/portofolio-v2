import { fetchSkillsContents } from "@/utils/FetchSkills";
import type { SkillsContentProps } from "@/types/skills";

export type Skill = {
  title: string;
  imageUrl: string;
};

function mapSkill(item: SkillsContentProps): Skill {
  return {
    title: item.title,
    imageUrl: item.imageUrl,
  };
}

/** Keahlian / tech stack dari API — di-fetch saat SSR/build. */
export async function getSkills(): Promise<Skill[]> {
  const items = await fetchSkillsContents();
  return items.map(mapSkill);
}
