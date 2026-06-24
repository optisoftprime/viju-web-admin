/**
 * Officer Service
 * Handles all officer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { OfficersListResponse, CreateOfficerRequest } from "@/lib/api/types";

interface GetOfficersParams {
  page?: number;
  pageSize?: number;
}

export const officerService = {
  /**
   * Get list of officers with pagination
   */
  getOfficers: async (
    params: GetOfficersParams,
  ): Promise<OfficersListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append("page", String(params.page));
      if (params.pageSize !== undefined)
        queryParams.append("pageSize", String(params.pageSize));

      const { data } = await apiClient.get(
        `${endpoints.officers.list}?${queryParams.toString()}`,
      );
      return data;
    } catch (error) {
      console.log("Fetch officers failed:", error);
      throw error;
    }
  },

  /**
   * Create a new officer
   */
  createOfficer: async (officer: CreateOfficerRequest) => {
    try {
      const { data } = await apiClient.post(endpoints.officers.create, officer);
      return data;
    } catch (error) {
      console.log("Create officer failed:", error);
      throw error;
    }
  },
};
