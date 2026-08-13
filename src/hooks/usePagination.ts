/**
 * Pagination Hook
 * Keeps page number and page size in sync for both client-sliced and
 * server-paginated tables.
 */

"use client";

import { useCallback, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

export const usePagination = (initialPageSize: number = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  /**
   * Changing the page size re-slices the whole result set, so the current
   * page number is meaningless afterwards - always restart at page 1.
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const previousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(1, page - 1));
  }, []);

  const nextPage = useCallback((totalPages: number) => {
    setCurrentPage((page) => (page < totalPages ? page + 1 : page));
  }, []);

  /** Call when a filter or search term changes so results start from the top */
  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  };
};

/**
 * Total page count for a result set, never below 1 so "Page 1 of 1" holds
 * for an empty table.
 */
export const getTotalPages = (totalItems: number, pageSize: number): number =>
  Math.max(1, Math.ceil(totalItems / pageSize));
