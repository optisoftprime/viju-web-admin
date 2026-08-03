/**
 * Broadcast Hooks - React Query
 * Reusable hooks for broadcast operations
 */

"use client";

import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastService } from "@/services/broadcast.service";
import { customerService } from "@/services/customer.service";
import {
  BroadcastRegionalRequest,
  BroadcastIndividualRequest,
  BroadcastHistoryFilters,
} from "@/lib/api/types";
import { getErrorMessage } from "@/utils/apiError";

// Shared key prefix so a sent broadcast refreshes the history list
const broadcastHistoryKey = ["broadcasts.history"];

/**
 * Send Regional Broadcast Mutation Hook
 */
export const useBroadcastRegional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BroadcastRegionalRequest) =>
      broadcastService.sendRegionalBroadcast(payload),
    onSuccess: (broadcast) => {
      toast.success(
        `Regional broadcast sent to ${broadcast.deliveredCount} distributor(s)`,
      );
      queryClient.invalidateQueries({ queryKey: broadcastHistoryKey });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to send regional broadcast");
    },
  });
};

/**
 * Send Individual Broadcast Mutation Hook
 */
export const useBroadcastIndividual = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BroadcastIndividualRequest) =>
      broadcastService.sendIndividualBroadcast(payload),
    onSuccess: (broadcast) => {
      toast.success(
        broadcast.deliveryAllowance
          ? "Broadcast sent and delivery allowance credited"
          : "Individual broadcast sent successfully",
      );
      queryClient.invalidateQueries({ queryKey: broadcastHistoryKey });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to send individual broadcast");
    },
  });
};

/**
 * Get Broadcast History Query Hook
 */
export const useBroadcastHistory = (filters: BroadcastHistoryFilters) => {
  return useQuery({
    queryKey: [...broadcastHistoryKey, filters],
    queryFn: () => broadcastService.getBroadcastHistory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get Broadcast Detail Query Hook
 */
export const useBroadcastDetail = (id: string | null) => {
  return useQuery({
    queryKey: ["broadcasts.detail", id],
    queryFn: () => broadcastService.getBroadcastDetail(id!),
    enabled: !!id, // Only run if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get Customers with Infinite Query Hook
 * Auto-fetches more customers as user scrolls
 *
 * GET /admin/customers is 1-indexed and responds with { data, meta }
 */
export const useInfiniteCustomers = (search: string = "", region?: string) => {
  return useInfiniteQuery({
    queryKey: ["customers.list", search, region],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return customerService.getCustomers({
        page: pageParam,
        pageSize: 20,
        search: search || undefined,
        region: region || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: (data) =>
      data.pages.flatMap((page) =>
        (page.data ?? []).map((customer) => ({
          label: customer.name,
          value: customer.id,
        })),
      ),
  });
};
