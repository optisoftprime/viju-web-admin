/**
 * Auth Initializer Provider
 * Initializes authentication from cookies on app load
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function AuthInitializer({ children }: { children: ReactNode }) {
  const { initializeAuth, isLoading, hasInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize auth from cookies on mount
    initializeAuth();
  }, [initializeAuth]);

  // Optionally show a loading state while initializing
  if (!hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Initializing...
      </div>
    );
  }

  return children;
}
