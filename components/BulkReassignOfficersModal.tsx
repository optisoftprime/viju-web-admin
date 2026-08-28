"use client";

import { useMemo, useState } from "react";
import { Button, Modal, Text } from "@/components/common";
import { REGIONS } from "@/constants/regions";
import { formatRegion } from "@/utils/formatter";
import type { BroadcastRegion } from "@/lib/api/types";

export interface ReassignableOfficer {
  id: string;
  name: string;
  /** API enum, not the display label */
  regionValue: string;
  customers: number;
}

interface BulkReassignOfficersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (region: BroadcastRegion) => void;
  isSubmitting?: boolean;
  officers: ReassignableOfficer[];
}

/**
 * Spec 39: move every selected account officer into one region.
 *
 * The officers keep their customers - only their own region changes - so the
 * modal says so plainly. An officer whose customers are in the region they are
 * leaving will be holding out-of-region accounts afterwards, and that is the
 * admin's call to make, not something to hide behind a confirmation.
 *
 * Officers already in the chosen region are shown as unchanged rather than
 * quietly dropped, so the count in the button matches what is ticked.
 */
export default function BulkReassignOfficersModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  officers,
}: BulkReassignOfficersModalProps) {
  const [region, setRegion] = useState("");

  /**
   * A reopened modal starts clean rather than showing the last pick. Reset
   * during render, not in an effect - an effect would paint the previous
   * choice for one frame before clearing it.
   */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setRegion("");
  }

  const alreadyThere = useMemo(
    () => (region ? officers.filter((o) => o.regionValue === region) : []),
    [officers, region],
  );

  const customersAffected = officers.reduce(
    (total, officer) => total + officer.customers,
    0,
  );

  const handleClose = () => {
    // Don't let the user dismiss a batch that is already running
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto space-y-4">
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            Reassign {officers.length}{" "}
            {officers.length === 1 ? "Officer" : "Officers"}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            Move the selected account officers into a single region.
          </Text>
        </div>

        {/* Who is in the batch, and where each one is now */}
        <div className="max-h-40 overflow-y-auto rounded-md border border-muted/20 p-3 space-y-1">
          {officers.map((officer) => (
            <Text
              key={officer.id}
              variant="caption"
              weight="medium"
              color="muted"
              className="block"
            >
              {officer.name} - {formatRegion(officer.regionValue)} (
              {officer.customers}{" "}
              {officer.customers === 1 ? "customer" : "customers"})
            </Text>
          ))}
        </div>

        <div className="space-y-2">
          <Text variant="small" weight="semibold" color="foreground">
            New Region
          </Text>
          <select
            value={region}
            aria-label="New region"
            onChange={(event) => setRegion(event.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 rounded-md border border-muted/50 bg-white text-[13px] font-medium"
          >
            <option value="">Select a region</option>
            {REGIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {alreadyThere.length > 0 && (
          <div className="rounded-md bg-muted/10 px-4 py-3">
            <Text variant="caption" weight="medium" color="muted">
              {alreadyThere.length} of these officers{" "}
              {alreadyThere.length === 1 ? "is" : "are"} already in{" "}
              {formatRegion(region)}. They are sent anyway and come back
              unchanged.
            </Text>
          </div>
        )}

        <div className="rounded-md bg-[#FFF4E1] px-4 py-3">
          <Text variant="caption" weight="medium" color="orange">
            Customers are not moved. These officers keep the{" "}
            {customersAffected}{" "}
            {customersAffected === 1 ? "customer" : "customers"} they hold, so
            any of those outside the new region will need reassigning
            separately.
          </Text>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-muted/20">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            disabled={!region || isSubmitting}
            onClick={() => region && onConfirm(region as BroadcastRegion)}
            className="bg-linear-to-r from-primary via-orange to-primary"
          >
            Reassign {officers.length}{" "}
            {officers.length === 1 ? "Officer" : "Officers"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
