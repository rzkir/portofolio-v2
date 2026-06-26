type PaginatedPage = {
  totalPages: number;
  pageItem: number;
  data: unknown[];
};

/** Hitung total item tanpa fetch semua halaman — cukup halaman 1 + halaman terakhir. */
export async function countPaginatedItems(
  fetchPage: (page: number, pageItem?: number) => Promise<PaginatedPage>,
): Promise<number> {
  const first = await fetchPage(1);
  if (first.totalPages <= 1) return first.data.length;

  const last = await fetchPage(first.totalPages, first.pageItem);
  return (first.totalPages - 1) * first.pageItem + last.data.length;
}
