/**
 * Customer Hooks - React Query
 * Reusable hooks for customer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService } from "@/services/customer.service";
import { queryKeys, assignmentQueryKeys } from "@/lib/api/queryKeys";
import { getErrorMessage, isAlreadyAssignedError } from "@/utils/apiError";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import {
  BroadcastRegion,
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
  /** Include ERP customers not yet copied into the portal (union mode) */
  includeUnprojected?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
  /** Skip the request entirely, e.g. while a modal is closed */
  enabled?: boolean;
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
        includeUnprojected: params.includeUnprojected,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

interface GetRegionalCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  hasOfficer?: boolean;
  includeUnprojected?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
  /**
   * ADMIN only. A REGIONAL_ADMIN must leave this undefined - their region
   * comes from the token and naming another one is a 403.
   */
  region?: BroadcastRegion;
  /** Skip the request entirely, e.g. before an admin has picked a region */
  enabled?: boolean;
}

/**
 * RA-07: every customer in the signed-in regional admin's own region
 * GET /regional/customers
 *
 * Prefer this over useCustomers for the regional admin portal: the region is
 * resolved from the caller's staff record, so the page never has to know,
 * choose, or send it. The rows, filters, sorting and meta are identical to
 * the admin list.
 */
export const useRegionalCustomers = (
  params: GetRegionalCustomersParams = {},
) => {
  return useQuery({
    queryKey: queryKeys.customers.regionalList(
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      customerService.getRegionalCustomers({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        hasOfficer: params.hasOfficer,
        includeUnprojected: params.includeUnprojected,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        region: params.region,
      }),
    enabled: params.enabled !== false,
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
 * Spec 39 (**C-2**): assign one officer to every selected customer, in one
 * call.
 *
 * The route is NOT all-or-nothing, so a 2xx can still carry failures. Reports
 * both halves rather than treating a partial assignment as success.
 */
export const useBulkReassignCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerIds,
      request,
    }: {
      customerIds: string[];
      request: ReassignCustomerRequest;
    }) => customerService.bulkReassign(customerIds, request),
    onSuccess: (result) => {
      assignmentQueryKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );

      if (result.failed.length === 0) {
        toast.success(
          `${result.succeeded.length} customer${
            result.succeeded.length === 1 ? "" : "s"
          } assigned.`,
        );
        return;
      }

      // The first failure's message is the useful one - they are almost
      // always the same rule (wrong region, deactivated officer)
      toast.error(
        `${result.succeeded.length} assigned, ${result.failed.length} failed. ${
          result.failed[0].message ?? ""
        }`.trim(),
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to assign officer");
    },
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
 *
 * Works whether or not the customer already has an officer - the join row is
 * upserted server-side - and the incoming officer is notified in-app and by
 * web push on both paths.
 *
 * The 200 body carries `officerAssignments`, primary first, so a caller can
 * update the OFFICERS cell from the response rather than waiting on a refetch.
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
      // 409 ALREADY_ASSIGNED means the customer already holds this officer.
      // Nothing failed and nothing changed, so it is reported as a no-op
      // rather than an error toast.
      if (isAlreadyAssignedError(error)) {
        toast.info(
          getErrorMessage(error, "That officer is already assigned."),
        );
        return;
      }
      toast.error(getErrorMessage(error) || "Failed to assign officer");
    },
  });
};
