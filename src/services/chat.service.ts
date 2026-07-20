/**
 * Chat Service
 * Handles all chat API calls for OFFICER role
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  ChatMessage,
  SendMessageRequest,
  FileUploadResponse,
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
   * Upload a file for chat attachment
   */
  uploadFile: async (
    file: File,
    folder: string = "chat-attachments",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const url = endpoints.uploads.file;
    const response = await apiClient.post<FileUploadResponse>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.url;
  },
};
