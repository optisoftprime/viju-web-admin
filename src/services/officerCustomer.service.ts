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
  OrderDetail,
  StockResponse,
  PortfolioStockResponse,
  WaybillsResponse,
  ErpWaybillDetail,
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
   * Get distributor invoices - PAGINATED.
   *
   * `pageSize`, not `limit`; anything above 200 is clamped and `meta.pageSize`
   * reports what was actually applied. Rows carry no line items - open one
   * with `getInvoiceDetail`.
   */
  getInvoices: async (
    customerId: string,
    params: {
      page?: number;
      pageSize?: number;
      /** Order id or product name */
      search?: string;
      /** YYYY-MM-DD, inclusive */
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<InvoicesResponse> => {
    const url = endpoints.officerCustomers.invoices.replace("{id}", customerId);
    const response = await apiClient.get<InvoicesResponse>(url, {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params.startDate ? { startDate: params.startDate } : {}),
        ...(params.endDate ? { endDate: params.endDate } : {}),
      },
    });
    return response.data;
  },

  /**
   * One order with its merged product lines.
   *
   * `invoiceId` is the `id` from a list row, not the `erpId`. Scope is checked
   * twice: the distributor must be in the caller's portfolio AND the order
   * must belong to that distributor - pairing an outside order with an inside
   * customer is a 404.
   */
  getInvoiceDetail: async (
    customerId: string,
    invoiceId: string,
  ): Promise<OrderDetail> => {
    const url = endpoints.officerCustomers.invoiceDetail
      .replace("{id}", encodeURIComponent(customerId))
      .replace("{invoiceId}", encodeURIComponent(invoiceId));
    const response = await apiClient.get<OrderDetail>(url);
    return response.data;
  },

  /**
   * Get one distributor's ERP stock balance.
   *
   * The date window selects orders PLACED in it, minus whatever has since been
   * delivered against them - so two adjacent windows do not add up to the
   * unfiltered total, and a filtered figure must never be presented as a slice
   * of the whole. `startDate` after `endDate` is a 400.
   */
  getStock: async (
    customerId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<StockResponse> => {
    const url = endpoints.officerCustomers.stock.replace("{id}", customerId);
    const response = await apiClient.get<StockResponse>(url, {
      params: {
        ...(params.startDate ? { startDate: params.startDate } : {}),
        ...(params.endDate ? { endDate: params.endDate } : {}),
      },
    });
    return response.data;
  },

  /**
   * The same balance across the officer's whole portfolio.
   *
   * Products are grouped ACROSS distributors - one held by several appears
   * once, with the quantities added. Deliberately NOT paginated: it is one row
   * per product still held, which is short even across a full book.
   */
  getPortfolioStock: async (
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<PortfolioStockResponse> => {
    const response = await apiClient.get<PortfolioStockResponse>(
      endpoints.officerCustomers.portfolioStock,
      {
        params: {
          ...(params.startDate ? { startDate: params.startDate } : {}),
          ...(params.endDate ? { endDate: params.endDate } : {}),
        },
      },
    );
    return response.data;
  },

  /**
   * Get a distributor's ERP goods-movement documents.
   *
   * NOT this portal's loading requests - those moved to
   * /officers/loading-requests along with the assign and cancel actions.
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

  /** One ERP document with its item lines. `docNo`, not an id. */
  getWaybillDetail: async (
    customerId: string,
    docNo: string,
  ): Promise<ErpWaybillDetail> => {
    const url = endpoints.officerCustomers.waybillDetail
      .replace("{id}", encodeURIComponent(customerId))
      .replace("{docNo}", encodeURIComponent(docNo));
    const response = await apiClient.get<ErpWaybillDetail>(url);
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
