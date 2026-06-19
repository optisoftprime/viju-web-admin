"use client";

import { Text, Button } from "@/components/common";

/**
 * Interface for Pagination component props
 * @param currentPage - Current page number (1-indexed)
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @param onPrevious - Callback function when Previous button is clicked
 * @param onNext - Callback function when Next button is clicked
 * @param disabled - Whether pagination buttons should be disabled
 */
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPrevious?: () => void;
  onNext?: () => void;
  disabled?: boolean;
}

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
}: PaginationProps) {
  // Calculate the range of items displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Determine if buttons should be disabled
  const isPreviousDisabled = disabled || currentPage === 1;
  const isNextDisabled = disabled || currentPage >= totalPages;

  return (
    <div className="flex items-center justify-between p-4 border border-[#E0E7F0] rounded-bl-lg rounded-br-lg">
      {/* Item Count Information */}
      <Text variant="small" color="muted">
        Showing {startItem} to {endItem} of {totalItems}
      </Text>

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
