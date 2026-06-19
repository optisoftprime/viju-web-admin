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
