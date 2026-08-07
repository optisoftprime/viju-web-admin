/**
 * Officer Service
 * Handles all officer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  OfficersListResponse,
  CreateOfficerRequest,
  ReassignOfficerCustomersRequest,
  ReassignOfficerCustomersResponse,
} from "@/lib/api/types";

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

  /**
   * Move every customer of the source officer to a new officer
   * @param officerId - Current (source) officer id
   */
  reassignCustomers: async (
    officerId: string,
    request: ReassignOfficerCustomersRequest,
  ): Promise<ReassignOfficerCustomersResponse> => {
    try {
      const url = endpoints.officers.reassignCustomers.replace(
        "{id}",
        officerId,
      );
      const { data } = await apiClient.patch(url, request);
      return data;
    } catch (error) {
      throw error;
    }
  },
};
