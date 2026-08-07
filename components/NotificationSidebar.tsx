"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Text } from "@/components/common";
import NotificationItem from "@/components/NotificationItem";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/api/useNotification";
import { AppNotification } from "@/lib/api/types";
import { formatRelativeTime } from "@/src/utils/formatter";
import { getErrorMessage } from "@/src/utils/apiError";
import { toast } from "sonner";

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSidebar({
  isOpen,
  onClose,
}: NotificationSidebarProps) {
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useNotifications({ page: 1, pageSize: 20 });

  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  const notifications: AppNotification[] = notificationsData?.data ?? [];
  const unreadCount = notificationsData?.unread ?? 0;

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Surface a fetch failure on a toast while the panel is open
  useEffect(() => {
    if (isOpen && error) {
      toast.error(getErrorMessage(error) || "Failed to load notifications");
    }
  }, [isOpen, error]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) return;
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification: AppNotification) => {
    // Already read notifications do not need another round trip
    if (notification.isRead) return;
    markReadMutation.mutate(notification.id);
  };

  // Don't render if sidebar is closed
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Notification Sidebar */}
      <div className="fixed top-0 right-0 h-screen w-auto md:w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted/20">
          <div className="flex items-center gap-2">
            <Text variant="h3" weight="bold">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Mark All Read */}
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              className="text-statusblue hover:text-statusblue/80 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {markAllReadMutation.isPending ? "Marking..." : "Mark all read"}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" color="muted">
                Loading notifications...
              </Text>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full px-6">
              <Text variant="body" color="muted" className="text-center">
                Could not load your notifications. Please try again.
              </Text>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                title={notification.content?.trim() || "New notification"}
                timestamp={formatRelativeTime(notification.createdAt)}
                isRead={notification.isRead}
                onClick={() => handleNotificationClick(notification)}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" color="muted">
                You have no notifications yet
              </Text>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
