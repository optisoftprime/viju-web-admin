/**
 * Dashboard Hooks - React Query
 * Reusable hooks for dashboard operations
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  DashboardStats,
  OfficerCustomer,
  RegionalAdminDashboardResponse,
  PendingLoadingRequest,
  AdminDashboardStats,
} from "@/lib/api/types";

/**
 * Get Dashboard Stats based on user role
 */
export const useDashboardStats = () => {
  const { user } = useAuthStore();

  // Determine which dashboard to fetch based on role
  const getDashboardData = async (): Promise<DashboardStats> => {
    if (!user) throw new Error("User not found");

    switch (user.role) {
      case "ADMIN":
        return dashboardService.getAdminDashboard();
      case "OFFICER":
        return dashboardService.getOfficerDashboard();
      case "REGIONAL_ADMIN":
        // For regional admin, we need to know the region
        // This would typically come from user profile or URL params
        const response = await dashboardService.getRegionalDashboard("LAGOS");
        return response.summary;
      default:
        throw new Error(`Unknown role: ${user.role}`);
    }
  };

  return useQuery({
    queryKey: [queryKeys.all[0], "dashboard", user?.role],
    queryFn: getDashboardData,
    enabled: !!user, // Only run if user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get Dashboard Table Data based on user role
 * For OFFICER: returns customers list
 * For REGIONAL_ADMIN: returns pending loading requests
 */
export const useDashboardTableData = () => {
  const { user } = useAuthStore();

  const getTableData = async (): Promise<
    | OfficerCustomer[]
    | PendingLoadingRequest[]
    | AdminDashboardStats
    | RegionalAdminDashboardResponse
  > => {
    if (!user) throw new Error("User not found");

    switch (user.role) {
      case "OFFICER":
        return dashboardService.getOfficerCustomers();
      case "ADMIN":
        return dashboardService.getAdminDashboard();
      case "REGIONAL_ADMIN":
        return dashboardService.getRegionalDashboard("LAGOS");
      default:
        return [];
    }
  };

  return useQuery({
    queryKey: [queryKeys.all[0], "dashboardTable", user?.role],
    queryFn: getTableData,
    enabled:
      !!user && (user.role === "OFFICER" || user.role === "REGIONAL_ADMIN"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
