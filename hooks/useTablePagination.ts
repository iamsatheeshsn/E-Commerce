"use client";

import { useEffect, useMemo, useState } from "react";

export function useTablePagination<T>(data: T[], pageSize = 15) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const from = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, data.length);

  return {
    page,
    totalPages,
    pageData,
    setPage,
    total: data.length,
    from,
    to,
    pageSize,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
    goNext: () => setPage((p) => Math.min(totalPages, p + 1)),
    resetPage: () => setPage(1),
  };
}
