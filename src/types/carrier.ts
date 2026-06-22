export interface CareerDateRange {
  start: string;
  end: string;
}

export interface CareerContentProps {
  _id: string;
  description: string;
  date: CareerDateRange;
  position: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}
