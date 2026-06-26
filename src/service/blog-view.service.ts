import {
  bindArchiveView,
  type ArchiveViewConfig,
} from "@/service/archive-view.service";

export const BLOG_VIEW_STORAGE_KEY = "blog-view";

export const BLOG_VIEW_CONFIG: ArchiveViewConfig = {
  archiveSelector: "[data-blog-archive]",
  buttonSelector: "[data-archive-view-btn]",
  storageKey: BLOG_VIEW_STORAGE_KEY,
};

export function bindBlogView(root: ParentNode = document): void {
  bindArchiveView(BLOG_VIEW_CONFIG, root);
}
