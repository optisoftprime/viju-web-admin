/**
 * Audit Service
 * Handles all audit-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { AuditTicketsListResponse } from "@/lib/api/types";

interface GetAuditTicketsParams {
  page?: number;
  pageSize?: number;
  customerName?: string;
  officerName?: string;
  region?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  /**
   * Get list of audit tickets with optional filters
   */
  getTickets: async (
    params: GetAuditTicketsParams,
  ): Promise<AuditTicketsListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append("page", String(params.page));
      if (params.pageSize !== undefined)
        queryParams.append("pageSize", String(params.pageSize));
      if (params.customerName)
        queryParams.append("customerName", params.customerName);
      if (params.officerName)
        queryParams.append("officerName", params.officerName);
      if (params.region) queryParams.append("region", params.region);
      if (params.keyword) queryParams.append("keyword", params.keyword);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);

      const { data } = await apiClient.get(
        `${endpoints.audits.tickets}?${queryParams.toString()}`,
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export audit tickets as CSV with current filters
   */
  exportTickets: async (params: GetAuditTicketsParams = {}): Promise<Blob> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append("page", String(params.page));
      if (params.pageSize !== undefined)
        queryParams.append("pageSize", String(params.pageSize));
      if (params.customerName)
        queryParams.append("customerName", params.customerName);
      if (params.officerName)
        queryParams.append("officerName", params.officerName);
      if (params.region) queryParams.append("region", params.region);
      if (params.keyword) queryParams.append("keyword", params.keyword);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);

      const { data } = await apiClient.get(
        `${endpoints.audits.export}?${queryParams.toString()}`,
        {
          responseType: "blob",
        },
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
};
