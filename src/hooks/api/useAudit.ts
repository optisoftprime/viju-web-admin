/**
 * Audit Hooks - React Query
 * Reusable hooks for audit operations
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";
import { queryKeys } from "@/lib/api/queryKeys";
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
  /** B-4.2: exact UUID filters for the chat audit */
  officerId?: string;
  customerId?: string;
}

/**
 * Get Audit Tickets with optional filters
 */
export const useAuditTickets = (params: GetAuditTicketsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.audits.ticketsList(params as Record<string, unknown>),
    queryFn: () =>
      auditService.getTickets({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        customerName: params.customerName,
        officerName: params.officerName,
        region: params.region,
        keyword: params.keyword,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * AD-12 - chat audit threads. Same filters and envelope as the ticket audit,
 * so the audits page can host it as a second tab.
 */
export const useAuditChats = (params: GetAuditTicketsParams = {}) => {
  return useQuery({
    queryKey: ["audits", "chats", params as Record<string, unknown>],
    queryFn: () =>
      auditService.getChats({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        region: params.region,
        customerName: params.customerName,
        officerName: params.officerName,
        keyword: params.keyword,
        startDate: params.startDate,
        endDate: params.endDate,
        officerId: params.officerId,
        customerId: params.customerId,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
