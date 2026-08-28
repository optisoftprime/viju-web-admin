/**
 * Customer Service
 * Handles all customer-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeList, safeArray } from "@/utils/safe";
import {
  CustomersListResponse,
  CustomerDetail,
  CustomerSortBy,
  CustomerWithOfficers,
  ReassignCustomerRequest,
  ReassignCustomerResponse,
  RegionalCustomersQuery,
  RegionalCustomersResponse,
  UnmappedCustomer,
  ErpSyncStatus,
  SortOrder,
  BulkReassignCustomersRequest,
  BulkReassignCustomersResponse,
  BulkCustomerFailure,
} from "@/lib/api/types";

interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  region?: string;
  search?: string;
  /** B-1.1: server-side assignment filter - replaces client-side filtering */
  hasOfficer?: boolean;
  /**
   * Include ERP customers not yet copied into the portal. With this on,
   * meta.total matches the dashboard's Total Customers tile.
   * NOTE hasOfficer=true collapses the result to projected rows regardless -
   * an ERP-only row can never have an officer.
   */
  includeUnprojected?: boolean;
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
  if (params.includeUnprojected === true) {
    queryParams.append("includeUnprojected", "true");
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
   * RA-07: every customer in the caller's own region.
   * GET /regional/customers
   *
   * Same rows, filters, sorting and meta as getCustomers - only the path and
   * the region handling differ, so the shared table renders both with no
   * branching.
   *
   * `region` must be left off for a REGIONAL_ADMIN (it is resolved from their
   * staff record; another region is a 403) and must be supplied by an ADMIN,
   * who has no home region. Sending a blank value would be an undeclared
   * param, so buildCustomerQuery drops it.
   */
  getRegionalCustomers: async (
    params: RegionalCustomersQuery = {},
  ): Promise<RegionalCustomersResponse> => {
    const { data } = await apiClient.get(
      `${endpoints.regional.customers}?${buildCustomerQuery(params)}`,
    );

    const { data: rows, meta } = safeList<CustomerWithOfficers>(data);
    return { data: rows, meta } as RegionalCustomersResponse;
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
   * Assign or reassign a customer to an officer.
   *
   * Accepts a customer with no officer as well as one being moved. The 200
   * body carries `customerId` and the resulting `officerAssignments`
   * (primary first), so the caller can render the new assignment without a
   * second request.
   */
  reassignCustomer: async (
    customerId: string,
    request: ReassignCustomerRequest,
  ): Promise<ReassignCustomerResponse> => {
    const url = endpoints.customers.reassign.replace(
      "{id}",
      encodeURIComponent(customerId),
    );
    const { data } = await apiClient.patch<ReassignCustomerResponse>(
      url,
      request,
    );
    return data;
  },

  /**
   * Spec 39 (**C-2**): assign ONE officer to MANY customers, in ONE call.
   *
   * This used to fan out over the single-customer route, sequentially. The
   * bulk route now exists and puts each move through that same logic, so the
   * region rule, the CustomerOfficer bookkeeping (chat and tickets follow the
   * assignment) and the ASSIGNMENT notification are all unchanged.
   *
   * Not all-or-nothing: one customer failing leaves the rest assigned.
   *
   * A customer that ALREADY held the requested officer comes back in
   * `succeeded`, so re-running a half-finished batch does not look broken.
   * That is the server's behaviour on this route only - the single route still
   * answers 409 ALREADY_ASSIGNED, which is why `reassignCustomer` still needs
   * its own handling of that case.
   *
   * BA-2 (spec 43): a REGIONAL_ADMIN may call this, scoped to their own region
   * on both sides. The two failures are shaped differently on purpose:
   *
   *   - the RECEIVING OFFICER is checked ONCE. Naming one outside their region
   *     means the whole call is wrong, not that eighty items each failed
   *     identically, so it REJECTS with 403 REGION_NOT_ALLOWED and writes
   *     nothing. That reaches the caller's `onError`, not `failed[]`.
   *   - each CUSTOMER is checked per item, so a partly-valid selection still
   *     moves what it can - the point of the envelope.
   *
   * NOTE an out-of-region customer answers REGION_NOT_ALLOWED for a regional
   * admin but OFFICER_NOT_FOUND for an ADMIN: for one the failure is "that
   * distributor is not yours", for the other it is genuinely "this officer is
   * not valid for this customer". Anything branching on the code must handle
   * both; nothing here does, because the API's own `message` is rendered.
   */
  bulkReassign: async (
    customerIds: string[],
    request: ReassignCustomerRequest,
  ): Promise<BulkReassignCustomersResponse> => {
    const unique = Array.from(new Set(customerIds));

    const body: BulkReassignCustomersRequest = {
      customerIds: unique,
      newOfficerId: request.newOfficerId,
    };
    const { data } = await apiClient.patch(
      endpoints.customers.bulkReassign,
      body,
    );

    return {
      succeeded: safeArray<string>(data?.succeeded),
      failed: safeArray<BulkCustomerFailure>(data?.failed),
    };
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
