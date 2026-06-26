interface ArticleCategoryDetail {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ArticlesContentProps {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  categoryId?: string;
  categoryDetail: ArticleCategoryDetail;
  createdAt: string;
  updatedAt: string;
}

interface ArticlesPaginationMeta {
  page: number;
  pageItem: number;
  totalPages: number;
  nextPage: boolean;
  prevPage: boolean;
}

interface ArticlesPaginatedResponse extends ArticlesPaginationMeta {
  data: ArticlesContentProps[];
}

interface ArticleDetails extends ArticlesContentProps {
  content: string;
}

interface FetchArticlesPageOptions {
  page?: number;
  pageItem?: number;
  revalidate?: number;
}
