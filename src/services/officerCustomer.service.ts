/**
 * Officer Customer Service
 * Handles all officer customer data API calls
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { readUploadedUrl } from "@/utils/upload";
import {
  DistributorOverview,
  OrdersResponse,
  InvoicesResponse,
  StockResponse,
  WaybillsResponse,
  OfficerTicketsResponse,
  TicketThread,
  SendTicketReplyRequest,
  FileUploadResponse,
  TicketStatusUpdateResponse,
  UploadFolder,
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
   * Get tickets assigned to the current officer
   */
  getOfficerTickets: async (
    page: number = 1,
    pageSize: number = 20,
  ): Promise<OfficerTicketsResponse> => {
    const response = await apiClient.get<OfficerTicketsResponse>(
      endpoints.officerCustomers.list,
      {
        params: { page, pageSize },
      },
    );
    return response.data;
  },

  /**
   * Get ticket thread for a ticket
   */
  getTicketThread: async (ticketId: string): Promise<TicketThread> => {
    const url = endpoints.officerCustomers.tickets.replace("{id}", ticketId);
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
   * Update a ticket status
   */
  updateTicketStatus: async (
    ticketId: string,
    status: string,
  ): Promise<TicketStatusUpdateResponse> => {
    const url = endpoints.officerCustomers.status.replace("{id}", ticketId);
    const response = await apiClient.patch<TicketStatusUpdateResponse>(url, {
      status,
    });
    return response.data;
  },

  /**
   * Upload a file for ticket attachment
   */
  uploadFile: async (
    file: File,
    folder: UploadFolder = "ticket-attachments",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);

    // folder must be on the query string - see chat.service.uploadFile
    const url = `${endpoints.uploads.file}?folder=${encodeURIComponent(folder)}`;
    const response = await apiClient.post<{ url: string }>(url, formData);

    return readUploadedUrl(response?.data);
  },
};
