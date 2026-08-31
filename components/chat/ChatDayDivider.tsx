"use client";

/**
 * The date banner that separates one day's messages from the next.
 *
 * Centred, low-contrast and non-interactive: it is a signpost inside the
 * transcript, not a message, so it must not read as one. Rendered as a real
 * <time> element so the full date stays available to a screen reader even
 * though the visible label is usually the relative "Today" / "Yesterday".
 */
export default function ChatDayDivider({
  label,
  dateTime,
}: {
  label: string;
  /** ISO timestamp of the first message in the run, for the accessible name */
  dateTime?: string;
}) {
  // An unparseable timestamp yields no label - better no divider than a wrong
  if (!label) return null;

  return (
    <div className="flex justify-center my-4" role="separator">
      <time
        dateTime={dateTime}
        className="rounded-full bg-[#F0F5F9] px-3 py-1 text-[11px] font-medium text-muted"
      >
        {label}
      </time>
    </div>
  );
}
