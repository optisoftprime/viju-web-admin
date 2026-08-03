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
