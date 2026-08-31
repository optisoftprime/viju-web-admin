"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { normalizeStaffRole, type StaffRole } from "@/constants/roles";

interface RoleProtectedRouteProps {
  children: ReactNode;
  /**
   * Roles allowed on this page. Written as the WIRE values - "OFFICER", not
   * "ACCOUNT_OFFICER" - though `normalizeStaffRole` collapses the alias either
   * way so a caller cannot get it subtly wrong.
   */
  allow: (StaffRole | string)[];
  redirectPath?: string;
}

/**
 * Spec 44: authentication is not authorisation.
 *
 * `ProtectedRoute` only asks "is anyone signed in". Every role-scoped page in
 * this portal was relying on the sidebar simply not linking there - which is a
 * navigation convenience, not a control. An account officer who typed
 * `/admin/users` reached the screen; the API refused the data, so they saw an
 * error state rather than a table, but they were on a page that was never
 * theirs and the failure looked like a bug rather than a boundary.
 *
 * The spec asks for the strong response: **sign them out and return them to
 * login.** That is deliberately harsher than redirecting to their own
 * dashboard, and it is the right default here - a session reaching a page its
 * role cannot hold is either a stale token after a role change, or someone
 * probing. Both are best answered by making them authenticate again.
 *
 * The API remains the real control. This closes the gap between "the server
 * will refuse you" and "you should not be here at all".
 */
export default function RoleProtectedRoute({
  children,
  allow,
  redirectPath = "/auth/login",
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useProtectedRoute(redirectPath);
  const { user, logout } = useAuthStore();

  /**
   * The sign-out must happen once. Without this the effect re-runs on the
   * re-render `logout()` causes and fires a second toast, and in development's
   * double-invoked effects it fires twice on the first pass alone.
   */
  const hasEjected = useRef(false);

  const role = normalizeStaffRole(user?.role);
  const allowed = allow.map((value) => normalizeStaffRole(value));

  /**
   * Only eject on a role we can positively read and positively reject.
   *
   * A session that is still loading, or one whose record carries no role yet,
   * is NOT ejected - a missing role is an unfinished session, not a wrong one,
   * and signing someone out over a race would be its own bug.
   */
  const isWrongRole =
    !isLoading && isAuthenticated && Boolean(role) && !allowed.includes(role);

  useEffect(() => {
    if (!isWrongRole || hasEjected.current) return;

    hasEjected.current = true;
    toast.error("You do not have access to that page. Please sign in again.");
    logout();
    router.replace(redirectPath);
  }, [isWrongRole, logout, router, redirectPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  /**
   * Render nothing while the redirect is in flight. Returning the children
   * here would paint the page for a frame - which is exactly what this
   * component exists to prevent, and on a page showing another role's data
   * that frame is the whole problem.
   */
  if (!isAuthenticated || isWrongRole) return null;

  return <>{children}</>;
}
