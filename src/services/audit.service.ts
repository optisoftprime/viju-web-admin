/**
 * Audit Service
 * Handles all audit-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeList } from "@/utils/safe";
import type { AuditChatThread } from "@/lib/api/types";
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
  /** B-4.2: exact UUID filters - prefer these over the ambiguous name filters */
  officerId?: string;
  customerId?: string;
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

  /**
   * AD-12 - chat audit. A row is a THREAD, not a message. Strictly read-only.
   * Filters are identical to the ticket audit.
   */
  getChats: async (params: GetAuditTicketsParams) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined)
      queryParams.append("page", String(params.page));
    if (params.pageSize !== undefined)
      queryParams.append("pageSize", String(params.pageSize));
    if (params.region) queryParams.append("region", params.region);
    if (params.customerName)
      queryParams.append("customerName", params.customerName);
    if (params.officerName)
      queryParams.append("officerName", params.officerName);
    if (params.keyword) queryParams.append("keyword", params.keyword);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    // Exact UUIDs. A malformed value is a 400, so only send well-formed ones.
    if (params.officerId) queryParams.append("officerId", params.officerId);
    if (params.customerId) queryParams.append("customerId", params.customerId);

    const { data } = await apiClient.get(
      `${endpoints.audits.chats}?${queryParams.toString()}`,
    );
    return safeList<AuditChatThread>(data);
  },
};
