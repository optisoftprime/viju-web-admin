"use client";

import { Text } from "@/components/common";
import { safeText } from "@/utils/safe";

export interface ChatThreadSummary {
  /** Customer id - the `otherUserId` the thread is fetched with */
  id: string;
  name: string;
  /** ERP account code - the fallback line, and how two same-named accounts differ */
  accountNumber: string;
  /** Most recent message either side; null on a thread with no messages */
  lastMessageAt: string | null;
  /** Messages the DISTRIBUTOR sent that are still unread */
  unreadMessages: number;
  /**
   * CH-1: the newest message on the thread, either side. Already collapsed to
   * one line and truncated at 120 characters server-side; an attachment-only
   * message arrives as its own label rather than an empty string. Null on an
   * empty thread, in which case the row falls back to the account code.
   */
  lastMessagePreview?: string | null;
  /**
   * CH-1: who wrote it, so the officer's own last word reads as "You: ".
   *
   * NOTE "STAFF" means ANY staff member - an admin or regional admin replying
   * through the Interaction Audit writes a STAFF message too - so "You: " is
   * the messaging-app convention here rather than a claim of authorship. The
   * backend can add the author's id if that ever matters.
   */
  lastMessageSenderType?: "CUSTOMER" | "STAFF" | null;
  /**
   * CH-2: the customer's own profile photo, set by them in the distributor
   * app. Null for most customers - `initialsOf` is the permanent fallback for
   * those, not a placeholder waiting to be replaced.
   */
  avatarUrl?: string | null;
}

interface ChatListItemProps {
  thread: ChatThreadSummary;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * How a conversation list renders a timestamp: the clock for today, the
 * weekday inside the last week, then the date. Same rule messaging apps use,
 * and it keeps the column narrow.
 */
export const formatChatTime = (value: string | null): string => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const withinAWeek = now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (withinAWeek) {
    return date.toLocaleDateString("en-NG", { weekday: "short" });
  }

  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
};

/** First letters of the first two words, e.g. "Ade Foods Ltd" -> "AF" */
const initialsOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

/**
 * One conversation in the list.
 *
 * Laid out the way a messaging app does it - avatar, name, message preview,
 * then time and unread count stacked on the right - because that is the shape
 * an officer already knows how to read.
 */
export default function ChatListItem({
  thread,
  isSelected,
  onClick,
}: ChatListItemProps) {
  const name = safeText(thread.name, "Unknown customer");
  const hasUnread = thread.unreadMessages > 0;

  /**
   * The secondary line: the message itself, prefixed with "You: " when the
   * last word was staff's - the convention every messaging list uses to show
   * you are waiting on a reply rather than owing one.
   *
   * The account code remains the fallback for a thread the API has no preview
   * for. It is not a message, but it IS what tells two similarly-named
   * distributors apart, and showing something true beats inventing text.
   */
  const previewText = thread.lastMessagePreview?.trim();
  const preview = previewText
    ? thread.lastMessageSenderType === "STAFF"
      ? `You: ${previewText}`
      : previewText
    : safeText(thread.accountNumber, "No messages yet");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isSelected}
      className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-muted/15 transition-colors ${
        isSelected ? "bg-primary/10" : "hover:bg-muted/5"
      }`}
    >
      {/* Avatar - the customer's own photo, initials when they have not set one */}
      {thread.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thread.avatarUrl}
          alt=""
          className="w-11 h-11 rounded-full object-cover shrink-0"
        />
      ) : (
        <span
          aria-hidden="true"
          className="w-11 h-11 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold"
        >
          {initialsOf(name)}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <Text
            variant="caption"
            weight={hasUnread ? "bold" : "semibold"}
            color="foreground"
            className="truncate"
          >
            {name}
          </Text>
          <Text
            variant="thinnote"
            color={hasUnread ? "primary" : "muted"}
            className="shrink-0"
          >
            {formatChatTime(thread.lastMessageAt)}
          </Text>
        </span>

        <span className="flex items-center justify-between gap-2 mt-0.5">
          <Text
            variant="thinnote"
            color="muted"
            weight={hasUnread ? "medium" : "normal"}
            className="truncate"
          >
            {preview}
          </Text>

          {/* Unread count, capped the way messaging apps cap it */}
          {hasUnread && (
            <span
              aria-label={`${thread.unreadMessages} unread messages`}
              className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center"
            >
              {thread.unreadMessages > 99 ? "99+" : thread.unreadMessages}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
