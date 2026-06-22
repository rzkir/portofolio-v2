export interface ProjectCategoryDetail {
  _id: string;
  name: string;
}

export interface ProjectsContentProps {
  _id: string;
  title: string;
  slug: string;
  previewLink: string;
  category: string;
  categoryDetail: ProjectCategoryDetail;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsPaginationMeta {
  page: number;
  pageItem: number;
  totalPages: number;
  nextPage: boolean;
  prevPage: boolean;
}

export interface ProjectsPaginatedResponse extends ProjectsPaginationMeta {
  data: ProjectsContentProps[];
}

export interface ProjectFramework {
  title: string;
  imageUrl: string;
}

export interface ProjectDetails extends ProjectsContentProps {
  description: string;
  content: string;
  thumbnail: string;
  imageUrl: string[];
  frameworks: ProjectFramework[];
}
