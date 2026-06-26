import type { Locale } from "@/lib/i18n";
import {
  fetchArticleBySlug,
  fetchArticlesContents,
} from "@/utils/FetchBlogs";

export function getArticleCategory(article: ArticlesContentProps): string {
  return article.categoryDetail?.name ?? article.category;
}

export function formatBlogDate(iso: string, locale: Locale): string {
  const date = new Date(iso);

  return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getBlogCategories(articles: ArticlesContentProps[]): string[] {
  const categories = new Set(articles.map(getArticleCategory));
  return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
}

export function getBlogYear(createdAt: string): string {
  const year = new Date(createdAt).getUTCFullYear();
  return Number.isNaN(year) ? "—" : String(year);
}

export function mapArticleToCard(
  article: ArticlesContentProps,
  index: number,
  indexOffset = 2,
): {
  no: string;
  title: string;
  tag: string;
  year: string;
  image: string;
  href: string;
  category: string;
} {
  return {
    no: String(index + indexOffset).padStart(2, "0"),
    title: article.title,
    tag: getArticleCategory(article),
    year: getBlogYear(article.createdAt),
    image: article.thumbnail,
    href: `/blog/${article.slug}`,
    category: getArticleCategory(article),
  };
}

export async function getBlogArchive(): Promise<ArticlesContentProps[]> {
  return fetchArticlesContents();
}

export async function getBlogBySlug(slug: string): Promise<ArticleDetails> {
  return fetchArticleBySlug(slug);
}

export async function getRelatedArticles(
  slug: string,
  limit = 2,
): Promise<ArticlesContentProps[]> {
  const articles = await getBlogArchive();
  const current = articles.find((item) => item.slug === slug);
  if (!current) return articles.filter((item) => item.slug !== slug).slice(0, limit);

  const currentCategory = getArticleCategory(current);

  const sameCategory = articles.filter(
    (item) => item.slug !== slug && getArticleCategory(item) === currentCategory,
  );

  const pool = sameCategory.length > 0 ? sameCategory : articles.filter((item) => item.slug !== slug);

  return pool.slice(0, limit);
}
