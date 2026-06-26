import {
  bindArchiveView,
  type ArchiveView,
  type ArchiveViewConfig,
} from "@/service/archive-view.service";

export type WorksView = ArchiveView;

export const WORKS_VIEW_STORAGE_KEY = "works-view";

export const WORKS_VIEW_CONFIG: ArchiveViewConfig = {
  archiveSelector: "[data-works-archive]",
  buttonSelector: "[data-archive-view-btn]",
  storageKey: WORKS_VIEW_STORAGE_KEY,
};

export function bindWorksView(root: ParentNode = document): void {
  bindArchiveView(WORKS_VIEW_CONFIG, root);
}
