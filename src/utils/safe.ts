/**
 * Defensive accessors for API data.
 *
 * Every list endpoint in this app is paginated and every detail endpoint has
 * optional fields, so a response can legitimately arrive as null, as {}, as a
 * bare array, or with the envelope but no rows. These helpers give the UI one
 * predictable shape to render so a missing key can never throw.
 */

/** Anything that is not a usable value for display */
const isBlank = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "") ||
  (typeof value === "number" && Number.isNaN(value));

/**
 * Always returns an array.
 * Accepts the array itself, a { data: [...] } envelope, or anything else.
 */
export const safeArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as any).data)) {
    return (value as any).data as T[];
  }
  return [];
};

/** Display string with a fallback - never renders "null" or "undefined" */
export const safeText = (value: unknown, fallback = "N/A"): string => {
  if (isBlank(value)) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
};

/** Numeric value with a fallback - guards null, undefined, NaN and numeric strings */
export const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

/**
 * Pagination meta with every field present.
 * A response may omit meta entirely (bare array) or send a partial object.
 */
export interface SafeMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  /**
   * Only returned by GET /admin/customers?includeUnprojected=true. Left
   * undefined otherwise, so callers must branch on the value rather than on
   * the key being present - environments with no ERP feed report 0.
   */
  projectedTotal?: number;
  unprojectedTotal?: number;
}

export const safeMeta = (value: unknown, rowCount = 0): SafeMeta => {
  const meta = (value && typeof value === "object" ? (value as any) : {}) as Record<
    string,
    unknown
  >;
  const total = safeNumber(meta.total, rowCount);
  const page = Math.max(1, safeNumber(meta.page, 1));
  const pageSize = Math.max(1, safeNumber(meta.pageSize, rowCount || 20));

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, safeNumber(meta.totalPages, Math.ceil(total / pageSize) || 1)),
    hasNextPage: Boolean(meta.hasNextPage),
    hasPreviousPage: Boolean(meta.hasPreviousPage),
    // Passed through only when the API actually sent them
    ...(meta.projectedTotal !== undefined
      ? { projectedTotal: safeNumber(meta.projectedTotal, 0) }
      : {}),
    ...(meta.unprojectedTotal !== undefined
      ? { unprojectedTotal: safeNumber(meta.unprojectedTotal, 0) }
      : {}),
  };
};

/** Unwraps a paginated response into rows + guaranteed meta */
export const safeList = <T>(response: unknown): { data: T[]; meta: SafeMeta } => {
  const data = safeArray<T>(response);
  const meta = safeMeta(
    response && typeof response === "object" ? (response as any).meta : undefined,
    data.length,
  );
  return { data, meta };
};

/**
 * Parses an API date defensively. The backend promises full ISO-8601 UTC, but
 * a null, an empty string or a date-only value must not produce "Invalid Date".
 */
export const safeDate = (value: unknown): Date | null => {
  if (isBlank(value)) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Formats an API date for display, falling back rather than throwing */
export const safeDateText = (value: unknown, fallback = "N/A"): string => {
  const date = safeDate(value);
  if (!date) return fallback;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Turns an UPPER_SNAKE enum into a readable label without assuming the value
 * is one the frontend knows about - unknown values still render sensibly.
 */
export const humanizeEnum = (value: unknown, fallback = "N/A"): string => {
  const raw = safeText(value, "");
  if (!raw) return fallback;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/** Picks the first non-blank value - useful when a field was renamed server-side */
export const firstOf = (...values: unknown[]): unknown =>
  values.find((value) => !isBlank(value));
