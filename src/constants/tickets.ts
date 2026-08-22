/**
 * Support Ticket Constants
 *
 * Single source of truth for the ticket status vocabulary. The API stores and
 * returns these UPPER_SNAKE values; every label a user sees comes from here so
 * a screen never derives one from the enum itself.
 */

export interface TicketStatusOption {
  value: string;
  label: string;
}

export const TICKET_STATUS_OPTIONS: TicketStatusOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_CUSTOMER", label: "Awaiting Customer" },
  { value: "RESOLVED", label: "Resolved" },
];

/**
 * Statuses that count as "still needs attention".
 *
 * Sent as `?status=` on GET /admin/audit/tickets, which filters server-side
 * and counts the filtered set in `meta.total` - so the regional Open Tickets
 * screen never has to narrow a page in the browser.
 */
export const UNRESOLVED_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_CUSTOMER",
] as const;

/**
 * True while a ticket still needs attention.
 *
 * Used where a list has already been fetched for another purpose and one open
 * ticket has to be picked out of it - the officer dashboard's Open Tickets
 * tile, which jumps straight to the customer that owns one. A list that can be
 * filtered at the API sends `status` instead.
 *
 * An unrecognised status counts as open: hiding a ticket the frontend does not
 * know about is worse than showing one that turns out to be closed.
 */
export const isUnresolvedTicket = (status?: string | null): boolean => {
  const raw = typeof status === "string" ? status.trim().toUpperCase() : "";
  if (!raw) return true;
  return raw !== "RESOLVED" && raw !== "CLOSED";
};

/** Human label for a ticket status, tolerant of nulls and unknown values */
export const formatTicketStatus = (status?: string | null): string => {
  const raw = typeof status === "string" ? status.trim().toUpperCase() : "";
  if (!raw) return "Open";
  return (
    TICKET_STATUS_OPTIONS.find((option) => option.value === raw)?.label ??
    raw
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  );
};
