/**
 * Dashboard Service\n * Handles all dashboard-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  AdminDashboardStats,
  OfficerDashboardStats,
  RegionalDashboardStats,
  OfficerCustomer,
  OfficerCustomersParams,
  RegionalAdminDashboardResponse,
} from "@/lib/api/types";

export const dashboardService = {
  /**
   * Get admin dashboard statistics
   */
  getAdminDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await apiClient.get(endpoints.dashboard.adminDashboard);
    return data;
  },

  /**
   * Get officer dashboard statistics
   */
  getOfficerDashboard: async (): Promise<OfficerDashboardStats> => {
    const { data } = await apiClient.get(endpoints.dashboard.officerDashboard);
    return data;
  },

  /**
   * Get regional admin dashboard statistics
   * @param region - Region enum value (LAGOS, SOUTH_WEST, SOUTH_EAST, NORTH)
   */
  getRegionalDashboard: async (
    region: string,
  ): Promise<RegionalAdminDashboardResponse> => {
    const { data } = await apiClient.get(
      endpoints.dashboard.regionalDashboard,
      {
        params: { region },
      },
    );
    return data;
  },

  /**
   * Get officer customers list
   * Only truthy flags are sent, so the "All" tab omits both filters
   */
  getOfficerCustomers: async (
    params: OfficerCustomersParams = {},
  ): Promise<OfficerCustomer[]> => {
    const { page, pageSize, search, overdue, activeTickets } = params;
    const response = await apiClient.get(endpoints.dashboard.officerCustomers, {
      params: {
        ...(page ? { page } : {}),
        ...(pageSize ? { pageSize } : {}),
        ...(search ? { search } : {}),
        ...(overdue ? { overdue: true } : {}),
        ...(activeTickets ? { activeTickets: true } : {}),
      },
    });
    const officerCustomers = response.data.data;
    return officerCustomers;
  },
};
