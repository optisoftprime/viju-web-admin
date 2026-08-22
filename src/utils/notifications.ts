/**
 * Notification scoping.
 *
 * A notification belongs to ONE person. An account officer chatting with a
 * customer is the only one who should be told about it; a loading request
 * raised in a region concerns that region's regional admin and nobody else;
 * an assignment concerns the officer it was assigned to.
 *
 * Which staff rows a notification is written for is decided when the row is
 * created, and N-1..N-4 settled that at the source: a CHAT_MESSAGE row goes to
 * exactly one staff member, WAYBILL_SUBMITTED only to active regional admins
 * of the request's own region, WAYBILL_ASSIGNED to the assigned loading
 * officer, ASSIGNMENT to the incoming officer alone. `staffId` is always the
 * recipient, never the sender.
 *
 * So this file should now never remove anything. It is kept as a
 * belt-and-braces guard against a future fan-out regression - and because a
 * wrong bell is worse than a missing one:
 *
 *   1. **Addressee** - a row that names a `staffId` other than the signed-in
 *      user's is not theirs. A row that names no staff at all but does name a
 *      customer belongs to that customer's own feed, not to staff.
 *   2. **Role relevance** - a type that can only concern one role is hidden
 *      from the others. An unknown type is always shown: the enum is closed
 *      but grows, and silently swallowing a new one is worse than showing it.
 */

import { normalizeStaffRole } from "@/constants/roles";
import { safeText } from "@/utils/safe";
import type { AppNotification, User } from "@/lib/api/types";

/**
 * Roles each notification type is meant for.
 *
 * Every entry now matches the backend's own audience (see the quick-reference
 * table in documents/FRONTEND_GUIDE_SENDER_ROLE_AND_NOTIFICATIONS.md), so this
 * map agrees with the fan-out rather than second-guessing it.
 *
 * A type absent from the map is shown to everyone - that is the deliberate
 * default for values this build has not seen yet.
 */
export const NOTIFICATION_AUDIENCE: Record<string, string[]> = {
  // A conversation belongs to the two people in it. Every staff role can hold
  // one, so the role cannot narrow this - the row is addressed to the single
  // staff member the conversation belongs to, which is what scopes it.
  CHAT_MESSAGE: ["OFFICER", "ADMIN", "REGIONAL_ADMIN"],
  TICKET_CREATED: ["OFFICER", "ADMIN", "REGIONAL_ADMIN"],
  TICKET_REPLY: ["OFFICER", "ADMIN", "REGIONAL_ADMIN"],
  TICKET_STATUS: ["OFFICER", "ADMIN", "REGIONAL_ADMIN"],

  // "[Customer] has been assigned to you" - the INCOMING officer only. The
  // outgoing officer is not notified at all, so there is no second type here.
  ASSIGNMENT: ["OFFICER"],

  // A new loading request reaches the ACTIVE regional admins of that region
  // only - never an organisation-wide admin, never an account officer. If
  // loading activity should reach an admin it will be a separate type.
  WAYBILL_SUBMITTED: ["REGIONAL_ADMIN"],

  // The load was assigned - the loading officer who has to do it
  WAYBILL_ASSIGNED: ["LOADING_OFFICER", "WAREHOUSE_OFFICER"],

  // Progress on a load flows back to the regional admin who assigned it
  WAYBILL_STATUS_CHANGED: ["REGIONAL_ADMIN", "LOADING_OFFICER", "WAREHOUSE_OFFICER"],
  WAYBILL_COMPLETED: ["REGIONAL_ADMIN", "LOADING_OFFICER", "WAREHOUSE_OFFICER"],

  // Sent to everyone on purpose
  BROADCAST: ["OFFICER", "ADMIN", "REGIONAL_ADMIN", "LOADING_OFFICER", "WAREHOUSE_OFFICER", "STAFF"],
};

/**
 * True when this notification was written for the signed-in user.
 *
 * Written permissively on purpose: with no signed-in user, or a row that names
 * neither a staff member nor a customer, nothing is hidden. The guard only
 * removes a row it can positively show belongs to someone else.
 */
export const isNotificationForViewer = (
  notification: AppNotification | null | undefined,
  user: User | null | undefined,
): boolean => {
  if (!notification) return false;
  if (!user) return true;

  const viewerId = safeText(user.id, "");
  const notificationStaffId = safeText(notification.staffId, "");
  const notificationCustomerId = safeText(notification.customerId, "");

  // 1. Addressed to another member of staff
  if (notificationStaffId && viewerId && notificationStaffId !== viewerId) {
    return false;
  }

  // A row addressed to a customer and to no staff member is that customer's
  // own feed - it reaches the mobile app, not this bell.
  if (!notificationStaffId && notificationCustomerId) return false;

  // 2. A type that cannot concern this role
  const audience = NOTIFICATION_AUDIENCE[safeText(notification.type, "").toUpperCase()];
  if (!audience) return true; // unknown type - show it rather than swallow it

  const role = normalizeStaffRole(user.role);
  if (!role) return true;

  return audience.includes(role);
};

/** Every notification in the list that belongs to the signed-in user */
export const scopeNotifications = (
  notifications: AppNotification[] | null | undefined,
  user: User | null | undefined,
): AppNotification[] =>
  (Array.isArray(notifications) ? notifications : []).filter((notification) =>
    isNotificationForViewer(notification, user),
  );
