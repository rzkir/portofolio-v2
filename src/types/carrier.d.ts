interface CareerDateRange {
  start: string;
  end: string;
}

interface CareerContentProps {
  _id: string;
  description: string;
  date: CareerDateRange;
  position: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

type Career = {
  org: string;
  role: string;
  range: string;
  desc: string;
};