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

/**
 * Get distributor invoices
 */
export const useDistributorInvoices = (customerId: string | null) => {
  return useQuery({
    queryKey: ["distributorInvoices", customerId],
    queryFn: () => officerCustomerService.getInvoices(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Get distributor stock
 */
export const useDistributorStock = (customerId: string | null) => {
  return useQuery({
    queryKey: ["distributorStock", customerId],
    queryFn: () => officerCustomerService.getStock(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Get distributor waybills
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
