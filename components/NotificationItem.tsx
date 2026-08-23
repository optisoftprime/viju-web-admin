"use client";

import {
  ArrowRight,
  Bell,
  MessageSquare,
  Megaphone,
  Truck,
  UserPlus,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import { Text } from "@/components/common";
import { safeText } from "@/utils/safe";

interface NotificationItemProps {
  id: string;
  title: string;
  timestamp: string;
  isRead: boolean;
  /** Live API `type`. Unknown values fall back to a default icon. */
  type?: string;
  isActionable?: boolean;
  onClick?: () => void;
}

/**
 * The live enum is a CLOSED but LARGER set than the original spec (10 values),
 * and the backend may add more. Always fall through to a default rather than
 * rendering nothing for a type this build has not seen.
 */
const ICONS: Record<string, LucideIcon> = {
  CHAT_MESSAGE: MessageSquare,
  TICKET_CREATED: TicketCheck,
  TICKET_REPLY: TicketCheck,
  TICKET_STATUS: TicketCheck,
  ASSIGNMENT: UserPlus,
  WAYBILL_SUBMITTED: Truck,
  WAYBILL_ASSIGNED: Truck,
  WAYBILL_STATUS_CHANGED: Truck,
  WAYBILL_COMPLETED: Truck,
  BROADCAST: Megaphone,
};

/**
 * `content` normally arrives as "<title>: <body>" - e.g.
 * "Customer assigned: Ade Foods Ltd has been assigned to you" - so it is split
 * on the FIRST ": " only, leaving a body that contains a colon intact.
 *
 * Two cases must NOT be split:
 *
 *   - **BROADCAST.** The text is the admin's own words, sent verbatim with no
 *     prefix (P-3), so there is no title to find. Splitting one that happens
 *     to contain a colon - "Note: depot closed" - would tear the message in
 *     half and present "Note" as a heading the admin never wrote. An
 *     individual broadcast's "<distributor name>: " prefix is likewise part of
 *     the message, not a title.
 *   - **Anything with no ": " at all.** That is a bare body, not a bare title:
 *     rendering it as a heading with nothing under it reads as a truncated row.
 */
const splitContent = (
  raw: string,
  type: string,
): { title: string | null; body: string } => {
  if (type === "BROADCAST") return { title: null, body: raw };

  const separator = raw.indexOf(": ");
  if (separator <= 0) return { title: null, body: raw };

  return {
    title: raw.slice(0, separator).trim(),
    body: raw.slice(separator + 2).trim(),
  };
};

export default function NotificationItem({
  id,
  title,
  timestamp,
  isRead,
  type,
  isActionable = false,
  onClick,
}: NotificationItemProps) {
  const raw = safeText(title, "New notification");
  const normalizedType = safeText(type, "").toUpperCase();
  const { title: heading, body } = splitContent(raw, normalizedType);

  // Unknown or missing type -> generic bell
  const Icon = ICONS[normalizedType] ?? Bell;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-muted/20 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isRead ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        {!isRead && (
          <div className="w-2 h-2 rounded-full bg-statusblue mt-2 shrink-0" />
        )}

        <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" strokeWidth={2} />

        {/* Content. With no title the body carries the weight the heading
            would have had, so a broadcast does not read as an orphaned
            subtitle. */}
        <div className="flex-1 min-w-0">
          {heading && (
            <Text variant="small" weight="medium" className="mb-1">
              {heading}
            </Text>
          )}
          {body && (
            <Text
              variant={heading ? "caption" : "small"}
              weight={heading ? "normal" : "medium"}
              color="foreground"
              className="mb-1 block"
            >
              {body}
            </Text>
          )}
          <Text variant="caption" color="muted">
            {timestamp}
          </Text>
        </div>

        {/* Actionable Arrow */}
        {isActionable && (
          <div className="shrink-0">
            <ArrowRight className="w-4 h-4 text-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
