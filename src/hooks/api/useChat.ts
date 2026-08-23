/**
 * Chat Hooks - React Query
 * Reusable hooks for chat operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { SendMessageRequest,
  UploadFolder,
} from "@/lib/api/types";

/**
 * Fetch chat history with a specific user.
 *
 * C-1: this request marks the customer's messages read for staff, server-side,
 * so the dashboard's "Unread Messages" tile is stale the moment it resolves.
 * It is invalidated here rather than left to its own refetch interval - a
 * counter that still says 1 after the conversation has been read is worse than
 * no counter at all.
 *
 * The invalidation lives in the queryFn rather than an effect: it fires once
 * per actual fetch, not on every render that happens to read the cache.
 *
 * Note the count is SHARED across staff, not a per-viewer inbox: once any
 * admin opens ADLAK's thread it is read, and the tile falls for all of them.
 */
export const useChatHistory = (otherUserId: string | null) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["chatHistory", otherUserId],
    queryFn: async () => {
      const messages = await chatService.getChatHistory(otherUserId!);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      return messages;
    },
    enabled: !!otherUserId,
    // Short, so re-opening a thread shows anything that arrived meanwhile
    staleTime: 30 * 1000,
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
      // A reply can move the unread counters either way, so the tiles refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

/**
 * C-1: clear a customer's unread messages for staff.
 *
 * NOT needed to make the dashboard tile fall - `GET /chat/{customerId}` marks
 * the thread read on its own, and `useChatHistory` already invalidates the
 * tile when it resolves. This is for the two cases that fetch does not cover:
 * dismissing a conversation from a list without opening it, and dropping the
 * count instantly rather than waiting on the thread request.
 *
 * `markedRead` is the number the SERVER cleared, which is what makes an
 * optimistic decrement safe. Idempotent - a second call returns 0.
 */
export const useMarkChatRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => chatService.markChatRead(customerId),
    onSuccess: (result) => {
      // Nothing moved, so nothing to refresh
      if (!result?.markedRead) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

/**
 * Upload a file for chat attachment
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: (data: { file: File; folder?: UploadFolder }) =>
      chatService.uploadFile(data.file, data.folder),
  });
};
