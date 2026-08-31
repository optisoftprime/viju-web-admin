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
 * Spec 40: the roles a REGIONAL_ADMIN may create, edit and deactivate.
 *
 * Deliberately NOT ADMIN or REGIONAL_ADMIN. A regional admin who could mint
 * another regional admin - or an organisation-wide admin - would be able to
 * grant themselves scope they do not have, so those two stay with the ADMIN.
 * The API is the real control; this list is what the UI offers.
 */
export const REGIONAL_ADMIN_MANAGED_ROLES = [
  "OFFICER",
  "LOADING_OFFICER",
] as const;

/**
 * BA-2: who may bulk-assign customers to an officer
 * (`PATCH /admin/customers/bulk-reassign`).
 *
 * Spec 43 asked for a REGIONAL_ADMIN and the backend agreed: moving customers
 * between officers INSIDE a region is squarely their job and gives nothing
 * away. The route scopes them on both sides - every customer must be in their
 * region, and so must the receiving officer.
 */
export const canBulkAssignCustomers = (role?: string | null): boolean => {
  const normalized = normalizeStaffRole(role);
  return normalized === "ADMIN" || normalized === "REGIONAL_ADMIN";
};

/**
 * BA-1: who may bulk-move officers between regions
 * (`PATCH /admin/officers/bulk-region`).
 *
 * **Spec 44 re-asks for a REGIONAL_ADMIN, so they have it here again.** This
 * has now been through a full round trip and the history matters, because the
 * control and the API currently disagree:
 *
 *   - Spec 40 reserved the route to an ADMIN, on the backend's instruction.
 *   - Spec 43 asked for a regional admin; we built it and flagged the clash.
 *   - The backend REFUSED (BA-1) and agreed with the objection: "source-scoped"
 *     lets a regional admin empty their own region into one whose admin never
 *     agreed to receive the staff, and "confined to my own region" is a no-op.
 *     There is no third reading.
 *   - Spec 44 asks again. That is the client's call to make, so the control is
 *     on - but **the API still refuses it**, so it will 403 for that role
 *     until BA-1 is reopened and answered differently.
 *
 * The objection has not gone away and is not ours to overrule: two officers
 * are already stranded outside their customers' region, created ONE AT A TIME
 * through the single-officer edit. This route would allow 500 at a time.
 *
 * Still ADMIN-only, and still not wired to any UI:
 *   DELETE /admin/officers/{id}
 *   PATCH  /admin/officers/{id}/reassign-customers
 */
export const canBulkReassignOfficerRegion = (role?: string | null): boolean => {
  const normalized = normalizeStaffRole(role);
  return normalized === "ADMIN" || normalized === "REGIONAL_ADMIN";
};

/** The roles the signed-in staff member is allowed to manage */
export const managedRolesForRole = (
  role?: string | null,
): readonly ManagedRole[] =>
  normalizeStaffRole(role) === "REGIONAL_ADMIN"
    ? REGIONAL_ADMIN_MANAGED_ROLES
    : MANAGED_ROLES;

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

/**
 * Spec 40: the role filter a given staff member should see. A regional admin
 * is offered only the two roles they manage - filtering by ADMIN would be a
 * list they are not entitled to and, once the API scopes them, an empty one.
 */
export const roleFilterOptionsForRole = (
  role?: string | null,
): { value: string; label: string }[] => [
  { value: "", label: "All Roles" },
  ...managedRolesForRole(role).map((managed) => ({
    value: managed,
    label: ROLE_LABELS[managed],
  })),
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
