"use client";

import { useMemo, useState } from "react";
import TicketCard from "./TicketCard";
import TicketDetailModal from "./TicketDetailModal";
import { Text } from "@/components/common";
import {
  useOfficerTickets,
  useUpdateTicketStatus,
} from "@/hooks/api/useOfficerCustomer";

interface TicketsUIProps {
  distributorId?: string | null;
  distributorName?: string;
}

export default function TicketsUI({
  distributorId: _distributorId,
  distributorName,
}: TicketsUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useOfficerTickets(page, pageSize);
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTicketStatus();

  const tickets = useMemo(() => data?.data ?? [], [data]);

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
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

          {!isLoading && error && (
            <div className="flex items-center justify-center h-full">
              <Text variant="caption" color="muted">
                Error loading tickets. Please try again.
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
                No tickets found
              </Text>
            </div>
          )}

          {!isLoading && !error && tickets.length > 0 && data?.meta && (
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
        distributorId={_distributorId || null}
        distributorName={distributorName}
      />
    </>
  );
}
