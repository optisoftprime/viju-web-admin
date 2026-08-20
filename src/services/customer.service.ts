/**
 * Customer Service
 * Handles all customer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeList } from "@/utils/safe";
import {
  CustomersListResponse,
  CustomerDetail,
  CustomerSortBy,
  CustomerWithOfficers,
  ReassignCustomerRequest,
  UnmappedCustomer,
  ErpSyncStatus,
  SortOrder,
} from "@/lib/api/types";

interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  region?: string;
  search?: string;
  /** B-1.1: server-side assignment filter - replaces client-side filtering */
  hasOfficer?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
}

/**
 * Build the customer query string.
 *
 * Only well-formed values are sent: the backend answers 400 for an unknown
 * `sortBy`/`sortOrder` or a non-boolean `hasOfficer`, so anything unexpected is
 * dropped here rather than turned into a failed request.
 */
const buildCustomerQuery = (params: GetCustomersParams): string => {
  const queryParams = new URLSearchParams();

  if (Number.isFinite(params.page) && (params.page as number) > 0) {
    queryParams.append("page", String(params.page));
  }
  if (Number.isFinite(params.pageSize) && (params.pageSize as number) > 0) {
    // Any positive integer is accepted; the server clamps to 200 and echoes
    // the applied value back in meta.pageSize
    queryParams.append("pageSize", String(params.pageSize));
  }
  if (params.region) queryParams.append("region", params.region);
  if (params.search) queryParams.append("search", params.search);
  if (typeof params.hasOfficer === "boolean") {
    queryParams.append("hasOfficer", String(params.hasOfficer));
  }
  if (params.sortBy) {
    queryParams.append("sortBy", params.sortBy);
    queryParams.append("sortOrder", params.sortOrder === "asc" ? "asc" : "desc");
  }

  return queryParams.toString();
};

export const customerService = {
  /**
   * Get list of customers with optional filters
   */
  getCustomers: async (
    params: GetCustomersParams,
  ): Promise<CustomersListResponse> => {
    const { data } = await apiClient.get(
      `${endpoints.customers.list}?${buildCustomerQuery(params)}`,
    );

    // The list drives pagination, so an unexpected shape must still yield a
    // usable envelope rather than throwing inside the render
    const { data: rows, meta } = safeList<CustomerWithOfficers>(data);
    return { data: rows, meta } as CustomersListResponse;
  },

  /**
   * B-3: full ERP-parity detail for a single customer
   * GET /admin/customers/{id}
   */
  getCustomer: async (customerId: string): Promise<CustomerDetail | null> => {
    if (!customerId) return null;

    const url = endpoints.customers.detail.replace(
      "{id}",
      encodeURIComponent(customerId),
    );
    const { data } = await apiClient.get(url);

    // Tolerate both a bare object and a { data: {...} } envelope
    const detail =
      data && typeof data === "object" && "data" in data
        ? (data as { data: unknown }).data
        : data;

    return detail && typeof detail === "object"
      ? (detail as CustomerDetail)
      : null;
  },

  /**
   * Get list of customers for reassignment with optional filters
   * @deprecated Same endpoint as getCustomers - kept for existing callers
   */
  getCustomersForReassignment: async (
    params: GetCustomersParams,
  ): Promise<CustomersListResponse> => customerService.getCustomers(params),

  /**
   * Export filtered customers list as CSV
   */
  exportCustomers: async (params: GetCustomersParams = {}): Promise<Blob> => {
    const { data } = await apiClient.get(
      `${endpoints.customers.export}?${buildCustomerQuery(params)}`,
      {
        responseType: "blob",
      },
    );

    return data;
  },

  /**
   * Reassign customer to a new officer
   */
  reassignCustomer: async (
    customerId: string,
    request: ReassignCustomerRequest,
  ) => {
    const url = endpoints.customers.reassign.replace(
      "{id}",
      encodeURIComponent(customerId),
    );
    const { data } = await apiClient.patch(url, request);
    return data;
  },

  /**
   * B-2: ERP rows quarantined because their BP_CLUSTER_CODE is not a Viju
   * region. Read-only, admin-only - used for the data-quality panel.
   */
  getUnmappedCustomers: async (params: {
    page?: number;
    pageSize?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (Number.isFinite(params.page) && (params.page as number) > 0) {
      queryParams.append("page", String(params.page));
    }
    if (Number.isFinite(params.pageSize) && (params.pageSize as number) > 0) {
      queryParams.append("pageSize", String(params.pageSize));
    }

    const { data } = await apiClient.get(
      `${endpoints.erp.unmappedCustomers}?${queryParams.toString()}`,
    );
    return safeList<UnmappedCustomer>(data);
  },

  /**
   * B-2: ingest / projection freshness
   */
  getErpSyncStatus: async (): Promise<ErpSyncStatus> => {
    const { data } = await apiClient.get(endpoints.erp.syncStatus);
    return data && typeof data === "object" ? (data as ErpSyncStatus) : {};
  },
};
