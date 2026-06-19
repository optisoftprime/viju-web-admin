/**
 * Dashboard Service\n * Handles all dashboard-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  AdminDashboardStats,
  OfficerDashboardStats,
  RegionalDashboardStats,
  OfficerCustomer,
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
   */
  getOfficerCustomers: async (): Promise<OfficerCustomer[]> => {
    const { data } = await apiClient.get(endpoints.dashboard.officerCustomers);
    const officerCustomers = data.data;
    return officerCustomers;
  },
};
