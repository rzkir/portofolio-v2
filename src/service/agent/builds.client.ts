const STORAGE_KEY = "agent-web-builds";
const MAX_BUILDS = 30;

function readBuilds(): AgentWebBuild[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AgentWebBuild[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuilds(builds: AgentWebBuild[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function saveAgentWebBuild(input: {
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  preview: AgentWebPreview;
}): AgentWebBuild {
  const build: AgentWebBuild = {
    id: crypto.randomUUID(),
    title: input.title,
    prompt: input.prompt,
    category: input.category,
    model: input.model,
    createdAt: new Date().toISOString(),
    preview: input.preview,
  };

  const builds = readBuilds().filter((item) => item.id !== build.id);
  builds.unshift(build);
  writeBuilds(builds.slice(0, MAX_BUILDS));

  return build;
}

export function findOrSaveAgentWebBuild(input: {
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  preview: AgentWebPreview;
}): AgentWebBuild {
  const builds = readBuilds();
  const existing = builds.find(
    (item) =>
      item.preview.document === input.preview.document &&
      item.prompt === input.prompt &&
      item.category === input.category,
  );

  if (existing) return existing;

  return saveAgentWebBuild(input);
}

export function getAgentWebBuild(id: string): AgentWebBuild | null {
  return readBuilds().find((build) => build.id === id) ?? null;
}

export function listAgentWebBuilds(): AgentWebBuild[] {
  return readBuilds();
}
