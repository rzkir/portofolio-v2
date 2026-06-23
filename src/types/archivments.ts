export interface AchievementsContentProps {
  _id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementsPaginationMeta {
  page: number;
  pageItem: number;
  totalPages: number;
  nextPage: boolean;
  prevPage: boolean;
}

export interface AchievementsPaginatedResponse extends AchievementsPaginationMeta {
  data: AchievementsContentProps[];
}
