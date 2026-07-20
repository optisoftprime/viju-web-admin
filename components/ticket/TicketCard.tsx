"use client";

import { Text } from "@/components/common";

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

const statusOptions = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Awaiting Customer", value: "AWAITING_CUSTOMER" },
  { label: "Resolved", value: "RESOLVED" },
];

const getStatusLabel = (status: string) => {
  const option = statusOptions.find((item) => item.value === status);
  return option?.label ?? status;
};

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
            {getStatusLabel(status)}
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
