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
  WaybillsResponse,
  TicketThread,
  SendTicketReplyRequest,
  FileUploadResponse,
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

  /**
   * Get distributor waybills
   */
  getWaybills: async (
    customerId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<WaybillsResponse> => {
    const url = endpoints.officerCustomers.waybills.replace("{id}", customerId);
    const response = await apiClient.get<WaybillsResponse>(url, {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get ticket thread for a distributor
   */
  getTicketThread: async (distributorId: string): Promise<TicketThread> => {
    const url = endpoints.officerCustomers.tickets.replace(
      "{id}",
      distributorId,
    );
    const response = await apiClient.get<TicketThread>(url);
    return response.data;
  },

  /**
   * Send a reply to a ticket
   */
  sendTicketReply: async (
    ticketId: string,
    request: SendTicketReplyRequest,
  ): Promise<TicketThread> => {
    const url = endpoints.officerCustomers.sendReply.replace("{id}", ticketId);
    const response = await apiClient.post<TicketThread>(url, request);
    return response.data;
  },

  /**
   * Upload a file for ticket attachment
   */
  uploadFile: async (
    file: File,
    folder: string = "ticket-attachments",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const url = endpoints.uploads.file;
    const response = await apiClient.post<{ url: string }>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.url;
  },
};
