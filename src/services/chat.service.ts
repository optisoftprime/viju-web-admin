/**
 * Chat Service
 * Handles all chat API calls for OFFICER role
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { readUploadedUrl } from "@/utils/upload";
import { safeList, type SafeMeta } from "@/utils/safe";
import {
  ChatMessage,
  MarkChatReadResponse,
  OfficerChatThread,
  OfficerChatThreadsParams,
  SendMessageRequest,
  FileUploadResponse,
  UploadFolder,
} from "@/lib/api/types";

export const chatService = {
  /**
   * Spec 41 (CH-3): the signed-in officer's conversations.
   *
   * Returns ONLY accounts with a thread, already ordered by recency across the
   * whole portfolio and then paged - so there is nothing to filter or re-sort
   * here. The screen used to pull 100 customers, drop the ones with no
   * `lastMessageAt` and re-sort in the browser; all three are gone.
   *
   * Read-only: listing does not mark anything read.
   */
  getOfficerChats: async (
    params: OfficerChatThreadsParams = {},
  ): Promise<{ data: OfficerChatThread[]; meta: SafeMeta }> => {
    const { data } = await apiClient.get(endpoints.chat.officerThreads, {
      params: {
        ...(params.page ? { page: params.page } : {}),
        ...(params.pageSize ? { pageSize: params.pageSize } : {}),
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      },
    });

    return safeList<OfficerChatThread>(data);
  },

  /**
   * Fetch chat history with a specific user (distributor)
   */
  getChatHistory: async (otherUserId: string): Promise<ChatMessage[]> => {
    const url = endpoints.chat.history.replace("{otherUserId}", otherUserId);
    const response = await apiClient.get<ChatMessage[]>(url);
    return response.data;
  },

  /**
   * C-1: mark a customer's inbound messages read for staff.
   *
   * `GET /chat/{customerId}` already does this as a side effect, so this is
   * only for clearing the count without pulling the thread. Idempotent - a
   * second call returns `markedRead: 0`.
   *
   * Authorisation matches reading the thread: an OFFICER must be assigned to
   * the customer, a REGIONAL_ADMIN is held to their own region, an ADMIN
   * reaches every region.
   */
  markChatRead: async (customerId: string): Promise<MarkChatReadResponse> => {
    const url = endpoints.chat.markRead.replace(
      "{customerId}",
      encodeURIComponent(customerId),
    );
    const response = await apiClient.patch<MarkChatReadResponse>(url);
    return response.data;
  },

  /**
   * Send a message to a user (distributor)
   */
  sendMessage: async (
    receiverId: string,
    request: SendMessageRequest,
  ): Promise<ChatMessage> => {
    const url = endpoints.chat.sendMessage.replace("{receiverId}", receiverId);
    const response = await apiClient.post<ChatMessage>(url, request);
    return response.data;
  },

  /**
   * Upload a file and return its public URL.
   *
   * `folder` goes in the QUERY STRING. The API documents it as "query param
   * OR form field", but it is declared `in: query, required: true`, so that is
   * what the validator reads - sending it only as a form field fails with
   * "folder must be one of the following values: ...". It is also included in
   * the body, which the endpoint accepts and which keeps the request
   * self-describing.
   *
   * Content-Type is deliberately left unset: axios strips it for FormData so
   * the browser can supply the boundary the multipart parser needs.
   */
  uploadFile: async (
    file: File,
    folder: UploadFolder = "chat-attachments",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);

    const url = `${endpoints.uploads.file}?folder=${encodeURIComponent(folder)}`;
    const response = await apiClient.post<FileUploadResponse>(url, formData);

    // Storage outages return a placeholder:// URL with a 2xx rather than an
    // error, so an unusable URL has to be rejected here or it gets saved
    // against the record
    return readUploadedUrl(response?.data);
  },
};
