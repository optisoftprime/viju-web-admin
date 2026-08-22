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
  SendTicketReplyResponse,
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
    filters: { customerId?: string | null; status?: string[] } = {},
  ): Promise<OfficerTicketsResponse> => {
    const { customerId, status } = filters;
    // Blanks are dropped - an empty list means "every status", which is the
    // API default and must not go on the wire as an empty value
    const statuses = (status ?? []).filter(Boolean);

    const response = await apiClient.get<OfficerTicketsResponse>(
      endpoints.officerCustomers.list,
      {
        params: {
          page,
          pageSize,
          // AO-T1: both applied in SQL, so meta.total counts the filtered set
          ...(customerId ? { customerId } : {}),
          ...(statuses.length ? { status: statuses.join(",") } : {}),
        },
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
   * Send a reply to a ticket.
   *
   * The 201 body is the WHOLE thread with the new reply appended, plus a
   * `reply` key for the row just created - so `data.id` is the ticket id, not
   * the reply id. The caller writes this straight into the thread cache
   * instead of refetching.
   */
  sendTicketReply: async (
    ticketId: string,
    request: SendTicketReplyRequest,
  ): Promise<SendTicketReplyResponse> => {
    const url = endpoints.officerCustomers.sendReply.replace("{id}", ticketId);
    const response = await apiClient.post<SendTicketReplyResponse>(
      url,
      request,
    );
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
    // The body is the updated ticket - a superset of { id, status, updatedAt },
    // which is all the status control binds to
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
