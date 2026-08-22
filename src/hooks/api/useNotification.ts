/**
 * Notification Hooks - React Query
 * Reusable hooks for the notification bell and sidebar
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { NotificationsParams, NotificationsResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/utils/apiError";
import { scopeNotifications } from "@/utils/notifications";
import { useAuthStore } from "@/store/auth.store";

/**
 * List my notifications with the unread badge count.
 * Shared query key, so the bell and the sidebar reuse a single request.
 *
 * N-1 settled the scoping at the source: a row is now written for exactly one
 * recipient, `staffId` is always the recipient and never the sender, and a
 * customer's own feed is filtered on `staffId: null`. So the server's `unread`
 * and the rows this panel can show are the same set - the badge reads
 * `unread` directly again rather than recounting.
 *
 * `scopeNotifications()` is kept as a belt-and-braces guard. It should never
 * fire now; if it ever does, `droppedByScope` says so rather than the badge
 * quietly disagreeing with the list.
 */
export const useNotifications = (params: NotificationsParams = {}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.notifications.list(params as Record<string, unknown>),
    queryFn: () =>
      notificationService.getMyNotifications({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
    select: (response: NotificationsResponse) => {
      const rows = Array.isArray(response?.data) ? response.data : [];
      const data = scopeNotifications(rows, user);

      return {
        ...response,
        data,
        unread: Number(response?.unread) || 0,
        /** Non-zero means the fan-out over-served - the guard caught it */
        droppedByScope: rows.length - data.length,
      };
    },
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
