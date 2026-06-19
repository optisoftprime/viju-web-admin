/**
 * Officer Customer Service
 * Handles all officer customer data API calls
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  DistributorOverview,
  OrdersResponse,
  InvoicesResponse,
  StockResponse,
} from "@/lib/api/types";

export const officerCustomerService = {
  /**
   * Get distributor overview
   */
  getOverview: async (customerId: string): Promise<DistributorOverview> => {
    const url = endpoints.officerCustomers.overview.replace("{id}", customerId);
    const response = await apiClient.get<DistributorOverview>(url);
    return response.data;
  },

  /**
   * Get distributor orders
   */
  getOrders: async (
    customerId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<OrdersResponse> => {
    const url = endpoints.officerCustomers.orders.replace("{id}", customerId);
    const response = await apiClient.get<OrdersResponse>(url, {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get distributor invoices
   */
  getInvoices: async (customerId: string): Promise<InvoicesResponse> => {
    const url = endpoints.officerCustomers.invoices.replace("{id}", customerId);
    const response = await apiClient.get<InvoicesResponse>(url);
    return response.data;
  },

  /**
   * Get distributor stock
   */
  getStock: async (customerId: string): Promise<StockResponse> => {
    const url = endpoints.officerCustomers.stock.replace("{id}", customerId);
    const response = await apiClient.get<StockResponse>(url);
    return response.data;
  },
};
