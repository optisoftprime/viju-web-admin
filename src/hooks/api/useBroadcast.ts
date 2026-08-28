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
import { useAuthStore } from "@/store/auth.store";
import { normalizeStaffRole } from "@/constants/roles";

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
 * Send Individual Broadcast Mutation Hook - ONE recipient.
 *
 * Spec 39 moved the form onto `useBroadcastIndividualMany`, which is a
 * many-recipient wrapper over the same route. This is kept because it is the
 * typed binding for POST /admin/broadcasts/individual as the API declares it -
 * one customerId per call - and is what the batch hook is built from.
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
 * Spec 39 (**B-2**): send one individual broadcast to several customers.
 *
 * One call, answering one Broadcast row per recipient. Unlike the two bulk
 * ADMIN routes this one is NOT partial - it either sends or it raises - so
 * there is no `failed` half to report, and a rejection reaches `onError` with
 * nothing delivered.
 */
export const useBroadcastIndividualMany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerIds,
      payload,
    }: {
      customerIds: string[];
      payload: Omit<BroadcastIndividualRequest, "customerId">;
    }) => broadcastService.sendIndividualBroadcastToMany(customerIds, payload),
    onSuccess: (broadcasts) => {
      queryClient.invalidateQueries({ queryKey: broadcastHistoryKey });

      const credited = broadcasts.some((broadcast) =>
        Boolean(broadcast?.deliveryAllowance),
      );

      toast.success(
        `Broadcast sent to ${broadcasts.length} customer${
          broadcasts.length === 1 ? "" : "s"
        }${credited ? ", delivery allowance credited to each" : ""}`,
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to send broadcast");
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
 *
 * Spec 40: ROLE-AWARE. A REGIONAL_ADMIN reads GET /regional/customers instead,
 * for two separate reasons - GET /admin/customers answers 403
 * REGION_NOT_ALLOWED if they name a region AT ALL (even their own), and
 * without one they would be offered every customer in the organisation to
 * broadcast to. The regional route resolves the region from their token, so
 * the recipient picker can only ever list their own region.
 */
export const useInfiniteCustomers = (search: string = "", region?: string) => {
  const { user } = useAuthStore();
  const isRegionScoped = normalizeStaffRole(user?.role) === "REGIONAL_ADMIN";

  return useInfiniteQuery({
    queryKey: ["customers.list", isRegionScoped ? "regional" : "admin", search, region],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (isRegionScoped) {
        // `region` is deliberately NOT forwarded - it comes from the token,
        // and naming one here is at best redundant and at worst a 403
        return customerService.getRegionalCustomers({
          page: pageParam,
          pageSize: 20,
          search: search || undefined,
        });
      }

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
