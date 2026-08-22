/**
 * Officer Hooks - React Query
 * Reusable hooks for officer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  officerService,
  type GetOfficersParams,
} from "@/services/officer.service";
import { queryKeys, assignmentQueryKeys } from "@/lib/api/queryKeys";
import { getErrorMessage } from "@/utils/apiError";
import {
  CreateOfficerRequest,
  ReassignOfficerCustomersRequest,
  UpdateOfficerRequest,
} from "@/lib/api/types";

/**
 * Get Officers list with pagination.
 *
 * Every filter is forwarded verbatim so the cache key and the request stay in
 * step. `managed: true` widens the page to all four managed roles (ADMIN
 * only); `isActive` is omitted rather than defaulted, which is the unchanged
 * "both statuses" behaviour.
 */
export const useOfficers = (params: GetOfficersParams = {}) => {
  const query: GetOfficersParams = {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };

  return useQuery({
    queryKey: queryKeys.officers.officersList(query as Record<string, unknown>),
    queryFn: () => officerService.getOfficers(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * The Users screen: every managed role in one page.
 * `managed=true` is ADMIN-only and is ignored for a regional admin, who gets
 * their own region's officers back instead - the screen is gated on role, but
 * the API is the control either way.
 */
export const useManagedUsers = (
  params: Omit<GetOfficersParams, "managed"> = {},
) => useOfficers({ ...params, managed: true });

/**
 * Create a new Officer
 */
export const useCreateOfficer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (officer: CreateOfficerRequest) =>
      officerService.createOfficer(officer),
    onSuccess: () => {
      // Invalidate the officers list to refresh after creation
      queryClient.invalidateQueries({
        queryKey: queryKeys.officers.all,
      });
    },
    // No toast here: the form attaches EMAIL_IN_USE / PHONE_IN_USE to the
    // field named by `field`, and renders the validation array inline.
  });
};

/**
 * Move every customer of the source officer to a new officer
 * PATCH /admin/officers/{id}/reassign-customers
 */
export const useReassignOfficerCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      officerId,
      request,
    }: {
      officerId: string;
      request: ReassignOfficerCustomersRequest;
    }) => officerService.reassignCustomers(officerId, request),
    onSuccess: () => {
      // Refresh every surface that shows officer <-> customer assignments
      assignmentQueryKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to reassign customers");
    },
  });
};

/**
 * Deactivate / reactivate an officer (AD-18).
 *
 * The 409 case is NOT toasted here - the caller needs to render the count from
 * `assignedCustomers` and offer the reassign path, so it handles the error
 * itself. Everything else surfaces the API message.
 */
export const useSetOfficerActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      officerId,
      body,
    }: {
      officerId: string;
      body: UpdateOfficerRequest;
    }) => officerService.setActive(officerId, body),
    onSuccess: () => {
      assignmentQueryKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
  });
};

/**
 * B-4.1: single officer profile.
 * Only runs once an officer is selected. A regional admin reading outside
 * their region gets a 403, which lands in `error` - callers must render that
 * branch instead of assuming the profile loaded.
 */
export const useOfficer = (officerId?: string | null) => {
  return useQuery({
    queryKey: ["officers", "detail", officerId],
    queryFn: () => officerService.getOfficer(officerId as string),
    enabled: Boolean(officerId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
