/**
 * Officer Customer Hooks - React Query
 * Reusable hooks for officer customer operations
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { officerCustomerService } from "@/services/officerCustomer.service";
import { queryKeys } from "@/lib/api/queryKeys";

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
