/**
 * Officer Customer Hooks - React Query
 * Reusable hooks for officer customer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officerCustomerService } from "@/services/officerCustomer.service";
import {
  SendTicketReplyRequest,
  SendTicketReplyResponse,
  TicketThread,
  UploadFolder,
} from "@/lib/api/types";

/**
 * Get distributor overview
 */
export const useDistributorOverview = (customerId: string | null) => {
  return useQuery({
    queryKey: ["distributorOverview", customerId],
    queryFn: () => officerCustomerService.getOverview(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Get distributor orders
 */
export const useDistributorOrders = (
  customerId: string | null,
  page: number = 1,
  pageSize: number = 20,
) => {
  return useQuery({
    queryKey: ["distributorOrders", customerId, page, pageSize],
    queryFn: () =>
      officerCustomerService.getOrders(customerId!, page, pageSize),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

interface InvoicesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get distributor invoices - paginated, with the tab's own wallet balance and
 * payment history alongside the page.
 */
export const useDistributorInvoices = (
  customerId: string | null,
  params: InvoicesParams = {},
) => {
  return useQuery({
    queryKey: [
      "distributorInvoices",
      customerId,
      params.page ?? 1,
      params.pageSize ?? 20,
      params.search ?? "",
      params.startDate ?? "",
      params.endDate ?? "",
    ],
    queryFn: () => officerCustomerService.getInvoices(customerId!, params),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * One order's merged product lines. Only runs once a row is opened - the list
 * no longer carries lines, which is what made it fast.
 */
export const useInvoiceDetail = (
  customerId: string | null,
  invoiceId: string | null,
) => {
  return useQuery({
    queryKey: ["invoiceDetail", customerId, invoiceId],
    queryFn: () =>
      officerCustomerService.getInvoiceDetail(customerId!, invoiceId!),
    enabled: Boolean(customerId && invoiceId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

interface StockParams {
  /** YYYY-MM-DD, inclusive, either may be sent alone */
  startDate?: string;
  endDate?: string;
}

/**
 * Get one distributor's ERP stock balance.
 */
export const useDistributorStock = (
  customerId: string | null,
  params: StockParams = {},
) => {
  return useQuery({
    queryKey: [
      "distributorStock",
      customerId,
      params.startDate ?? "",
      params.endDate ?? "",
    ],
    queryFn: () => officerCustomerService.getStock(customerId!, params),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * The same balance across the whole portfolio. Not paginated - there is no
 * `meta` on this one.
 */
export const usePortfolioStock = (
  params: StockParams & { enabled?: boolean } = {},
) => {
  const { enabled, ...query } = params;

  return useQuery({
    queryKey: [
      "portfolioStock",
      query.startDate ?? "",
      query.endDate ?? "",
    ],
    queryFn: () => officerCustomerService.getPortfolioStock(query),
    enabled: enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Get a distributor's ERP goods-movement documents.
 */
export const useDistributorWaybills = (
  customerId: string | null,
  page: number = 1,
  pageSize: number = 20,
) => {
  return useQuery({
    queryKey: ["distributorWaybills", customerId, page, pageSize],
    queryFn: () =>
      officerCustomerService.getWaybills(customerId!, page, pageSize),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/** One ERP document with its item lines. Keyed on docNo. */
export const useWaybillDetail = (
  customerId: string | null,
  docNo: string | null,
) => {
  return useQuery({
    queryKey: ["waybillDetail", customerId, docNo],
    queryFn: () => officerCustomerService.getWaybillDetail(customerId!, docNo!),
    enabled: Boolean(customerId && docNo),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Get tickets assigned to the current officer
 */
export const useOfficerTickets = (
  page: number = 1,
  pageSize: number = 20,
  options: {
    enabled?: boolean;
    /** AO-T1: narrow to one distributor, for the Tickets tab in a detail view */
    customerId?: string | null;
    /** AO-T1: one or more ticket statuses; omit for every status */
    status?: string[];
  } = {},
) => {
  const { customerId, status } = options;

  return useQuery({
    queryKey: [
      "officerTickets",
      page,
      pageSize,
      customerId ?? "",
      (status ?? []).join(","),
    ],
    queryFn: () =>
      officerCustomerService.getOfficerTickets(page, pageSize, {
        customerId,
        status,
      }),
    // The dashboard mounts this for the Open Tickets tile, which only exists
    // for an OFFICER - no other role should spend the request
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Get ticket thread for a ticket
 */
export const useTicketThread = (ticketId: string | null) => {
  return useQuery({
    queryKey: ["ticketThread", ticketId],
    queryFn: () => officerCustomerService.getTicketThread(ticketId!),
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Send a reply to a ticket.
 *
 * The 201 body IS the updated thread, so it is written straight into the
 * thread cache - the reply appears without a second round trip. The list
 * queries are still invalidated because their reply counts and `updatedAt`
 * change too.
 */
export const useSendTicketReply = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendTicketReplyRequest) =>
      officerCustomerService.sendTicketReply(ticketId, request),
    onSuccess: (response: SendTicketReplyResponse) => {
      // The body IS the thread - `reply` is just an echo of the new row
      // alongside it, so the whole object can be cached as-is
      queryClient.setQueryData<TicketThread>(
        ["ticketThread", ticketId],
        response,
      );
      queryClient.invalidateQueries({ queryKey: ["officerTickets"] });
      queryClient.invalidateQueries({ queryKey: ["audits"] });
    },
  });
};

/**
 * Update a ticket's status
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      officerCustomerService.updateTicketStatus(ticketId, status),
    onSuccess: (updated, variables) => {
      // Patch the status onto the cached thread so the select settles
      // immediately, then let the lists refetch their own counts
      queryClient.setQueryData<TicketThread | undefined>(
        ["ticketThread", variables.ticketId],
        (thread) =>
          thread
            ? {
                ...thread,
                status: updated?.status ?? variables.status,
                updatedAt: updated?.updatedAt ?? thread.updatedAt,
              }
            : thread,
      );
      queryClient.invalidateQueries({ queryKey: ["officerTickets"] });
      queryClient.invalidateQueries({ queryKey: ["audits"] });
    },
  });
};

/**
 * Upload a file for ticket attachment
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: (data: { file: File; folder?: UploadFolder }) =>
      officerCustomerService.uploadFile(data.file, data.folder),
  });
};
