/**
 * Staff Role Constants
 *
 * Single source of truth for the staff role vocabulary described in
 * FRONTEND_GUIDE_INTERNAL_USER_MANAGEMENT.md section 2.
 *
 * The wire value for an account officer is "OFFICER". "ACCOUNT_OFFICER" is
 * the PRD's name for the same role and is accepted by the API only as an
 * input alias on POST /admin/officers - it is stored and returned as
 * "OFFICER", and sending it to GET /admin/officers is a 400. So: normalise it
 * away on the way in, never send it on a list request, and render the label
 * from ROLE_LABELS rather than from the value itself.
 */

/** Every role the portal can receive from the API */
export type StaffRole =
  | "ADMIN"
  | "REGIONAL_ADMIN"
  | "OFFICER"
  | "LOADING_OFFICER"
  | "WAREHOUSE_OFFICER"
  | "STAFF";

/** The four roles an ADMIN creates, deactivates and reactivates */
export const MANAGED_ROLES = [
  "ADMIN",
  "REGIONAL_ADMIN",
  "OFFICER",
  "LOADING_OFFICER",
] as const;

export type ManagedRole = (typeof MANAGED_ROLES)[number];

/**
 * Roles that carry a region. An ADMIN is organisation-wide: sending a region
 * with one is a 400 REGION_NOT_ALLOWED, omitting it for any of these three is
 * a 400 REGION_REQUIRED.
 */
export const REGION_SCOPED_ROLES: ManagedRole[] = [
  "REGIONAL_ADMIN",
  "OFFICER",
  "LOADING_OFFICER",
];

/**
 * Display labels. Never derive a label from the enum value - "OFFICER" reads
 * as "Account Officer" to a user, and the two differ on purpose.
 */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  REGIONAL_ADMIN: "Regional Admin",
  OFFICER: "Account Officer",
  ACCOUNT_OFFICER: "Account Officer",
  LOADING_OFFICER: "Loading Officer",
  WAREHOUSE_OFFICER: "Warehouse Officer",
  STAFF: "Staff",
};

/**
 * Collapses the PRD spelling onto the wire value so a comparison only ever
 * has to consider one string. Anything unrecognised is passed through
 * untouched rather than coerced, so a role added server-side still renders.
 */
export const normalizeStaffRole = (role?: string | null): string => {
  const raw = typeof role === "string" ? role.trim().toUpperCase() : "";
  if (!raw) return "";
  return raw === "ACCOUNT_OFFICER" ? "OFFICER" : raw;
};

/** Human label for a role value, tolerant of nulls and unknown values */
export const formatRole = (role?: string | null, fallback = "N/A"): string => {
  const normalized = normalizeStaffRole(role);
  if (!normalized) return fallback;
  return (
    ROLE_LABELS[normalized] ??
    normalized
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  );
};

/** True for the account-officer role whichever spelling arrived */
export const isAccountOfficer = (role?: string | null): boolean =>
  normalizeStaffRole(role) === "OFFICER";

/** True for the four roles this portal creates and deactivates */
export const isManagedRole = (role?: string | null): boolean =>
  (MANAGED_ROLES as readonly string[]).includes(normalizeStaffRole(role));

/** True when the role must be scoped to a region */
export const roleRequiresRegion = (role?: string | null): boolean =>
  (REGION_SCOPED_ROLES as string[]).includes(normalizeStaffRole(role));

/** Options for the create-user role picker (section 5) */
export const CREATE_ROLE_OPTIONS: { value: ManagedRole; label: string }[] =
  MANAGED_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

/**
 * Options for the role filter on a list request. WAREHOUSE_OFFICER is absent
 * on purpose - it is still ERP-managed and not listed through this screen.
 */
export const ROLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Roles" },
  ...CREATE_ROLE_OPTIONS,
];

/** Status filter for GET /admin/officers?isActive= - "" means no filter */
export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Deactivated" },
];

/**
 * How a user's scope reads in a table cell.
 *
 * An ADMIN carries no region - the API returns null - and rendering that as
 * "Unknown" would look like missing data rather than the deliberate absence
 * it is.
 */
export const formatRoleScope = (
  role: string | null | undefined,
  regionLabel: string,
  adminLabel = "All Regions",
): string =>
  normalizeStaffRole(role) === "ADMIN" ? adminLabel : regionLabel;
