"use client";

import { getStatusBadgeStyle } from "./Table";

interface StatusBadgeProps {
  status?: string | null;
  /** Shown when there is no status at all, e.g. a row the ERP left blank */
  fallback?: string;
  className?: string;
}

/**
 * A status pill, coloured from the shared palette.
 *
 * The `Table` component already renders its STATUS column this way, but three
 * tables build their own markup - the Orders, Invoices and Waybills tabs in
 * the distributor detail panel - and each had picked its own colours. That is
 * how "Processing" ended up amber in one table and blue in another, and how
 * every ERP status ended up as one flat blue-grey in the officer-parity
 * rebuild.
 *
 * One component, so a status cannot mean two colours depending on which table
 * it appears in.
 */
export default function StatusBadge({
  status,
  fallback = "—",
  className = "",
}: StatusBadgeProps) {
  const label =
    typeof status === "string" && status.trim() ? status.trim() : fallback;

  const { bgColor, textColor } = getStatusBadgeStyle(label);

  return (
    <span
      className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-[12px] font-semibold inline-block whitespace-nowrap ${className}`.trim()}
    >
      {label}
    </span>
  );
}
