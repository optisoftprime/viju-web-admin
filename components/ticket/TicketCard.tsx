"use client";

import { Text } from "@/components/common";
import {
  TICKET_STATUS_OPTIONS,
  formatTicketStatus,
} from "@/constants/tickets";

interface TicketCardProps {
  ticketId: string;
  title: string;
  status?: string;
  repliesUpdated?: number;
  dateUpdated?: string;
  onStatusChange?: (status: string) => void;
  onSelect?: () => void;
  isUpdatingStatus?: boolean;
}

// Vocabulary lives in @/constants/tickets so the card, the detail modal and
// the regional Open Tickets screen can never drift apart
const statusOptions = TICKET_STATUS_OPTIONS;

export default function TicketCard({
  ticketId,
  title,
  status = "OPEN",
  repliesUpdated = 0,
  dateUpdated = "",
  onStatusChange,
  onSelect,
  isUpdatingStatus = false,
}: TicketCardProps) {
  return (
    <div
      className="bg-[#F5F5F5] p-6 rounded-lg space-y-3 my-3 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between w-full gap-4">
        <Text variant="small" weight="bold" color="foreground">
          {ticketId}
        </Text>
        <div className="" onClick={(event) => event.stopPropagation()}>
          <label className="sr-only" htmlFor={`ticket-status-${ticketId}`}>
            Status
          </label>
          <select
            id={`ticket-status-${ticketId}`}
            value={status}
            onChange={(event) => onStatusChange?.(event.target.value)}
            disabled={isUpdatingStatus}
            className="w-full rounded-lg border border-[#D3D5D8] bg-white px-3 py-2 text-[12px] text-muted"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Text variant="caption" weight="medium" color="foreground">
        {title}
      </Text>

      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2 items-center">
          <span className="flex items-center justify-center text-[12px] text-[#3F79FA] font-bold px-2 py-1 rounded-md bg-[#D3E0FF]">
            {formatTicketStatus(status)}
          </span>
          <span className="flex items-center justify-center text-[12px] text-[#7F8DA1] font-bold px-2 py-1 rounded-md bg-[#DFE1E3]">
            {repliesUpdated} replies updated
          </span>
        </div>
        <Text variant="caption" weight="medium" color="muted">
          {dateUpdated}
        </Text>
      </div>
    </div>
  );
}
