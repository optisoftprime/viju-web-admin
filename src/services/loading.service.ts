/**
 * Loading Service
 * Loading / warehouse officer queue (LO-02..LO-05) and the regional admin's
 * loading-request list (RA-06).
 *
 * Every read normalises through safeList/safeArray so a null body, a bare
 * array or a missing meta block cannot reach the UI.
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeList, safeArray, type SafeMeta } from "@/utils/safe";
import {
  LoadingRequest,
  LoadingQueueDetail,
  AssignLoadingOfficerRequest,
  UpdateLoadingStatusRequest,
  CreateWaybillRequest,
  LoadingWaybill,
} from "@/lib/api/types";

export interface LoadingListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** PENDING | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | ALL */
  status?: string;
}

const buildQuery = (params: LoadingListParams): string => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append("page", String(params.page));
  if (params.pageSize !== undefined)
    query.append("pageSize", String(params.pageSize));
  if (params.search) query.append("search", params.search);
  // "ALL" is the tab default and means "no filter" - do not send it
  if (params.status && params.status !== "ALL")
    query.append("status", params.status);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const loadingService = {
  /**
   * RA-06 - regional admin list. Region is derived from the token, never sent.
   */
  getRegionalRequests: async (
    params: LoadingListParams = {},
  ): Promise<{ data: LoadingRequest[]; meta: SafeMeta }> => {
    const { data } = await apiClient.get(
      `${endpoints.regional.loadingRequests}${buildQuery(params)}`,
    );
    return safeList<LoadingRequest>(data);
  },

  /** RA-06 - assign a load to a loading officer */
  assignLoadingOfficer: async (
    requestId: string,
    body: AssignLoadingOfficerRequest,
  ): Promise<LoadingRequest> => {
    const url = endpoints.regional.assignLoadingRequest.replace(
      "{id}",
      encodeURIComponent(requestId),
    );
    const { data } = await apiClient.patch(url, body);
    return data;
  },

  /**
   * LO-02 - the signed-in officer's own queue. Omitting status returns all
   * three states so the UI can group them client-side.
   */
  getQueue: async (
    params: LoadingListParams = {},
  ): Promise<{ data: LoadingRequest[]; meta: SafeMeta }> => {
    const { data } = await apiClient.get(
      `${endpoints.loading.queue}${buildQuery(params)}`,
    );
    return safeList<LoadingRequest>(data);
  },

  /** LO-03 - 403 if the assignment belongs to another officer, 404 if unknown */
  getQueueItem: async (id: string): Promise<LoadingQueueDetail> => {
    const url = endpoints.loading.detail.replace("{id}", encodeURIComponent(id));
    const { data } = await apiClient.get(url);
    return data;
  },

  /**
   * LO-04 - ASSIGNED -> IN_PROGRESS -> COMPLETED only.
   * Sending ASSIGNED is a 400 (not an allowed target), not a 409.
   */
  updateStatus: async (
    id: string,
    body: UpdateLoadingStatusRequest,
  ): Promise<LoadingQueueDetail> => {
    const url = endpoints.loading.status.replace("{id}", encodeURIComponent(id));
    const { data } = await apiClient.patch(url, body);
    return data;
  },

  /** LO-05 - recording the waybill also completes the load */
  createWaybill: async (
    id: string,
    body: CreateWaybillRequest,
  ): Promise<LoadingWaybill> => {
    const url = endpoints.loading.waybill.replace(
      "{id}",
      encodeURIComponent(id),
    );
    const { data } = await apiClient.post(url, body);
    return data;
  },

  /**
   * Loading officers for the assign picker. Reuses /admin/officers with a role
   * filter rather than adding a route (handoff RA-06).
   */
  getLoadingOfficers: async (search?: string) => {
    const query = new URLSearchParams({
      role: "LOADING_OFFICER",
      pageSize: "50",
    });
    if (search) query.append("search", search);
    const { data } = await apiClient.get(
      `${endpoints.officers.list}?${query.toString()}`,
    );
    return safeArray(data);
  },
};
