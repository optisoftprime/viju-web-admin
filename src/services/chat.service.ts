/**
 * Chat Service
 * Handles all chat API calls for OFFICER role
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { readUploadedUrl } from "@/utils/upload";
import {
  ChatMessage,
  SendMessageRequest,
  FileUploadResponse,
  UploadFolder,
} from "@/lib/api/types";

export const chatService = {
  /**
   * Fetch chat history with a specific user (distributor)
   */
  getChatHistory: async (otherUserId: string): Promise<ChatMessage[]> => {
    const url = endpoints.chat.history.replace("{otherUserId}", otherUserId);
    const response = await apiClient.get<ChatMessage[]>(url);
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
