/**
 * Customer Hooks - React Query
 * Reusable hooks for customer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/services/customer.service";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  CustomersListResponse,
  ReassignCustomerRequest,
} from "@/lib/api/types";

interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  region?: string;
  search?: string;
}

/**
 * Get Customers for reassignment with optional filters
 */
export const useCustomersForReassignment = (
  params: GetCustomersParams = {},
) => {
  return useQuery({
    queryKey: queryKeys.customers.customersList(
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      customerService.getCustomersForReassignment({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        region: params.region,
        search: params.search,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Reassign Customer to a new officer
 */
export const useReassignCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      request,
    }: {
      customerId: string;
      request: ReassignCustomerRequest;
    }) => customerService.reassignCustomer(customerId, request),
    onSuccess: () => {
      // Invalidate the customers list to refresh after reassignment
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
    },
  });
};
