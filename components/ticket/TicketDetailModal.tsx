"use client";

import { Modal } from "@/components/common";
import TicketThreadPanel from "./TicketThreadPanel";
import { useTicketThread } from "@/hooks/api/useOfficerCustomer";

interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  /** Kept for call sites that already pass it; the thread is keyed on the
      ticket, so nothing here reads it */
  distributorId?: string | null;
  distributorName?: string;
  /**
   * Hides the status picker for a viewer who may only read the thread.
   * Defaults to on - an account officer, an admin and a regional admin all
   * carry the authority to move a ticket along.
   */
  canUpdateStatus?: boolean;
  /** Hides the composer for a read-only viewer */
  canReply?: boolean;
}

/**
 * Ticket Detail Modal
 *
 * A dialog around `TicketThreadPanel`. The conversation, the status control
 * and the reply composer all live in the panel so the officer dashboard, the
 * admin Interaction Audit screen and the regional Open Tickets page behave
 * identically - only the container differs.
 */
export default function TicketDetailModal({
  open,
  onClose,
  ticketId,
  distributorName,
  canUpdateStatus = true,
  canReply = true,
}: TicketDetailModalProps) {
  // Read from the same cache the panel fills, purely to title the dialog
  const { data: ticketData } = useTicketThread(open && ticketId ? ticketId : null);

  return (
    <Modal
      title={
        ticketData?.ticketId
          ? `Ticket: ${ticketData.ticketId}${distributorName ? ` - ${distributorName}` : ""}`
          : "Ticket Details"
      }
      open={open}
      onClose={onClose}
      className="max-w-2xl"
    >
      <TicketThreadPanel
        // Remounting per ticket clears any half-typed reply from the previous
        // one rather than carrying it across conversations
        key={ticketId ?? "empty"}
        ticketId={open ? ticketId : null}
        customerName={distributorName}
        canUpdateStatus={canUpdateStatus}
        canReply={canReply}
        className="h-112"
      />
    </Modal>
  );
}
