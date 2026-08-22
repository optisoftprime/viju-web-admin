/**
 * Dashboard Hooks - React Query
 * Reusable hooks for dashboard operations
 */

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import { normalizeStaffRole } from "@/constants/roles";
import { queryKeys } from "@/lib/api/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import {
  DashboardStats,
  OfficerCustomer,
  OfficerCustomersParams,
  RegionalAdminDashboardResponse,
  PendingLoadingRequest,
  AdminDashboardStats,
  OfficerCustomerFilter,
} from "@/lib/api/types";

/**
 * Get Dashboard Stats based on user role
 */
export const useDashboardStats = () => {
  const { user } = useAuthStore();

  // Determine which dashboard to fetch based on role
  const getDashboardData = async (): Promise<DashboardStats> => {
    if (!user) throw new Error("User not found");

    // "ACCOUNT_OFFICER" and "OFFICER" name the same role - the API returns
    // the latter, but normalising costs nothing and cannot misroute.
    switch (normalizeStaffRole(user.role)) {
      case "ADMIN":
        return dashboardService.getAdminDashboard();
      case "OFFICER":
        return dashboardService.getOfficerDashboard();
      case "REGIONAL_ADMIN": {
        // RA-03 - the server scopes by the token. Never send a region as a
        // regional admin; passing one returns 403.
        const response = await dashboardService.getRegionalDashboard();
        return response?.summary ?? {};
      }
      default:
        throw new Error(`Unknown role: ${user.role}`);
    }
  };

  return useQuery({
    queryKey: [queryKeys.all[0], "dashboard", normalizeStaffRole(user?.role)],
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
interface DashboardTableParams {
  search?: string;
  /** OFFICER only - tab filter sent to /officers/customers as boolean flags */
  filter?: OfficerCustomerFilter;
}

export const useDashboardTableData = (params: DashboardTableParams = {}) => {
  const { user } = useAuthStore();

  const getTableData = async (): Promise<
    | OfficerCustomer[]
    | PendingLoadingRequest[]
    | AdminDashboardStats
    | RegionalAdminDashboardResponse
  > => {
    if (!user) throw new Error("User not found");

    switch (normalizeStaffRole(user.role)) {
      case "OFFICER":
        // "all" leaves every flag false, so none is sent
        return dashboardService.getOfficerCustomers({
          search: params.search,
          overdue: params.filter === "overdue",
          activeTickets: params.filter === "activeTickets",
          // AO-C1 - the "waiting on me" tab, mirroring activeTickets
          unreadMessages: params.filter === "unreadMessages",
        });
      case "ADMIN":
        return dashboardService.getAdminDashboard();
      case "REGIONAL_ADMIN":
        // Region comes from the token - see RA-03
        return dashboardService.getRegionalDashboard();
      default:
        return [];
    }
  };

  return useQuery({
    queryKey: [
      queryKeys.all[0],
      "dashboardTable",
      normalizeStaffRole(user?.role),
      params.search,
      params.filter,
    ],
    queryFn: getTableData,
    enabled:
      !!user &&
      ["OFFICER", "REGIONAL_ADMIN"].includes(normalizeStaffRole(user.role)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * The signed-in officer's own customers, paginated.
 *
 * Backs the All Customers modal for an OFFICER: GET /admin/customers is
 * ADMIN / REGIONAL_ADMIN only, so the officer view has to come from
 * GET /officers/customers instead. Same modal, different source.
 */
export const useOfficerCustomersPage = (
  params: OfficerCustomersParams & { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [
      queryKeys.all[0],
      "officerCustomersPage",
      params.page ?? 1,
      params.pageSize ?? DEFAULT_PAGE_SIZE,
      params.search ?? "",
      params.unreadMessages ?? false,
      params.sortBy ?? "",
      params.sortOrder ?? "",
    ],
    queryFn: () =>
      dashboardService.getOfficerCustomersPage({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        unreadMessages: params.unreadMessages,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * AO-C1: the distributor who has been waiting longest on an unread message.
 *
 * Fetched lazily by the Unread Messages tile rather than kept warm - the tile
 * needs the answer at the moment it is clicked, and a stale one would send the
 * officer to the wrong conversation.
 */
export const useNextUnreadCustomer = () => {
  return useMutation({
    mutationFn: () => dashboardService.getNextUnreadCustomer(),
  });
};
