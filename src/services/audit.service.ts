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
  /**
   * RA-T1: one or more ticket statuses. Sent comma-separated; the API also
   * accepts a repeated param. Case-insensitive server-side, and meta.total
   * counts the filtered set. An unknown value is a 400, so only the known enum
   * is ever put on the wire.
   */
  status?: string[];
}

/**
 * Filters shared by the ticket audit, the chat audit and both CSV exports.
 *
 * Region is deliberately still sent when the caller supplies one: for an ADMIN
 * it filters, and for a REGIONAL_ADMIN the server overrides it with the
 * token's own region rather than honouring or rejecting it.
 */
const appendAuditFilters = (
  queryParams: URLSearchParams,
  params: GetAuditTicketsParams,
): void => {
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
  // Comma-separated, blanks dropped - an empty list means "every status",
  // which is the API default and must not go on the wire as an empty value
  if (params.status?.length) {
    const statuses = params.status.filter(Boolean);
    if (statuses.length) queryParams.append("status", statuses.join(","));
  }
};

export const auditService = {
  /**
   * Get list of audit tickets with optional filters
   */
  getTickets: async (
    params: GetAuditTicketsParams,
  ): Promise<AuditTicketsListResponse> => {
    const queryParams = new URLSearchParams();
    appendAuditFilters(queryParams, params);

    const { data } = await apiClient.get(
      `${endpoints.audits.tickets}?${queryParams.toString()}`,
    );
    return data;
  },

  /**
   * Export audit tickets as CSV with the current filters, status included.
   * The backend names the file viju-tickets-audit.csv.
   */
  exportTickets: async (params: GetAuditTicketsParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    appendAuditFilters(queryParams, params);

    const { data } = await apiClient.get(
      `${endpoints.audits.export}?${queryParams.toString()}`,
      {
        responseType: "blob",
      },
    );
    return data;
  },

  /**
   * AD-12 - chat audit. A row is a THREAD, not a message.
   * Filters are identical to the ticket audit.
   */
  getChats: async (params: GetAuditTicketsParams) => {
    const queryParams = new URLSearchParams();
    appendAuditFilters(queryParams, params);

    const { data } = await apiClient.get(
      `${endpoints.audits.chats}?${queryParams.toString()}`,
    );
    return safeList<AuditChatThread>(data);
  },

  /**
   * AD-12 / AD-X1 - chat audit as CSV, one row per conversation, most recently
   * active first. Takes the same filters as the list, so the file matches
   * whatever the operator is looking at.
   *
   * The body is CSV, not a JSON envelope - read it as a Blob. No matches
   * returns the header row alone with a 200, never a 404.
   */
  exportChats: async (params: GetAuditTicketsParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    appendAuditFilters(queryParams, params);

    const { data } = await apiClient.get(
      `${endpoints.audits.chatsExport}?${queryParams.toString()}`,
      {
        responseType: "blob",
      },
    );
    return data;
  },
};
