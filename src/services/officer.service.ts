/**
 * Officer Service
 * Handles all officer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { OfficersListResponse, CreateOfficerRequest } from "@/lib/api/types";

interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
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
      if (params.search) queryParams.append("search", params.search);

      const { data } = await apiClient.get(
        `${endpoints.officers.list}?${queryParams.toString()}`,
      );
      return data;
    } catch (error) {
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
      throw error;
    }
  },
};
