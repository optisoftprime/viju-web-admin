/**
 * Customer Hooks - React Query
 * Reusable hooks for customer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService } from "@/services/customer.service";
import { queryKeys, assignmentQueryKeys } from "@/lib/api/queryKeys";
import { getErrorMessage } from "@/utils/apiError";
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
 * List customers with optional region filter and name/erpId search
 * GET /admin/customers
 */
export const useCustomers = (params: GetCustomersParams = {}) => {
  return useQuery({
    queryKey: queryKeys.customers.customersList(
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      customerService.getCustomers({
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
 * Same list, kept so existing callers keep working
 * @deprecated Use useCustomers
 */
export const useCustomersForReassignment = useCustomers;

/**
 * Assign / reassign a single customer to an officer
 * PATCH /admin/customers/{id}/reassign
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
      // Refresh every surface that shows officer <-> customer assignments
      assignmentQueryKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to assign officer");
    },
  });
};
