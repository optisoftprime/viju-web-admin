"use client";

import { ArrowRight } from "lucide-react";
import { Text } from "@/components/common";

interface NotificationItemProps {
  id: string;
  title: string;
  timestamp: string;
  isRead: boolean;
  isActionable?: boolean;
  onClick?: () => void;
}

export default function NotificationItem({
  id,
  title,
  timestamp,
  isRead,
  isActionable = false,
  onClick,
}: NotificationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-muted/20 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isRead ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        {!isRead && (
          <div className="w-2 h-2 rounded-full bg-statusblue mt-2 shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Text variant="small" weight="medium" className="mb-1">
            {title}
          </Text>
          <Text variant="caption" color="muted">
            {timestamp}
          </Text>
        </div>

        {/* Actionable Arrow */}
        {isActionable && (
          <div className="shrink-0">
            <ArrowRight className="w-4 h-4 text-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
