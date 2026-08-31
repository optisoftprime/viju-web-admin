/**
 * Chat timestamp formatting.
 *
 * The convention every messaging app uses, and the one the portal now follows:
 *
 *   - a message bubble carries only the clock       -> "9:38 AM", "10:35 PM"
 *   - the calendar day is stated once, on a divider -> "Today", "Yesterday",
 *     "October 18, 2025"
 *
 * Stating the day once per run of messages rather than on every bubble is what
 * makes a long transcript readable: the repetition carries no information, and
 * a bubble that reads "18/10/2025, 09:38:00" buries the one part that does.
 *
 * LOCALE NOTE: these format with "en-US" on purpose, unlike the rest of the
 * app, which uses "en-NG". en-NG renders lowercase meridiems and a
 * day-first date - "9:38 am" and "18 October 2025" - and the requested format
 * is "9:38 AM" and "October 18, 2025". The choice is about the shape of the
 * string, not about the user's locale, so it is pinned rather than left to the
 * browser.
 *
 * Every function reads the viewer's LOCAL calendar day. Two messages a minute
 * apart across midnight belong on different days, and a message sent at
 * 23:50 UTC is already "tomorrow" for a reader east of it - which is what the
 * viewer's own clock should decide.
 */

/** Parses an API timestamp, returning null for anything unusable */
const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && !value.trim()) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Local calendar day as YYYY-MM-DD - the key two messages are grouped by */
const dayKeyOf = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** True when both fall on the same local calendar day */
export const isSameCalendarDay = (a: Date, b: Date): boolean =>
  dayKeyOf(a) === dayKeyOf(b);

/**
 * Whole days between two local calendar dates, ignoring the time of day.
 * Computed from the date parts rather than by dividing milliseconds, so a
 * daylight-saving shift cannot turn "yesterday" into "2 days ago".
 */
const calendarDaysBetween = (from: Date, to: Date): number => {
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const startOfTo = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round(
    (startOfTo.getTime() - startOfFrom.getTime()) / (24 * 60 * 60 * 1000),
  );
};

/**
 * The clock on a message bubble: "9:38 AM", "10:35 PM".
 *
 * `hour: "numeric"` rather than "2-digit" - a leading zero on "09:38 AM" is
 * not how a phone renders it.
 */
export const formatMessageClock = (value: unknown, fallback = ""): string => {
  const date = toDate(value);
  if (!date) return fallback;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * The day divider between two runs of messages: "Today", "Yesterday", or the
 * full date once it is older than that - "October 18, 2025".
 *
 * `now` is injectable so the label can be tested without waiting for midnight.
 */
export const formatDayDivider = (
  value: unknown,
  now: Date = new Date(),
): string => {
  const date = toDate(value);
  if (!date) return "";

  const daysAgo = calendarDaysBetween(date, now);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * A run of consecutive messages that share one calendar day.
 * `label` is empty for messages whose timestamp could not be parsed - those
 * keep their place in the transcript but get no divider, since inventing a
 * date for them would be worse than omitting one.
 */
export interface ChatDayGroup<T> {
  key: string;
  label: string;
  messages: T[];
}

/**
 * Splits an already-ordered message list into day runs.
 *
 * Order is preserved exactly: a new group starts only where the calendar day
 * changes from one message to the next. Messages are NOT re-sorted - the API
 * returns them in order, and re-sorting here would hide a backend ordering bug
 * rather than surface it.
 */
export const groupMessagesByDay = <T>(
  messages: readonly T[],
  getTimestamp: (message: T) => unknown,
  now: Date = new Date(),
): ChatDayGroup<T>[] => {
  const groups: ChatDayGroup<T>[] = [];

  for (const message of messages) {
    const date = toDate(getTimestamp(message));
    const key = date ? dayKeyOf(date) : "undated";
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.messages.push(message);
      continue;
    }

    groups.push({
      key,
      label: date ? formatDayDivider(date, now) : "",
      messages: [message],
    });
  }

  return groups;
};

/**
 * How a CONVERSATION LIST row renders its timestamp: the clock for today, the
 * weekday inside the last week, then the date. Same rule messaging apps use,
 * and it keeps the column narrow.
 *
 * Distinct from `formatMessageClock`, which is for a bubble inside a thread
 * where the day is already established by a divider above it.
 */
export const formatChatTime = (
  value: string | null | undefined,
  now: Date = new Date(),
): string => {
  const date = toDate(value);
  if (!date) return "";

  const daysAgo = calendarDaysBetween(date, now);
  if (daysAgo === 0) return formatMessageClock(date);
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return date.toLocaleDateString("en-US", { weekday: "short" });

  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
};
