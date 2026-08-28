"use client";

import { useState } from "react";
import { Button, Modal, Text, Textarea } from "@/components/common";
import { BoldTopText } from "./common/BoldTopText";

interface CancelLoadingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the trimmed reason, or "" when none was given */
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
  distributor?: string;
  waybill?: string;
  officer?: string;
  status?: string;
  /**
   * Who this cancellation reaches. Differs by caller: a regional admin or
   * account officer notifies the distributor AND the assigned loading officer;
   * a loading officer cancelling their own load notifies only the distributor,
   * since telling them about their own action is noise.
   */
  subtitle?: string;
}

const MAX_REASON = 300;

/**
 * Spec 39: confirm calling off a loading request.
 *
 * Cancelling is visible to the loading officer working the load and cannot be
 * undone from this portal, so it is never a one-click action on the table - the
 * row is named back to the user before anything is sent.
 *
 * The reason is OPTIONAL. It is passed up trimmed, and an empty one is dropped
 * by the service rather than sent as a blank string, which would read as a
 * reason that was actually given.
 */
export default function CancelLoadingRequestModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  distributor,
  waybill,
  officer,
  status,
  subtitle = "The assigned loading officer sees this immediately.",
}: CancelLoadingRequestModalProps) {
  const [reason, setReason] = useState("");

  /**
   * A reopened modal starts clean rather than carrying the last attempt.
   *
   * Reset during render rather than in an effect - an effect would paint the
   * previous reason into the reopened modal for one frame before clearing it.
   * Same idiom as `SelectedAssignement`.
   */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setReason("");
  }

  const handleClose = () => {
    // Don't let the user dismiss a request that is already in flight
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            Cancel Loading Request
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            {subtitle}
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <BoldTopText top="Distributor" bottom={distributor || "-"} />
          <BoldTopText top="Waybill" bottom={waybill || "-"} />
          <BoldTopText top="Loading Officer" bottom={officer || "Unassigned"} />
          <BoldTopText top="Current Status" bottom={status || "-"} />
        </div>

        <Textarea
          label="Reason (optional)"
          name="cancelReason"
          value={reason}
          placeholder="e.g. distributor rescheduled the pickup"
          maxLength={MAX_REASON}
          onChange={(value: string) => setReason(value)}
          disabled={isSubmitting}
          className="min-h-24 rounded-md"
        />

        <div className="rounded-md bg-[#FFF4E1] px-4 py-3">
          <Text variant="caption" weight="medium" color="orange">
            A cancelled load cannot be reopened from this portal. The
            distributor has to submit a new request.
          </Text>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-muted/20">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-foreground"
          >
            Keep Request
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={() => onConfirm(reason.trim())}
            className="bg-linear-to-r from-primary via-orange to-primary"
          >
            Cancel Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
