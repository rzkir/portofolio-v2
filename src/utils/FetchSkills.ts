import { apiFetch } from "@/lib/apiFetch";

const SKILLS_PATH = "/api/v1/skills";

export const fetchSkillsContents = async (): Promise<SkillsContentProps[]> => {
    try {
        const data = await apiFetch<SkillsContentProps[]>(SKILLS_PATH, {
            revalidate: 60,
            tags: ["skills"],
        });
        return data;
    } catch (error) {
        console.error("Error fetching skills contents:", error);
        throw error;
    }
};  