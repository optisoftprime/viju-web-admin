/**
 * Officer Hooks - React Query
 * Reusable hooks for officer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { officerService } from "@/services/officer.service";
import { queryKeys, assignmentQueryKeys } from "@/lib/api/queryKeys";
import { getErrorMessage } from "@/utils/apiError";
import {
  CreateOfficerRequest,
  ReassignOfficerCustomersRequest,
  UpdateOfficerRequest,
} from "@/lib/api/types";

interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Scopes the list to one region - omitted for org-wide admins */
  region?: string;
}

/**
 * Get Officers list with pagination
 */
export const useOfficers = (params: GetOfficersParams = {}) => {
  return useQuery({
    queryKey: queryKeys.officers.officersList(
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      officerService.getOfficers({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        region: params.region,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

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
