"use client";

import { Text } from "@/components/common";

interface MessageCardProps {
  content: string;
  timestamp: string;
  isMine?: boolean;
}

export default function MessageCard({
  content,
  timestamp,
  isMine = false,
}: MessageCardProps) {
  const bgColor = isMine ? "bg-[#FFD4D4]" : "bg-[#F3F5F7]";
  const justifyClass = isMine ? "justify-end" : "justify-start";

  return (
    <div className={`flex ${justifyClass} my-4`}>
      <div className={`${bgColor} p-3 rounded-lg space-y-2 max-w-xs`}>
        <Text variant="caption" weight="medium" color="foreground">
          {content}
        </Text>
        <Text variant="caption" weight="medium" color="muted">
          {timestamp}
        </Text>
      </div>
    </div>
  );
}
