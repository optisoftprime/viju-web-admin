/**
 * Pagination Constants
 *
 * Single source of truth for how many records a paginated table shows per
 * page. Change DEFAULT_PAGE_SIZE here and every table starts on the new
 * value - nothing else needs to change.
 *
 * There is no fixed list of choices: each table's "Items per page" input
 * accepts any positive whole number the user types.
 */

/** Page size a table starts on when it does not ask for a specific one */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Page size for the compact tables embedded inside the distributor detail
 * panel (Orders, Invoices, Stock, Waybills).
 */
export const DEFAULT_SECTION_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/** Smallest page size accepted - a page must hold at least one record */
export const MIN_PAGE_SIZE = 1;

/**
 * Parse a user-typed page size.
 * Returns null for anything that is not a positive whole number, so callers
 * can keep the previous value instead of requesting an invalid page.
 */
export const parsePageSize = (value: string): number | null => {
  if (!/^\d+$/.test(value.trim())) return null;

  const parsed = Number.parseInt(value, 10);
  return parsed >= MIN_PAGE_SIZE ? parsed : null;
};
