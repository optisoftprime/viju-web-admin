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
 * Region enum to readable label: "SOUTH_WEST" -> "South West"
 */
export const formatRegion = (region: string): string =>
  region
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

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
