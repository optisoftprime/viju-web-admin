/**
 * Broadcast Hooks - React Query
 * Reusable hooks for broadcast operations
 */

"use client";

import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastService } from "@/services/broadcast.service";
import { customerService } from "@/services/customer.service";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  BroadcastRegionalRequest,
  BroadcastIndividualRequest,
  BroadcastHistoryFilters,
  Customer,
} from "@/lib/api/types";
import { getErrorMessage } from "@/utils/apiError";

/**
 * Send Regional Broadcast Mutation Hook
 */
export const useBroadcastRegional = () => {
  return useMutation({
    mutationFn: (payload: BroadcastRegionalRequest) =>
      broadcastService.sendRegionalBroadcast(payload),
    onSuccess: () => {
      toast.success("Regional broadcast sent successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to send regional broadcast");
      console.error("Regional broadcast failed:", error);
    },
  });
};

/**
 * Send Individual Broadcast Mutation Hook
 */
export const useBroadcastIndividual = () => {
  return useMutation({
    mutationFn: (payload: BroadcastIndividualRequest) =>
      broadcastService.sendIndividualBroadcast(payload),
    onSuccess: () => {
      toast.success("Individual broadcast sent successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to send individual broadcast");
      console.error("Individual broadcast failed:", error);
    },
  });
};

/**
 * Get Broadcast History Query Hook
 */
export const useBroadcastHistory = (filters: BroadcastHistoryFilters) => {
  return useQuery({
    queryKey: ["broadcasts.history", filters],
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
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      return lastPage.number + 1 < lastPage.totalPages
        ? lastPage.number + 1
        : undefined;
    },
    select: (data: any) =>
      data.pages.flatMap((page: any) =>
        page.content.map((customer: any) => ({
          label: customer.name,
          value: customer.id,
        })),
      ),
  });
};
