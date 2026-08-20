"use client";

import { Text } from "@/components/common";
import { safeNumber } from "@/utils/safe";
import {
  buildErpCaption,
  getAwaitingProjection,
  getUnmappedRegionCount,
} from "@/utils/erp";
import type { AdminDashboardStats } from "@/lib/api/types";

interface ErpDataQualityBannerProps {
  stats?: AdminDashboardStats | null;
}

const formatCount = (value: unknown): string =>
  new Intl.NumberFormat("en-NG").format(safeNumber(value, 0));

/**
 * ERP data-quality notice (B-2).
 *
 * The customer list can only ever show rows the projector has copied out of
 * the ERP feed, and rows whose region could not be mapped are quarantined
 * rather than shown with a bad region. Both facts are otherwise invisible -
 * the screen just looks like it has fewer customers than it should.
 *
 * Renders nothing when there is nothing to report, so a healthy pipeline costs
 * no vertical space.
 */
export default function ErpDataQualityBanner({
  stats,
}: ErpDataQualityBannerProps) {
  if (!stats) return null;

  const awaiting = getAwaitingProjection(stats);
  const unmapped = getUnmappedRegionCount(stats);
  const caption = buildErpCaption(stats);

  if (awaiting <= 0 && unmapped <= 0) return null;

  const messages: string[] = [];

  if (awaiting > 0) {
    messages.push(
      `${formatCount(awaiting)} customer${awaiting === 1 ? "" : "s"} in the ERP feed have not been copied into the portal yet, so lists and totals below may differ.`,
    );
  }

  if (unmapped > 0) {
    messages.push(
      `${formatCount(unmapped)} ERP record${unmapped === 1 ? " was" : "s were"} held back because ${unmapped === 1 ? "its" : "their"} region could not be matched to a Viju region.`,
    );
  }

  return (
    <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 space-y-1">
      <Text variant="caption" weight="bold" color="orange">
        ERP sync incomplete
      </Text>
      {messages.map((message, index) => (
        <Text key={index} variant="small" weight="medium" color="muted">
          {message}
        </Text>
      ))}
      {caption && (
        <Text variant="small" weight="medium" color="muted">
          {caption}
        </Text>
      )}
    </div>
  );
}
