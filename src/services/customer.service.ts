/**
 * Customer Service
 * Handles all customer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { CustomerListResponse } from "@/lib/api/types";

interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  region?: string;
  search?: string;
}

export const customerService = {
  /**
   * Get list of customers with optional filters
   */
  getCustomers: async (
    params: GetCustomersParams,
  ): Promise<CustomerListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined) queryParams.append("page", String(params.page));
      if (params.pageSize !== undefined)
        queryParams.append("pageSize", String(params.pageSize));
      if (params.region) queryParams.append("region", params.region);
      if (params.search) queryParams.append("search", params.search);

      const { data } = await apiClient.get(
        `${endpoints.customers.list}?${queryParams.toString()}`,
      );
      return data;
    } catch (error) {
      console.error("Fetch customers failed:", error);
      throw error;
    }
  },
};
