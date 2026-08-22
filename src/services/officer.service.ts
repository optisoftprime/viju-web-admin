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
  UpdateOfficerResponse,
  OfficerDetail,
} from "@/lib/api/types";
import { normalizeStaffRole } from "@/constants/roles";

export interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Optional region filter - regional admins only ever list their own region */
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
