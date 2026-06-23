interface ProjectCategoryDetail {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectsContentProps {
  _id: string;
  title: string;
  slug: string;
  previewLink: string;
  category: string;
  categoryId?: string;
  categoryDetail: ProjectCategoryDetail;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsPaginationMeta {
  page: number;
  pageItem: number;
  totalPages: number;
  nextPage: boolean;
  prevPage: boolean;
}

interface ProjectsPaginatedResponse extends ProjectsPaginationMeta {
  data: ProjectsContentProps[];
}

interface ProjectFramework {
  title: string;
  imageUrl: string;
}

interface ProjectDetails extends ProjectsContentProps {
  description: string;
  content: string;
  thumbnail: string;
  imageUrl: string[];
  frameworks: ProjectFramework[];
}

interface FetchProjectsPageOptions {
  page?: number;
  pageItem?: number;
  revalidate?: number;
}

interface Props {
  works: ArchiveWork[];
}