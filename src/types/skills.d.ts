type SkillCategory = "frontend" | "backend" | "tools";

interface SkillsContentProps {
    title: string;
    imageUrl: string;
    category?: SkillCategory | string;
}

interface TechSkillProps {
    skillsData: SkillsContentProps[];
}

type Skill = {
    title: string;
    imageUrl: string;
    category: SkillCategory;
  };
  
  type GroupedSkills = Record<SkillCategory, Skill[]>;
  