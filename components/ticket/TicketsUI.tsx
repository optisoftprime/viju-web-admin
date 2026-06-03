"use client";

import { useState } from "react";
import TicketCard from "./TicketCard";
import { Input, Button } from "@/components/common";

interface Ticket {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Awaiting Customer" | "Resolved";
  repliesUpdated: number;
  dateUpdated: string;
}

interface TicketsUIProps {
  tickets?: Ticket[];
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
}: TicketsUIProps) {
  const [replyInput, setReplyInput] = useState("");

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    console.log(`Ticket ${ticketId} status changed to: ${newStatus}`);
  };

  const handleSendReply = () => {
    if (replyInput.trim()) {
      console.log("Reply:", replyInput);
      setReplyInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Tickets List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticketId={ticket.id}
            title={ticket.title}
            status={ticket.status}
            repliesUpdated={ticket.repliesUpdated}
            dateUpdated={ticket.dateUpdated}
            onStatusChange={(status) => handleStatusChange(ticket.id, status)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-white p-8 border-t border-[#E0E0E0]">
        <div className="relative">
          <input
            type="text"
            name="reply"
            placeholder="Add Reply"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            className=" bg-[#ECEDEE] rounded-xl w-full text-[13px] text-muted p-6 focus:border-gray-400 outline-none border border-muted/10"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSendReply}
              className="bg-[#FF6B35]"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
