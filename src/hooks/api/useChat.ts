/**
 * Chat Hooks - React Query
 * Reusable hooks for chat operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { SendMessageRequest } from "@/lib/api/types";

/**
 * Fetch chat history with a specific user
 */
export const useChatHistory = (otherUserId: string | null) => {
  return useQuery({
    queryKey: ["chatHistory", otherUserId],
    queryFn: () => chatService.getChatHistory(otherUserId!),
    enabled: !!otherUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Send a message to a user
 */
export const useSendMessage = (receiverId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SendMessageRequest) =>
      chatService.sendMessage(receiverId, request),
    onSuccess: () => {
      // Refetch chat history after sending message
      queryClient.invalidateQueries({
        queryKey: ["chatHistory", receiverId],
      });
    },
  });
};

/**
 * Upload a file for chat attachment
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: (data: { file: File; folder?: string }) =>
      chatService.uploadFile(data.file, data.folder),
  });
};
