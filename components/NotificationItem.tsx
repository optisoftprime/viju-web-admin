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
 * `content` now arrives as "<title>: <body>" - e.g.
 * "Customer assigned: Ade Foods Ltd has been assigned to you".
 * Split on the FIRST ": " only, so a body containing a colon stays intact.
 */
const splitContent = (raw: string): { heading: string; body: string } => {
  const separator = raw.indexOf(": ");
  if (separator <= 0) return { heading: raw, body: "" };

  return {
    heading: raw.slice(0, separator).trim(),
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
  const { heading, body } = splitContent(raw);

  // Unknown or missing type -> generic bell
  const Icon = ICONS[safeText(type, "").toUpperCase()] ?? Bell;

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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Text variant="small" weight="medium" className="mb-1">
            {heading}
          </Text>
          {body && (
            <Text variant="caption" color="foreground" className="mb-1 block">
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
