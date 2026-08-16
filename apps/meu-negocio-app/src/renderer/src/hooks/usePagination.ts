import { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const paginatedItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  return { page, setPage, totalPages, paginatedItems, start };
}
