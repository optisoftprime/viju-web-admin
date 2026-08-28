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
import { normalizeStaffRole } from "@/constants/roles";
import {
  LoadingRequest,
  LoadingQueueDetail,
  AssignLoadingOfficerRequest,
  UpdateLoadingStatusRequest,
  UpdateLoadingDescriptionRequest,
  CancelLoadingRequestBody,
  CreateWaybillRequest,
  LoadingWaybill,
} from "@/lib/api/types";

/**
 * Spec 39: who is working the loading queue.
 *
 * A REGIONAL_ADMIN and an ACCOUNT OFFICER do the same three things - list,
 * assign, cancel - over the same rows with the same bodies. Only the
 * authorisation scope differs, so only the path does. Everything downstream
 * of `routesFor` is identical for both.
 */
export type LoadingScope = "regional" | "officer";

const routesFor = (scope: LoadingScope) =>
  scope === "officer" ? endpoints.officerLoading : endpoints.regional;

/**
 * Map a staff role onto the scope that role reads the queue through.
 * Anything else falls back to "regional", which is the route that existed
 * before and answers 403 rather than returning another region's rows.
 */
export const loadingScopeForRole = (role?: string | null): LoadingScope =>
  normalizeStaffRole(role) === "OFFICER" ? "officer" : "regional";

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
   * RA-06 - the loading request list for whoever is asking. Region is derived
   * from the caller's token on both routes and is never sent as a param.
   */
  getRequests: async (
    scope: LoadingScope,
    params: LoadingListParams = {},
  ): Promise<{ data: LoadingRequest[]; meta: SafeMeta }> => {
    const { data } = await apiClient.get(
      `${routesFor(scope).loadingRequests}${buildQuery(params)}`,
    );
    return safeList<LoadingRequest>(data);
  },

  /** RA-06 - assign a load to a loading officer */
  assignLoadingOfficer: async (
    scope: LoadingScope,
    requestId: string,
    body: AssignLoadingOfficerRequest,
  ): Promise<LoadingRequest> => {
    const url = routesFor(scope).assignLoadingRequest.replace(
      "{id}",
      encodeURIComponent(requestId),
    );
    const { data } = await apiClient.patch(url, body);
    return data;
  },

  /**
   * Spec 39 / 41 - call off a load. Legal from PENDING and ASSIGNED only; both
   * IN_PROGRESS and COMPLETED answer 409 INVALID_STATUS_TRANSITION, the second
   * with "This load is already being loaded and cannot be cancelled."
   *
   * Callers hide the control for those two states, so the 409 is a backstop
   * rather than something an operator should ever see.
   */
  cancelRequest: async (
    scope: LoadingScope,
    requestId: string,
    body: CancelLoadingRequestBody = {},
  ): Promise<LoadingRequest> => {
    const url = routesFor(scope).cancelLoadingRequest.replace(
      "{id}",
      encodeURIComponent(requestId),
    );
    // An empty reason is omitted rather than sent as "" - the API declares it
    // optional, and a blank string reads as a reason that was given
    const payload = body.reason?.trim() ? { reason: body.reason.trim() } : {};
    const { data } = await apiClient.patch(url, payload);
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

  /**
   * Spec 39 - the loading officer's note on a load. Saved on its own, so a
   * description can be written at any point in the load's life without
   * touching its status.
   */
  updateDescription: async (
    id: string,
    body: UpdateLoadingDescriptionRequest,
  ): Promise<LoadingQueueDetail> => {
    const url = endpoints.loading.description.replace(
      "{id}",
      encodeURIComponent(id),
    );
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
   *
   * Spec 39 (**A-2**): scoped to the load's own region and to ACTIVE accounts
   * only. The modal has always been headed "Available Officers in <region>" -
   * it now lists what it claims to, and a deactivated officer can no longer be
   * picked only for the assignment to come back "Officer not found or
   * inactive".
   *
   * An ACCOUNT OFFICER is authorised on this route as of spec 39, but only
   * narrowly: the server pins them to role=LOADING_OFFICER and to their own
   * region whatever the query string says, so this cannot become a way to
   * enumerate their peers. Sending `region` is therefore harmless on every
   * role - honoured for an ADMIN, ignored for the other two.
   */
  getLoadingOfficers: async (search?: string, region?: string) => {
    const query = new URLSearchParams({
      role: "LOADING_OFFICER",
      pageSize: "50",
      isActive: "true",
    });
    if (search) query.append("search", search);
    if (region) query.append("region", region);
    const { data } = await apiClient.get(
      `${endpoints.officers.list}?${query.toString()}`,
    );
    return safeArray(data);
  },
};
