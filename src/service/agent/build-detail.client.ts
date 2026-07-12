import { applyAgentBuildPageMetadata } from "@/lib/agent-build-metadata";
import { getAgentWebBuild } from "@/service/agent/builds.client";

function bindBuildDetail(root: ParentNode = document): void {
  const page = root.querySelector<HTMLElement>("#agent-build-detail");
  if (!page || page.dataset.bound === "true") return;

  const buildId = page.dataset.buildId?.trim();
  if (!buildId) return;

  page.dataset.bound = "true";

  const build = getAgentWebBuild(buildId);
  const frame = page.querySelector<HTMLIFrameElement>("#agent-build-frame");

  if (!build) {
    window.location.replace("/agent");
    return;
  }

  if (frame) {
    frame.srcdoc = build.preview.document;
    frame.title = build.title;
  }

  applyAgentBuildPageMetadata(build);

  document.addEventListener(
    "astro:before-preparation",
    () => {
      page.dataset.bound = "false";
    },
    { once: true },
  );
}

export function bindAgentBuildDetail(root: ParentNode = document): void {
  bindBuildDetail(root);
  document.addEventListener("astro:page-load", () => bindBuildDetail(document));
}
