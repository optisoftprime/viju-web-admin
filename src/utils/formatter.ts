export const formatToNaira = (value: number | string): string => {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (isNaN(numberValue)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(numberValue);
};

/**
 * Human friendly age of a timestamp: "3hrs ago", "Yesterday", "2 days ago"
 * Falls back to an absolute date once it is over a month old
 */
export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Region enum to readable label: "SOUTH_SOUTH" -> "South South"
 */
/** The five values the live API is documented to return */
const KNOWN_REGIONS: Record<string, string> = {
  LAGOS: "Lagos",
  EASTERN: "Eastern",
  // The API enum cannot contain a hyphen, but this is shown to users as
  // "South-South" (backend handoff, section 1).
  SOUTH_SOUTH: "South-South",
  WESTERN: "Western",
  NORTH: "North",
};

/**
 * Render a region for display.
 *
 * ERP is currently returning empty and non-Latin values for some customers.
 * Rather than leaving a blank cell or printing raw ERP noise, fall back to an
 * explicit label so the row still reads correctly and the bad data is
 * obvious to whoever is reconciling it.
 */
export const formatRegion = (region?: string | null): string => {
  const raw = typeof region === "string" ? region.trim() : "";
  if (!raw) return "Unknown";

  const known = KNOWN_REGIONS[raw.toUpperCase()];
  if (known) return known;

  // Not one of the five - only echo it back if it is readable Latin text,
  // otherwise say so plainly instead of rendering mojibake.
  return /^[ -~]+$/.test(raw)
    ? raw
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    : "Unknown";
};

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${year}-${month}-${day} ${time}`;
};
