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
 * Page size the server actually applied.
 *
 * A user can type any positive number into the page-size input; the API clamps
 * it (to 200) and echoes the applied value back in `meta.pageSize`. Reading
 * that back keeps the "showing X of Y" line honest instead of reporting the
 * requested size. Falls back to the requested size when meta is missing or
 * malformed.
 */
export const getAppliedPageSize = (
  meta: { pageSize?: unknown } | null | undefined,
  requested: number,
): number => {
  const applied = Number(meta?.pageSize);
  return Number.isFinite(applied) && applied > 0
    ? Math.floor(applied)
    : Math.max(1, requested);
};

/**
 * Total page count for a result set, never below 1 so "Page 1 of 1" holds
 * for an empty table.
 */
export const getTotalPages = (totalItems: number, pageSize: number): number =>
  Math.max(1, Math.ceil(totalItems / pageSize));
