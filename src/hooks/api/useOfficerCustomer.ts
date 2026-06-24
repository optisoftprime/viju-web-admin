/**
 * Officer Customer Hooks - React Query
 * Reusable hooks for officer customer operations
 */

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { officerCustomerService } from "@/services/officerCustomer.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { SendTicketReplyRequest } from "@/lib/api/types";

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
 * Get ticket thread for a distributor
 */
export const useTicketThread = (distributorId: string | null) => {
  return useQuery({
    queryKey: ["ticketThread", distributorId],
    queryFn: () => officerCustomerService.getTicketThread(distributorId!),
    enabled: !!distributorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Send a reply to a ticket
 */
export const useSendTicketReply = (ticketId: string) => {
  return useMutation({
    mutationFn: (request: SendTicketReplyRequest) =>
      officerCustomerService.sendTicketReply(ticketId, request),
  });
};

/**
 * Upload a file for ticket attachment
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: (data: { file: File; folder?: string }) =>
      officerCustomerService.uploadFile(data.file, data.folder),
  });
};
