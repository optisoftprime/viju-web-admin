/**
 * Officer Service
 * Handles all officer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  OfficersListResponse,
  CreateOfficerRequest,
  CreateOfficerResponse,
  ReassignOfficerCustomersRequest,
  ReassignOfficerCustomersResponse,
  UpdateOfficerRequest,
  UpdateOfficerProfileRequest,
  UpdateOfficerResponse,
  OfficerDetail,
  BroadcastRegion,
  BulkOfficerRegionRequest,
  BulkOfficerRegionResponse,
  BulkOfficerFailure,
} from "@/lib/api/types";
import { safeArray } from "@/utils/safe";

/** O-2 - the server's own cap, mirrored so an oversized batch never leaves */
const MAX_BULK_OFFICERS = 500;
import { normalizeStaffRole } from "@/constants/roles";

export interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /**
   * Optional region filter.
   *
   * Spec 40 (**RA-O1**, answered): for a REGIONAL_ADMIN this is **accepted and
   * ignored** - the region always comes from their token - so sending it or
   * dropping it are equally safe and give an identical response.
   *
   * NOTE this deliberately differs from GET /admin/customers, where a region
   * from a regional admin is a hard 403 REGION_NOT_ALLOWED. The inconsistency
   * is pre-existing and both sides were left alone on purpose: changing the
   * customers route would break a working screen, and changing this one would
   * break the officers screens. Nothing leaks either way - scope is read from
   * the token on both.
   */
  region?: string;
  /**
   * Filter by staff role, e.g. LOADING_OFFICER for the assign picker.
   * Defaults to OFFICER server-side. "ACCOUNT_OFFICER" is a 400 here, so it is
   * normalised to "OFFICER" before it goes on the wire.
   */
  role?: string;
  /**
   * Return all four managed roles in one page, overriding `role`.
   * ADMIN only - silently ignored for a regional admin.
   */
  managed?: boolean;
  /** Filter by account status. Omit for both, which is the default. */
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const officerService = {
  /**
   * B-4.1: single officer profile.
   * A regional admin may read officers in their own region; outside it the API
   * answers 403, which surfaces as a query error rather than empty data.
   */
  getOfficer: async (officerId: string): Promise<OfficerDetail | null> => {
    if (!officerId) return null;

    const url = endpoints.officers.detail.replace(
      "{id}",
      encodeURIComponent(officerId),
    );
    const { data } = await apiClient.get(url);

    // Tolerate both a bare object and a { data: {...} } envelope
    const detail =
      data && typeof data === "object" && "data" in data
        ? (data as { data: unknown }).data
        : data;

    return detail && typeof detail === "object"
      ? (detail as OfficerDetail)
      : null;
  },

  /**
   * Get list of officers with pagination
   */
  getOfficers: async (
    params: GetOfficersParams,
  ): Promise<OfficersListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append("page", String(params.page));
      if (params.pageSize !== undefined)
        queryParams.append("pageSize", String(params.pageSize));
      if (params.search) queryParams.append("search", params.search);
      if (params.region) queryParams.append("region", params.region);
      // `managed` overrides `role` server-side; sending both is pointless and
      // sending ACCOUNT_OFFICER on this route is a 400.
      if (params.managed) {
        queryParams.append("managed", "true");
      } else if (params.role) {
        queryParams.append("role", normalizeStaffRole(params.role));
      }
      if (params.isActive !== undefined) {
        queryParams.append("isActive", String(params.isActive));
      }
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const { data } = await apiClient.get(
        `${endpoints.officers.list}?${queryParams.toString()}`,
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a managed user - account officer, loading officer, regional admin
   * or admin.
   *
   * The payload is rebuilt key by key rather than spread: the API rejects any
   * property it does not declare, and `region` must be ABSENT for an ADMIN
   * rather than sent as null or "".
   */
  createOfficer: async (
    officer: CreateOfficerRequest,
  ): Promise<CreateOfficerResponse> => {
    const payload: CreateOfficerRequest = {
      name: officer.name.trim(),
      email: officer.email.trim(),
      // Separators eat into the 20-character limit, so strip them
      phone: officer.phone.replace(/[\s-]/g, ""),
      password: officer.password,
    };

    if (officer.role) payload.role = officer.role;
    if (officer.region) payload.region = officer.region;

    const { data } = await apiClient.post(endpoints.officers.create, payload);
    return data;
  },

  /**
   * Deactivate or reactivate a managed user (AD-18).
   *
   * Idempotent: sending the status the account already has returns 200 with
   * `changed: false`. Rejects with 409 OFFICER_HAS_CUSTOMERS while an account
   * officer still holds customers - the caller reads `assignedCustomers` off
   * the error body. ADMIN, REGIONAL_ADMIN and LOADING_OFFICER hold no
   * portfolio and deactivate straight away.
   */
  setActive: async (
    officerId: string,
    body: UpdateOfficerRequest,
  ): Promise<UpdateOfficerResponse> => {
    const url = endpoints.officers.update.replace(
      "{id}",
      encodeURIComponent(officerId),
    );
    const { data } = await apiClient.patch(url, body);
    return data;
  },

  /**
   * Spec 39: edit a managed user - name, phone, region, password.
   *
   * Same route as `setActive`, different body. Built key by key rather than
   * spread, for the same reason `createOfficer` is: the API rejects any
   * property it does not declare, and an empty string is not the same as an
   * absent field - `phone: ""` would clear a number nobody asked to clear.
   *
   * Separators are stripped from the phone exactly as on create, so the value
   * stays inside the API's 20-character limit.
   */
  updateProfile: async (
    officerId: string,
    body: UpdateOfficerProfileRequest,
  ): Promise<UpdateOfficerResponse> => {
    const payload: UpdateOfficerProfileRequest = {};

    if (body.name?.trim()) payload.name = body.name.trim();
    if (body.phone?.trim()) payload.phone = body.phone.replace(/[\s-]/g, "");
    if (body.region) payload.region = body.region;
    if (body.password) payload.password = body.password;

    const url = endpoints.officers.update.replace(
      "{id}",
      encodeURIComponent(officerId),
    );
    const { data } = await apiClient.patch(url, payload);
    return data;
  },

  /**
   * Spec 39 (**O-2**): move several officers into one region, in ONE call.
   *
   * This used to fan out over `updateProfile`, one request per officer. The
   * bulk route now exists and applies the same rules per officer, so `code` on
   * a failure is the same value the single route returns.
   *
   * Not all-or-nothing, and no surrounding transaction: nine moved and one
   * failed leaves nine moved. Both halves of the response are meaningful.
   *
   * Duplicates are collapsed server-side; the cap is 500 per call, enforced
   * here too so an oversized selection is refused with something readable
   * rather than a 400.
   */
  bulkSetRegion: async (
    officerIds: string[],
    region: BroadcastRegion,
  ): Promise<BulkOfficerRegionResponse> => {
    const unique = Array.from(new Set(officerIds));

    if (unique.length > MAX_BULK_OFFICERS) {
      throw new Error(
        `Select at most ${MAX_BULK_OFFICERS} officers at a time (${unique.length} selected).`,
      );
    }

    const body: BulkOfficerRegionRequest = { officerIds: unique, region };
    const { data } = await apiClient.patch(endpoints.officers.bulkRegion, body);

    return {
      succeeded: safeArray<string>(data?.succeeded),
      failed: safeArray<BulkOfficerFailure>(data?.failed),
    };
  },

  /**
   * Move every customer of the source officer to a new officer
   * @param officerId - Current (source) officer id
   */
  reassignCustomers: async (
    officerId: string,
    request: ReassignOfficerCustomersRequest,
  ): Promise<ReassignOfficerCustomersResponse> => {
    try {
      const url = endpoints.officers.reassignCustomers.replace(
        "{id}",
        officerId,
      );
      const { data } = await apiClient.patch(url, request);
      return data;
    } catch (error) {
      throw error;
    }
  },
};
