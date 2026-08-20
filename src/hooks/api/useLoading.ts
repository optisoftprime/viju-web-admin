/**
 * Loading Hooks - React Query
 * Regional loading requests (RA-06) and the loading officer queue (LO-02..05).
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loadingService, type LoadingListParams } from "@/services/loading.service";
import { getErrorMessage } from "@/utils/apiError";
import {
  AssignLoadingOfficerRequest,
  CreateWaybillRequest,
  UpdateLoadingStatusRequest,
} from "@/lib/api/types";

export const loadingKeys = {
  all: ["loading"] as const,
  regional: (params: Record<string, unknown>) =>
    ["loading", "regional", params] as const,
  queue: (params: Record<string, unknown>) =>
    ["loading", "queue", params] as const,
  detail: (id: string | null) => ["loading", "detail", id] as const,
  officers: (search?: string) => ["loading", "officers", search ?? ""] as const,
};

/** Everything that changes when a load moves - refreshed together */
const invalidateLoading = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: loadingKeys.all });
  // the regional dashboard's pendingLoadingRequests block also moves
  queryClient.invalidateQueries({ queryKey: ["query"] });
};

/* ------------------------------------------------ RA-06 regional admin */

export const useRegionalLoadingRequests = (params: LoadingListParams = {}) =>
  useQuery({
    queryKey: loadingKeys.regional(params as Record<string, unknown>),
    queryFn: () => loadingService.getRegionalRequests(params),
    staleTime: 60 * 1000,
    retry: 1,
  });

export const useAssignLoadingOfficer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      body,
    }: {
      requestId: string;
      body: AssignLoadingOfficerRequest;
    }) => loadingService.assignLoadingOfficer(requestId, body),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to assign loading officer");
    },
  });
};

/** Picker source for the assign modal */
export const useLoadingOfficers = (search?: string) =>
  useQuery({
    queryKey: loadingKeys.officers(search),
    queryFn: () => loadingService.getLoadingOfficers(search),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

/* ------------------------------------------------ LO-02..05 loading officer */

export const useLoadingQueue = (params: LoadingListParams = {}) =>
  useQuery({
    queryKey: loadingKeys.queue(params as Record<string, unknown>),
    queryFn: () => loadingService.getQueue(params),
    staleTime: 60 * 1000,
    retry: 1,
  });

export const useLoadingQueueItem = (id: string | null) =>
  useQuery({
    queryKey: loadingKeys.detail(id),
    queryFn: () => loadingService.getQueueItem(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
    retry: 1,
  });

export const useUpdateLoadingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateLoadingStatusRequest;
    }) => loadingService.updateStatus(id, body),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      // 409 INVALID_STATUS_TRANSITION and 400 both carry a renderable message
      toast.error(getErrorMessage(error) || "Could not update the load status");
    },
  });
};

export const useCreateLoadingWaybill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateWaybillRequest }) =>
      loadingService.createWaybill(id, body),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Could not record the waybill");
    },
  });
};
