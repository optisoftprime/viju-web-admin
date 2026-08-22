/**
 * ERP freshness helpers (B-1.2 / B-2)
 *
 * The ERP feed and the application tables are reconciled by a projector that
 * runs outside this service. When it falls behind, the customer list shows far
 * fewer rows than the ERP actually holds. Rather than silently showing a wrong
 * number, these helpers turn the reconciliation block into a short, honest
 * caption.
 */

import { safeDate, safeNumber } from "@/utils/safe";
import { formatRelativeTime, formatNumberExact } from "@/utils/formatter";
import type { AdminDashboardStats, ErpReconciliation } from "@/lib/api/types";

/**
 * Format a count with thousands separators, tolerating null/undefined/NaN.
 */
const formatCount = (value: unknown): string =>
  formatNumberExact(safeNumber(value, 0));

/**
 * "3h ago" for a timestamp the ERP reported, or null when there is none or it
 * cannot be parsed. Never throws on a malformed date string.
 */
export const formatSyncAge = (value: unknown): string | null => {
  const date = safeDate(value);
  if (!date) return null;

  try {
    const relative = formatRelativeTime(date.toISOString());
    return relative && relative.trim() ? relative : null;
  } catch {
    return null;
  }
};

/**
 * Number of ERP customers not yet copied into the application tables.
 * Reads the reconciliation block, falling back to the flat fields.
 */
export const getAwaitingProjection = (
  stats?: AdminDashboardStats | null,
): number => {
  const reconciliation: ErpReconciliation | null | undefined =
    stats?.erpReconciliation;
  return safeNumber(reconciliation?.awaitingProjection, 0);
};

/**
 * Number of ERP rows quarantined because their region could not be mapped.
 */
export const getUnmappedRegionCount = (
  stats?: AdminDashboardStats | null,
): number =>
  safeNumber(
    stats?.unmappedRegionCount ?? stats?.erpReconciliation?.unmappedRegionCount,
    0,
  );

/**
 * Caption for the Total Customers tile.
 *
 * Returns null when everything is in sync and recent - there is nothing worth
 * saying, and an empty caption should not push the layout around. Examples:
 *   "1,847 awaiting sync · synced 3h ago"
 *   "synced 12m ago"
 *   "local data only"
 */
export const buildErpCaption = (
  stats?: AdminDashboardStats | null,
): string | null => {
  if (!stats) return null;

  const parts: string[] = [];

  // A LOCAL source means no ERP feed is attached, so the count is local-only
  const source = stats.erpReconciliation?.source;
  if (typeof source === "string" && source.toUpperCase() === "LOCAL") {
    parts.push("local data only");
  }

  const awaiting = getAwaitingProjection(stats);
  if (awaiting > 0) {
    parts.push(`${formatCount(awaiting)} awaiting sync`);
  }

  const age = formatSyncAge(
    stats.lastErpSyncAt ?? stats.erpReconciliation?.lastSyncAt,
  );
  if (age) {
    parts.push(`synced ${age}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
};
