"use client";

import { useState } from "react";
import TicketCard from "./TicketCard";
import TicketDetailModal from "./TicketDetailModal";
import { Text } from "@/components/common";

interface Ticket {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Awaiting Customer" | "Resolved";
  repliesUpdated: number;
  dateUpdated: string;
}

interface TicketsUIProps {
  tickets?: Ticket[];
  distributorId?: string | null;
  distributorName?: string;
}

export default function TicketsUI({
  tickets = [
    {
      id: "TK-0041",
      title: "Delivery delay on order VJ-2024-875",
      status: "Open",
      repliesUpdated: 5,
      dateUpdated: "12 Mar 2026",
    },
    {
      id: "TK-0041",
      title: "Invoice Correction Request",
      status: "Open",
      repliesUpdated: 5,
      dateUpdated: "12 Mar 2026",
    },
    {
      id: "TK-0041",
      title: "Damaged Cartons Received",
      status: "Open",
      repliesUpdated: 5,
      dateUpdated: "12 Mar 2026",
    },
  ],
  distributorId,
  distributorName,
}: TicketsUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTicketClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg">
        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tickets.length > 0 ? (
            tickets.map((ticket, i) => (
              <div
                key={i}
                onClick={handleTicketClick}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <TicketCard
                  ticketId={ticket.id}
                  title={ticket.title}
                  status={ticket.status}
                  repliesUpdated={ticket.repliesUpdated}
                  dateUpdated={ticket.dateUpdated}
                  onStatusChange={() => {}}
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <Text variant="caption" color="muted">
                No tickets found
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        distributorId={distributorId || null}
        distributorName={distributorName}
      />
    </>
  );
}
