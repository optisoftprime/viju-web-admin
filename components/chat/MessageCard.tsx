"use client";

import { Text } from "@/components/common";
import AttachmentPreview from "@/components/common/AttachmentPreview";

interface MessageCardProps {
  content: string;
  /**
   * The clock only - "9:38 AM". The calendar day belongs on the divider above
   * the run of messages, not repeated on every bubble.
   */
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
        {/* Spec 43 - the picture itself, not the word "attachment" */}
        {attachmentUrl && (
          <AttachmentPreview url={attachmentUrl} size="sm" className="mt-1" />
        )}
        {/* Bottom-right, the way a messaging app tucks it under the text */}
        <Text
          variant="caption"
          weight="medium"
          color="muted"
          className="mt-2 block text-right"
        >
          {timestamp}
        </Text>
      </div>
    </div>
  );
}
