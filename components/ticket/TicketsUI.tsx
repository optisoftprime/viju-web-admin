"use client";

import { useState } from "react";
import TicketCard from "./TicketCard";
import TicketDetailModal from "./TicketDetailModal";
import { Text } from "@/components/common";
import { getErrorMessage } from "@/utils/apiError";
import {
  useOfficerTickets,
  useUpdateTicketStatus,
} from "@/hooks/api/useOfficerCustomer";

interface TicketsUIProps {
  distributorId?: string | null;
  distributorName?: string;
  /**
   * Open this ticket's thread as soon as the list renders.
   *
   * Set by the dashboard's Open Tickets tile, which already knows which ticket
   * the officer is being sent to - so the conversation appears without them
   * having to find the row and click it.
   *
   * Remount the component (change its `key`) to trigger a fresh auto-open
   * after the reader has closed one.
   */
  autoOpenTicketId?: string | null;
}

export default function TicketsUI({
  distributorId,
  distributorName,
  autoOpenTicketId,
}: TicketsUIProps) {
  /**
   * null means the reader has not opened or closed anything yet, which is what
   * lets `autoOpenTicketId` decide. Any click - on a row or on close - takes
   * ownership from then on, so the auto-opened modal stays closed once
   * dismissed. Derived rather than synced in an effect.
   */
  const [pickedTicketId, setPickedTicketId] = useState<{
    id: string | null;
  } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const selectedTicketId = pickedTicketId
    ? pickedTicketId.id
    : (autoOpenTicketId ?? null);
  const isModalOpen = Boolean(selectedTicketId);

  /**
   * This tab lives inside a distributor's detail view, so it asks for that
   * distributor's tickets. `customerId` is applied in SQL (AO-T1), so
   * `meta.total` counts the filtered set and the pager agrees with the rows.
   */
  const { data, isLoading, error } = useOfficerTickets(page, pageSize, {
    customerId: distributorId ?? undefined,
  });
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTicketStatus();

  const tickets = data?.data ?? [];

  const handleTicketClick = (ticketId: string) => {
    setPickedTicketId({ id: ticketId });
  };

  const handlePrevPage = () => {
    if (data?.meta.hasPreviousPage) {
      setPage((current) => Math.max(1, current - 1));
    }
  };

  const handleNextPage = () => {
    if (data?.meta.hasNextPage) {
      setPage((current) => current + 1);
    }
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    updateStatus({ ticketId, status });
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Text variant="caption" color="muted">
                Loading tickets...
              </Text>
            </div>
          )}

          {/* A customerId outside the officer's own book is a deliberate 400
              rather than an empty list, so the message is worth showing */}
          {!isLoading && error && (
            <div className="flex items-center justify-center h-full px-4">
              <Text variant="caption" color="muted" className="text-center">
                {getErrorMessage(
                  error,
                  "Tickets could not be loaded. Please try again.",
                )}
              </Text>
            </div>
          )}

          {!isLoading && !error && tickets.length > 0
            ? tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticketId={ticket.ticketId}
                  title={ticket.subject}
                  status={ticket.status}
                  repliesUpdated={ticket.repliesCount ?? 0}
                  dateUpdated={new Date(ticket.updatedAt).toLocaleDateString()}
                  onSelect={() => handleTicketClick(ticket.id)}
                  onStatusChange={(status) =>
                    handleStatusChange(ticket.id, status)
                  }
                  isUpdatingStatus={isUpdatingStatus}
                />
              ))
            : null}

          {!isLoading && !error && tickets.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <Text variant="caption" color="muted">
                {distributorId
                  ? "This customer has no tickets."
                  : "No tickets found"}
              </Text>
            </div>
          )}

          {!isLoading && !error && data?.meta && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E0E0E0] bg-[#FAFBFC]">
              <Text variant="caption" color="muted">
                Page {data.meta.page} of {data.meta.totalPages}
              </Text>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={!data.meta.hasPreviousPage}
                  className="rounded-md border border-muted/20 bg-white px-3 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!data.meta.hasNextPage}
                  className="rounded-md border border-muted/20 bg-white px-3 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TicketDetailModal
        open={isModalOpen}
        onClose={() => setPickedTicketId({ id: null })}
        ticketId={selectedTicketId}
        distributorId={distributorId || null}
        distributorName={distributorName}
      />
    </>
  );
}
