/**
 * Notification Hooks - React Query
 * Reusable hooks for the notification bell and sidebar
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { NotificationsParams } from "@/lib/api/types";
import { getErrorMessage } from "@/utils/apiError";

/**
 * List my notifications with the unread badge count
 * Shared query key, so the bell and the sidebar reuse a single request
 */
export const useNotifications = (params: NotificationsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(params as Record<string, unknown>),
    queryFn: () =>
      notificationService.getMyNotifications({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};

/**
 * Mark every notification as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(error) || "Failed to mark notifications as read",
      );
    },
  });
};

/**
 * Mark a single notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(error) || "Failed to mark notification as read",
      );
    },
  });
};
