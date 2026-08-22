/**
 * Who sent a ticket reply or a chat message.
 *
 * `senderType` only distinguishes "STAFF" from "CUSTOMER", so a staff reply
 * used to render as a flat "Staff" - an admin and a regional admin answering a
 * ticket looked identical to the account officer who owns it.
 *
 * S-1 fixed that at the source: every staff-authored row now carries
 * `staff: { id, name, role }`, on the live ticket and chat routes and on both
 * audit routes. That is the only source that is right for a sender who is
 * neither the reader nor the assigned officer, so it always wins.
 *
 * The remaining rules are defence, for a row that predates the field or a
 * shape this build has not seen:
 *
 *   1. `staffRole` on the message - the authoritative answer.
 *   2. The signed-in reader, when the message carries their own `staffId`.
 *   3. The customer's assigned account officer, when the thread names one and
 *      the ids match.
 *
 * With none of those, the staff member's name is used if the payload carries
 * it, and only then a neutral fallback - never a role that was guessed.
 *
 * ## `staffId` is not the author
 *
 * On a chat row written by a distributor, `staffId` is the officer the message
 * was routed TO. Rules 2 and 3 are keyed on it, so they run only for a row
 * that is already known to be staff-authored - a customer row returns its own
 * name long before they are reached.
 */

import { formatRole, normalizeStaffRole } from "@/constants/roles";
import { safeText } from "@/utils/safe";

/** Shown when a staff sender cannot be identified at all */
export const UNKNOWN_STAFF_LABEL = "Support Team";

export interface SenderContext {
  /** "STAFF" | "CUSTOMER" - anything else is treated as a customer */
  senderType?: string | null;
  /** The staff record that sent it, when the message names one */
  staffId?: string | null;
  /** Role from the message's own `staff` block. Authoritative (S-1). */
  staffRole?: string | null;
  /** Name from the message's own `staff` block */
  staffName?: string | null;
  /** The signed-in reader, so their own messages name their own role */
  viewer?: { id?: string | null; role?: string | null } | null;
  /** The customer's primary account officer, when the thread names one */
  assignedOfficerId?: string | null;
  /** Name for the other side of the conversation */
  customerName?: string | null;
}

/** True for a message written by a member of staff rather than the customer */
export const isStaffSender = (senderType?: string | null): boolean =>
  safeText(senderType, "").toUpperCase() === "STAFF";

/**
 * The label to print on a message or chat card, e.g. "Admin",
 * "Regional Admin", "Account Officer", or the customer's own name.
 */
export const resolveSenderLabel = (context: SenderContext): string => {
  if (!isStaffSender(context.senderType)) {
    return safeText(context.customerName, "Customer");
  }

  // 1. The role the API stated. Always wins - it is the only source that is
  //    right for a sender who is neither the reader nor the assigned officer.
  const statedRole = normalizeStaffRole(context.staffRole);
  if (statedRole) return formatRole(statedRole, UNKNOWN_STAFF_LABEL);

  const staffId = safeText(context.staffId, "");

  // 2. The reader's own message - an admin sees "Admin" on what they wrote
  const viewerId = safeText(context.viewer?.id, "");
  const viewerRole = normalizeStaffRole(context.viewer?.role);
  if (staffId && viewerId && staffId === viewerId && viewerRole) {
    return formatRole(viewerRole, UNKNOWN_STAFF_LABEL);
  }

  // 3. The customer's own account officer, when the thread identifies them
  const assignedOfficerId = safeText(context.assignedOfficerId, "");
  if (staffId && assignedOfficerId && staffId === assignedOfficerId) {
    return formatRole("OFFICER", UNKNOWN_STAFF_LABEL);
  }

  // A name is more use than a guessed role
  const staffName = safeText(context.staffName, "");
  return staffName || UNKNOWN_STAFF_LABEL;
};
