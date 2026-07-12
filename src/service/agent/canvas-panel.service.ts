import { bindPanelCollapse } from "@/lib/panel-collapse";
import { findOrSaveAgentWebBuild } from "@/service/agent/builds.client";
import { resolveCanvasMetaFromMessages } from "@/service/agent.service";

type CanvasBuildMeta = {
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
};

export function syncAgentCanvasDetailsLink(
  link: HTMLAnchorElement | null,
  preview: AgentWebPreview,
  messages: AgentChatMessage[],
  defaultCategory: AgentPromptCategory | null,
  meta?: CanvasBuildMeta,
  options?: {
    buildId?: string | null;
    threadId?: string | null;
  },
): string | null {
  if (!link) return null;

  const resolvedMeta =
    meta ?? resolveCanvasMetaFromMessages(messages, defaultCategory);

  if (!resolvedMeta) {
    hideAgentCanvasDetailsLink(link);
    return null;
  }

  const build = findOrSaveAgentWebBuild({
    title: preview.title,
    prompt: resolvedMeta.prompt,
    category: resolvedMeta.category,
    model: resolvedMeta.model,
    preview,
    buildId: options?.buildId,
    threadId: options?.threadId,
  });

  link.href = `/agent/${build.id}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.classList.remove("hidden");

  return build.id;
}

export function hideAgentCanvasDetailsLink(
  link: HTMLAnchorElement | null,
): void {
  if (!link) return;

  link.classList.add("hidden");
  link.setAttribute("href", "#");
  link.removeAttribute("target");
  link.removeAttribute("rel");
}

function mountAgentCanvasPanel(root: ParentNode = document): () => void {
  const canvas = root.querySelector<HTMLElement>("#agent-canvas");
  if (!canvas || canvas.dataset.collapseBound === "true") return () => {};

  canvas.dataset.collapseBound = "true";

  const { cleanup, restore } = bindPanelCollapse({
    root: canvas,
    collapseBtn: root.querySelector<HTMLButtonElement>("#agent-canvas-collapse"),
    expandBtn: root.querySelector<HTMLButtonElement>("#agent-canvas-expand"),
    storageKey: "canvas",
    desktopOnly: true,
  });

  const onCanvasOpen = () => restore();
  document.addEventListener("agent-canvas:open", onCanvasOpen);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      cleanup();
      document.removeEventListener("agent-canvas:open", onCanvasOpen);
      canvas.dataset.collapseBound = "false";
    },
    { once: true },
  );

  return cleanup;
}

export function bindAgentCanvasPanel(root: ParentNode = document): void {
  mountAgentCanvasPanel(root);
  document.addEventListener("astro:page-load", () =>
    mountAgentCanvasPanel(document),
  );
}

export function notifyAgentCanvasOpen(): void {
  document.dispatchEvent(new CustomEvent("agent-canvas:open"));
}
