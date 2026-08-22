/**
 * Read a URL query parameter on the client.
 *
 * Deliberately not `useSearchParams`: every screen that needs this is already
 * a client component behind ProtectedRoute, and pulling in the Next hook forces
 * the whole route under a Suspense boundary or bails it out of prerendering.
 *
 * `useSyncExternalStore` gives the same value without changing how the route
 * builds, and lets the server snapshot be an explicit `null` - which is what
 * "no preselection" means, and what every caller already defaults to.
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";

/** History navigation is the only thing that can change the query in place */
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
};

/** No location during prerender, so there is nothing to preselect from */
const getServerSnapshot = (): string | null => null;

export const useQueryParam = (name: string): string | null => {
  const getSnapshot = useCallback(
    () => new URLSearchParams(window.location.search).get(name),
    [name],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
