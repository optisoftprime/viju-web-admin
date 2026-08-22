"use client";

import { Text } from "@/components/common";

interface MessageCardProps {
  content: string;
  timestamp: string;
  isMine?: boolean;
  attachmentUrl?: string;
  /**
   * Who wrote it - "Admin", "Regional Admin", "Account Officer" or the
   * customer's name. Resolved by resolveSenderLabel(); omitted the card
   * simply carries no attribution rather than a misleading one.
   */
  senderLabel?: string;
}

export default function MessageCard({
  content,
  timestamp,
  isMine = false,
  attachmentUrl,
  senderLabel,
}: MessageCardProps) {
  const bgColor = isMine ? "bg-[#FFD4D4]" : "bg-[#F3F5F7]";
  const justifyClass = isMine ? "justify-end" : "justify-start";

  return (
    <div className={`flex ${justifyClass} my-4`}>
      <div className={`${bgColor} p-3 rounded-lg space-y-2 max-w-xs`}>
        {senderLabel && (
          <Text variant="caption" weight="semibold" color="muted">
            {senderLabel}
          </Text>
        )}
        <Text variant="caption" weight="medium" color="foreground">
          {content}
        </Text>
        {attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block underline text-blue-600 hover:text-blue-800 text-sm"
          >
            View Attachment
          </a>
        )}
        <Text variant="caption" weight="medium" color="muted" className="mt-2">
          {timestamp}
        </Text>
      </div>
    </div>
  );
}
