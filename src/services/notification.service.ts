/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  AppNotification,
  NotificationsParams,
  NotificationsResponse,
} from "@/lib/api/types";

export const notificationService = {
  /**
   * List my notifications (web bell + mobile)
   * Returns the most recent notifications plus the unread badge count
   */
  getMyNotifications: async (
    params: NotificationsParams = {},
  ): Promise<NotificationsResponse> => {
    const { data } = await apiClient.get(endpoints.notifications.list, {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    });
    return data;
  },

  /**
   * Mark every notification as read
   */
  markAllAsRead: async (): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.patch(endpoints.notifications.readAll);
    return data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<AppNotification> => {
    const { data } = await apiClient.patch(
      endpoints.notifications.read.replace("{id}", id),
    );
    return data;
  },
};
