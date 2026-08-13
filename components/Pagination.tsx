"use client";

import { useEffect, useRef, useState } from "react";
import { Text, Button } from "@/components/common";
import { MIN_PAGE_SIZE, parsePageSize } from "@/constants/pagination";

/**
 * Interface for Pagination component props
 * @param currentPage - Current page number (1-indexed)
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @param onPrevious - Callback function when Previous button is clicked
 * @param onNext - Callback function when Next button is clicked
 * @param disabled - Whether pagination buttons should be disabled
 * @param onItemsPerPageChange - Callback when the page size changes. The
 *   "Items per page" input is only rendered when this is supplied, so
 *   existing call sites keep their current look until they opt in.
 */
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPrevious?: () => void;
  onNext?: () => void;
  disabled?: boolean;
  onItemsPerPageChange?: (pageSize: number) => void;
}

/** How long to wait after the last keystroke before applying a new page size */
const PAGE_SIZE_DEBOUNCE_MS = 500;

/**
 * Pagination Component
 * Displays pagination controls with item count information
 * Shows range of items being displayed and provides Previous/Next navigation buttons
 *
 * @param {PaginationProps} props - Component props
 * @returns {JSX.Element} - Rendered pagination component
 */
export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPrevious,
  onNext,
  disabled = false,
  onItemsPerPageChange,
}: PaginationProps) {
  /**
   * What the user is currently typing. Held separately from `itemsPerPage`
   * so the field can be empty or half-typed without the table reacting to a
   * value the user has not finished entering.
   */
  const [pageSizeDraft, setPageSizeDraft] = useState(String(itemsPerPage));

  /**
   * Held in a ref so a parent re-render (a background refetch, say) does not
   * restart the debounce timer and swallow what the user just typed.
   */
  const onItemsPerPageChangeRef = useRef(onItemsPerPageChange);
  useEffect(() => {
    onItemsPerPageChangeRef.current = onItemsPerPageChange;
  });

  // Follow the page size when the parent changes it (e.g. a filter reset)
  useEffect(() => {
    setPageSizeDraft(String(itemsPerPage));
  }, [itemsPerPage]);

  /**
   * Apply the typed value once typing settles, so entering "100" makes one
   * request instead of one per keystroke. Invalid input is simply ignored -
   * the table keeps the last good page size until the field is valid again.
   */
  useEffect(() => {
    const parsed = parsePageSize(pageSizeDraft);
    if (parsed === null || parsed === itemsPerPage) return;

    const timer = setTimeout(
      () => onItemsPerPageChangeRef.current?.(parsed),
      PAGE_SIZE_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [pageSizeDraft, itemsPerPage]);

  /** Keep only digits so letters, signs and decimals never reach the table */
  const handlePageSizeInput = (value: string) => {
    setPageSizeDraft(value.replace(/\D/g, ""));
  };

  /**
   * Leaving the field with nothing usable in it (empty, or "0") restores the
   * page size in effect, so the input never sits on an invalid value.
   */
  const handlePageSizeBlur = () => {
    const parsed = parsePageSize(pageSizeDraft);

    if (parsed === null) {
      setPageSizeDraft(String(itemsPerPage));
      return;
    }

    // Commit straight away rather than waiting out the debounce
    if (parsed !== itemsPerPage) {
      onItemsPerPageChange?.(parsed);
    }
  };

  // Calculate the range of items displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Determine if buttons should be disabled
  const isPreviousDisabled = disabled || currentPage === 1;
  const isNextDisabled = disabled || currentPage >= totalPages;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border border-[#E0E7F0] rounded-bl-lg rounded-br-lg">
      {/* Item Count Information + Results Per Page */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Text variant="small" color="muted">
          Showing {startItem} to {endItem} of {totalItems}
        </Text>

        {/* Items Per Page Input - any positive whole number */}
        {onItemsPerPageChange && (
          <label className="flex items-center gap-2">
            <Text variant="small" color="muted">
              Items per page
            </Text>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              title={`Any whole number from ${MIN_PAGE_SIZE} upwards`}
              value={pageSizeDraft}
              disabled={disabled}
              onChange={(event) => handlePageSizeInput(event.target.value)}
              onBlur={handlePageSizeBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              className="w-20 px-2 py-1 rounded-md border border-[#E0E7F0] bg-white text-[13px] font-medium text-muted focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Items per page"
            />
          </label>
        )}
      </div>

      {/* Pagination Buttons */}
      <div className="flex gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={isPreviousDisabled}
          onClick={onPrevious}
        >
          Previous
        </Button>

        {/* Next Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={isNextDisabled}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
