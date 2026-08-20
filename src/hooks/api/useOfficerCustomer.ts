/**
 * Officer Customer Hooks - React Query
 * Reusable hooks for officer customer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officerCustomerService } from "@/services/officerCustomer.service";
import { SendTicketReplyRequest,
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
export const useOfficerTickets = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["officerTickets", page, pageSize],
    queryFn: () => officerCustomerService.getOfficerTickets(page, pageSize),
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
 * Send a reply to a ticket
 */
export const useSendTicketReply = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendTicketReplyRequest) =>
      officerCustomerService.sendTicketReply(ticketId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketThread", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["officerTickets"] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticketThread", variables.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["officerTickets"] });
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
