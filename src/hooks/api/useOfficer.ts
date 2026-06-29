/**
 * Officer Hooks - React Query
 * Reusable hooks for officer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officerService } from "@/services/officer.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { CreateOfficerRequest } from "@/lib/api/types";

interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
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
