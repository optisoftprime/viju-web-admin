/**
 * Auth Initializer Provider
 * Initializes authentication from cookies on app load
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useCurrentUser } from "@/hooks/api/useAuth";
import RealtimeSubscriber from "@/hooks/useRealtime";

export default function AuthInitializer({ children }: { children: ReactNode }) {
  const { initializeAuth, isLoading, hasInitialized, syncUser } = useAuthStore();

  useEffect(() => {
    // Initialize auth from cookies on mount
    initializeAuth();
  }, [initializeAuth]);

  /**
   * RA-03 - GET /users/me now carries `region`, the region this user's data is
   * scoped to. Older cookies were written before that field existed, so hydrate
   * the store from the API once the session is up. A failure here is harmless:
   * the app keeps the cookie copy and simply has no region to display.
   *
   * Spec 43 - `profilePhotoUrl` is hydrated here too, and that is what makes a
   * picture SURVIVE A LOGOUT.
   *
   * The bug it fixes: uploading wrote the URL into the session and its cookie,
   * so the avatar appeared and survived a refresh - but logging out clears the
   * cookie, and the login response does not carry a photo. This effect was the
   * one place that could restore it from the server, and its field list simply
   * did not mention it. The picture was never lost server-side; it was being
   * dropped on the way back in.
   */
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (!currentUser?.id) return;

    syncUser({
      name: currentUser.name,
      role: currentUser.role,
      email: currentUser.email ?? undefined,
      // null means org-wide ADMIN - store as undefined so `user.region` stays falsy
      region: currentUser.region ?? undefined,
      // null means "no picture set" - undefined keeps `user.profilePhotoUrl`
      // falsy so the initials fallback renders
      profilePhotoUrl: currentUser.profilePhotoUrl ?? undefined,
    });
  }, [currentUser, syncUser]);

  // Optionally show a loading state while initializing
  if (!hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Initializing...
      </div>
    );
  }

  return (
    <>
      {/* AO-10 - one SSE subscription for the whole app shell */}
      <RealtimeSubscriber />
      {children}
    </>
  );
}
