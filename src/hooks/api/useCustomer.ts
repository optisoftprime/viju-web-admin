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
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import {
  CustomerSortBy,
  ReassignCustomerRequest,
  SortOrder,
} from "@/lib/api/types";

interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  region?: string;
  search?: string;
  hasOfficer?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
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
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        region: params.region,
        search: params.search,
        hasOfficer: params.hasOfficer,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * B-3: single customer detail
 * GET /admin/customers/{id} - only runs once an id is selected
 */
export const useCustomer = (customerId?: string | null) => {
  return useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => customerService.getCustomer(customerId as string),
    enabled: Boolean(customerId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * B-2: ERP rows quarantined for an unmappable region.
 * Admin-only, so a 403 for other roles is expected - callers must render the
 * error branch rather than assuming data.
 */
export const useUnmappedCustomers = (
  params: { page?: number; pageSize?: number; enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: ["erp", "unmapped-customers", params.page, params.pageSize],
    queryFn: () =>
      customerService.getUnmappedCustomers({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      }),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * B-2: ingest / projection freshness
 */
export const useErpSyncStatus = (enabled = true) => {
  return useQuery({
    queryKey: ["erp", "sync-status"],
    queryFn: () => customerService.getErpSyncStatus(),
    enabled,
    staleTime: 60 * 1000,
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
