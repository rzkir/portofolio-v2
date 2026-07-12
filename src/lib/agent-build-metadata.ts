import {
  resolveBreadcrumbs,
  serializeBreadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/breadcrumbs";
import { getMessages, resolveLocale, type Locale } from "@/lib/i18n";

const SITE_NAME = "Rizki Ramadhan";

function getPageLocale(): Locale {
  return resolveLocale(document.documentElement.lang);
}

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function setMetaContent(selector: string, content: string): void {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = content;
}

export function resolveAgentBuildPageCopy(build: AgentWebBuild): {
  title: string;
  description: string;
  breadcrumbCurrent: string;
} {
  const description = truncate(build.prompt || build.title);

  return {
    title: `${build.title} — ${SITE_NAME}`,
    description,
    breadcrumbCurrent: build.title,
  };
}

function buildAgentBuildBreadcrumbs(
  build: AgentWebBuild,
  locale: Locale,
): BreadcrumbItem[] {
  const messages = getMessages(locale);
  const copy = resolveAgentBuildPageCopy(build);

  return resolveBreadcrumbs(
    `/agent/${build.id}`,
    messages.nav,
    copy.breadcrumbCurrent,
  );
}
export function applyAgentBuildPageMetadata(build: AgentWebBuild): void {
  const locale = getPageLocale();
  const copy = resolveAgentBuildPageCopy(build);

  document.title = copy.title;
  setMetaContent('meta[name="description"]', copy.description);
  setMetaContent('meta[property="og:title"]', copy.title);
  setMetaContent('meta[property="og:description"]', copy.description);
  setMetaContent('meta[property="og:image:alt"]', copy.title);
  setMetaContent('meta[name="twitter:title"]', copy.title);
  setMetaContent('meta[name="twitter:description"]', copy.description);

  const breadcrumbs = buildAgentBuildBreadcrumbs(build, locale);
  const breadcrumbJsonLd = serializeBreadcrumbJsonLd(
    window.location.origin,
    breadcrumbs,
  );

  if (!breadcrumbJsonLd) return;

  const script =
    document.querySelector<HTMLScriptElement>("#page-breadcrumb-jsonld") ??
    document.createElement("script");

  script.id = "page-breadcrumb-jsonld";
  script.type = "application/ld+json";
  script.textContent = breadcrumbJsonLd;

  if (!script.isConnected) {
    document.head.appendChild(script);
  }
}
