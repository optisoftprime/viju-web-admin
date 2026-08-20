/**
 * Officer Service
 * Handles all officer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  OfficersListResponse,
  CreateOfficerRequest,
  ReassignOfficerCustomersRequest,
  ReassignOfficerCustomersResponse,
  UpdateOfficerRequest,
  Officer,
  OfficerDetail,
} from "@/lib/api/types";

interface GetOfficersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Optional region filter - regional admins only ever list their own region */
  region?: string;
  /** Filter by staff role, e.g. LOADING_OFFICER for the assign picker */
  role?: string;
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
      if (params.role) queryParams.append("role", params.role);
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
   * Create a new officer
   */
  createOfficer: async (officer: CreateOfficerRequest) => {
    try {
      const { data } = await apiClient.post(endpoints.officers.create, officer);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deactivate or reactivate an officer (AD-18).
   * Rejects with 409 OFFICER_HAS_CUSTOMERS while the officer still holds
   * customers - the caller reads `assignedCustomers` off the error body.
   */
  setActive: async (
    officerId: string,
    body: UpdateOfficerRequest,
  ): Promise<Officer> => {
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
