/**
 * Dashboard Service\n * Handles all dashboard-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeList } from "@/utils/safe";
import {
  AdminDashboardStats,
  OfficerDashboardStats,
  RegionalDashboardStats,
  OfficerCustomer,
  OfficerCustomersParams,
  RegionalAdminDashboardResponse,
} from "@/lib/api/types";

/**
 * Build the officer customer query.
 *
 * Only truthy flags are sent, so the "All" tab omits every filter, and
 * `sortOrder` only travels alongside a `sortBy` - the API applies it only in
 * that pairing.
 *
 * The response is always the standard `{ data, meta }` envelope (AO-P1), read
 * through `safeList` so an unexpected shape still yields something renderable
 * rather than throwing mid-render.
 */
const customerListRequest = async (params: OfficerCustomersParams = {}) => {
  const { page, pageSize, search, overdue, activeTickets, unreadMessages } =
    params;

  const response = await apiClient.get(endpoints.dashboard.officerCustomers, {
    params: {
      ...(page ? { page } : {}),
      ...(pageSize ? { pageSize } : {}),
      ...(search ? { search } : {}),
      ...(overdue ? { overdue: true } : {}),
      ...(activeTickets ? { activeTickets: true } : {}),
      ...(unreadMessages ? { unreadMessages: true } : {}),
      ...(params.sortBy
        ? {
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === "asc" ? "asc" : "desc",
          }
        : {}),
    },
  });

  return safeList<OfficerCustomer>(response?.data);
};

export const dashboardService = {
  /**
   * Get admin dashboard statistics
   */
  getAdminDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await apiClient.get(endpoints.dashboard.adminDashboard);
    return data;
  },

  /**
   * Get officer dashboard statistics
   */
  getOfficerDashboard: async (): Promise<OfficerDashboardStats> => {
    const { data } = await apiClient.get(endpoints.dashboard.officerDashboard);
    return data;
  },

  /**
   * Get regional admin dashboard statistics.
   *
   * A REGIONAL_ADMIN must NOT send `region` - the server derives it from the
   * token and returns 403 if a different one is passed. Only an org-wide ADMIN
   * passes a region, and for them it is required.
   *
   * @param region - Region enum value, see @/constants/regions (ADMIN only)
   */
  getRegionalDashboard: async (
    region?: string,
  ): Promise<RegionalAdminDashboardResponse> => {
    const { data } = await apiClient.get(
      endpoints.dashboard.regionalDashboard,
      region ? { params: { region } } : undefined,
    );
    return data;
  },

  /**
   * Get officer customers list
   * Only truthy flags are sent, so the "All" tab omits every filter
   */
  getOfficerCustomers: async (
    params: OfficerCustomersParams = {},
  ): Promise<OfficerCustomer[]> => {
    const { data } = await customerListRequest(params);
    return data;
  },

  /**
   * The same officer customer list, but keeping the pagination envelope.
   *
   * `getOfficerCustomers` drops `meta` because the dashboard table slices
   * client-side. The All Customers modal pages server-side, so it needs the
   * totals - and an officer cannot call GET /admin/customers at all, which is
   * why the modal cannot simply reuse the admin route.
   */
  getOfficerCustomersPage: async (params: OfficerCustomersParams = {}) =>
    customerListRequest(params),

  /**
   * AO-C1: the distributor who has been waiting longest on an unread message.
   *
   * One request instead of scraping the notification feed: ask for the unread
   * list, oldest message first, one row. `undefined` means nothing is genuinely
   * waiting - and unlike the notification feed this does not go stale when the
   * officer marks the bell read, because it reads Message.readAt.
   */
  getNextUnreadCustomer: async (): Promise<OfficerCustomer | undefined> => {
    const { data } = await customerListRequest({
      unreadMessages: true,
      sortBy: "lastMessageAt",
      sortOrder: "asc",
      pageSize: 1,
    });
    return data[0];
  },
};
