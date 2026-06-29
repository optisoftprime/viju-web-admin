"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Text, Button } from "@/components/common";
import NotificationItem from "@/components/NotificationItem";

interface Notification {
  id: string;
  title: string;
  timestamp: string;
  isRead: boolean;
  isActionable: boolean;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New officer account created: Olamide Adewale",
    timestamp: "3hrs ago",
    isRead: false,
    isActionable: false,
  },
  {
    id: "2",
    title: "Customer reassigned: John Akpan Ademola Caleb Johnson",
    timestamp: "Yesterday",
    isRead: false,
    isActionable: true,
  },
  {
    id: "3",
    title: "New broadcast message sent to Lagos region",
    timestamp: "2 days ago",
    isRead: true,
    isActionable: false,
  },
  {
    id: "4",
    title: "Flyer updated: New product promotion",
    timestamp: "3 days ago",
    isRead: true,
    isActionable: false,
  },
  {
    id: "5",
    title: "System maintenance completed successfully",
    timestamp: "1 week ago",
    isRead: true,
    isActionable: false,
  },
];

export default function NotificationSidebar({
  isOpen,
  onClose,
}: NotificationSidebarProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

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

  const handleMarkAllRead = () => {
    setNotifications(
      notifications.map((notif) => ({
        ...notif,
        isRead: true,
      })),
    );
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
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
      <div className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted/20">
          <Text variant="h3" weight="bold">
            Notifications
          </Text>

          <div className="flex items-center gap-4">
            {/* Mark All Read */}
            <button
              onClick={handleMarkAllRead}
              className="text-statusblue hover:text-statusblue/80 text-sm font-medium transition-colors"
            >
              Mark all read
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
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                title={notification.title}
                timestamp={notification.timestamp}
                isRead={notification.isRead}
                isActionable={notification.isActionable}
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" color="muted">
                No notifications
              </Text>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
