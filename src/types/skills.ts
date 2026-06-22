export type SkillCategory = "frontend" | "backend" | "tools";

export interface SkillsContentProps {
    title: string;
    imageUrl: string;
    category?: SkillCategory | string;
}

export interface TechSkillProps {
    skillsData: SkillsContentProps[];
}