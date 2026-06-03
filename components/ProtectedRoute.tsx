"use client";

import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

const ProtectedRoute = ({
  children,
  redirectPath = "/auth/login",
}: ProtectedRouteProps) => {
  const { isLoading, isAuthenticated } = useProtectedRoute(redirectPath);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show content only if authenticated
  if (isAuthenticated) {
    return children;
  }

  // This will be handled by the useProtectedRoute hook redirect
  return null;
};

export default ProtectedRoute;
