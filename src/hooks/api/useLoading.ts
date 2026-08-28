/**
 * Loading Hooks - React Query
 * Regional loading requests (RA-06) and the loading officer queue (LO-02..05).
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  loadingService,
  loadingScopeForRole,
  type LoadingListParams,
  type LoadingScope,
} from "@/services/loading.service";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/utils/apiError";
import {
  AssignLoadingOfficerRequest,
  CancelLoadingRequestBody,
  CreateWaybillRequest,
  UpdateLoadingDescriptionRequest,
  UpdateLoadingStatusRequest,
} from "@/lib/api/types";

export const loadingKeys = {
  all: ["loading"] as const,
  requests: (scope: LoadingScope, params: Record<string, unknown>) =>
    ["loading", "requests", scope, params] as const,
  queue: (params: Record<string, unknown>) =>
    ["loading", "queue", params] as const,
  detail: (id: string | null) => ["loading", "detail", id] as const,
  officers: (search?: string, region?: string) =>
    ["loading", "officers", search ?? "", region ?? ""] as const,
};

/** Everything that changes when a load moves - refreshed together */
const invalidateLoading = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: loadingKeys.all });
  // the regional dashboard's pendingLoadingRequests block also moves
  queryClient.invalidateQueries({ queryKey: ["query"] });
};

/* ---------------------------- RA-06 + spec 39 regional admin / account officer */

/**
 * Spec 39: the scope the SIGNED-IN user reads the loading queue through.
 *
 * Derived from the role rather than passed in by each screen, so one page
 * serves a regional admin and an account officer without either of them
 * naming a route - and neither can accidentally address the other's.
 */
export const useLoadingScope = (): LoadingScope => {
  const { user } = useAuthStore();
  return loadingScopeForRole(user?.role);
};

export const useLoadingRequests = (params: LoadingListParams = {}) => {
  const scope = useLoadingScope();

  return useQuery({
    queryKey: loadingKeys.requests(scope, params as Record<string, unknown>),
    queryFn: () => loadingService.getRequests(scope, params),
    staleTime: 60 * 1000,
    retry: 1,
  });
};

export const useAssignLoadingOfficer = () => {
  const queryClient = useQueryClient();
  const scope = useLoadingScope();

  return useMutation({
    mutationFn: ({
      requestId,
      body,
    }: {
      requestId: string;
      body: AssignLoadingOfficerRequest;
    }) => loadingService.assignLoadingOfficer(scope, requestId, body),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to assign loading officer");
    },
  });
};

/**
 * Spec 39: call off a load. The cancellation lands on the loading officer's
 * own screen too, so every loading cache is invalidated, not just the list
 * the button was pressed on.
 */
export const useCancelLoadingRequest = () => {
  const queryClient = useQueryClient();
  const scope = useLoadingScope();

  return useMutation({
    mutationFn: ({
      requestId,
      body,
    }: {
      requestId: string;
      body?: CancelLoadingRequestBody;
    }) => loadingService.cancelRequest(scope, requestId, body ?? {}),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      // 409 on an already-completed load carries a renderable message
      toast.error(
        getErrorMessage(error) || "Could not cancel this loading request",
      );
    },
  });
};

/**
 * Picker source for the assign modal. Spec 39 scopes it to the load's region
 * and to active accounts, so the list matches the modal's own heading.
 */
export const useLoadingOfficers = (search?: string, region?: string) =>
  useQuery({
    queryKey: loadingKeys.officers(search, region),
    queryFn: () => loadingService.getLoadingOfficers(search, region),
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

/**
 * Spec 39: the loading officer's note on a load, saved on its own so it can
 * be written at any point without moving the status.
 */
export const useUpdateLoadingDescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateLoadingDescriptionRequest;
    }) => loadingService.updateDescription(id, body),
    onSuccess: () => invalidateLoading(queryClient),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Could not save that description");
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
