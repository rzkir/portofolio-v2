interface AchievementsContentProps {
  _id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface AchievementsPaginationMeta {
  page: number;
  pageItem: number;
  totalPages: number;
  nextPage: boolean;
  prevPage: boolean;
}

interface AchievementsPaginatedResponse extends AchievementsPaginationMeta {
  data: AchievementsContentProps[];
}

interface FetchAchievementsPageOptions {
  page?: number;
  pageItem?: number;
  revalidate?: number;
}

type Credential = {
  code: string;
  title: string;
  issuer: string;
  year: string;
  imageUrl: string;
};

interface Props {
  credentials: Credential[];
  idPrefix?: string;
}