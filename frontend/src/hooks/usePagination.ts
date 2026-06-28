import { useState, useMemo, useCallback } from "react";

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const usePagination = <T,>(
  data: T[],
  pageSize: number = 10
): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const total = data.length;
  const totalPages = Math.ceil(total / pageSizeState);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSizeState;
    const endIndex = startIndex + pageSizeState;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSizeState]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    pageSize: pageSizeState,
    total,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setPageSize: setPageSizeState,
    hasNextPage,
    hasPrevPage,
  };
};
