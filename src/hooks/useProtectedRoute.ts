/**
 * Protected Route Hook
 * Hook to protect routes that require authentication
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export const useProtectedRoute = (redirectPath: string = "/auth/login") => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth store to initialize
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router, redirectPath]);

  return { isLoading, isAuthenticated };
};
