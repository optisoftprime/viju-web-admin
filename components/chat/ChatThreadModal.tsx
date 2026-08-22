"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button, Text } from "@/components/common";
import MessageCard from "./MessageCard";
import {
  useChatHistory,
  useSendMessage,
  useFileUpload,
} from "@/hooks/api/useChat";
import { getErrorMessage } from "@/utils/apiError";
import { safeArray, safeText } from "@/utils/safe";
import { resolveSenderLabel } from "@/utils/sender";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import type { AuditChatMessage, ChatMessage } from "@/lib/api/types";
import AttachmentIcon from "@/assets/icons/attachment.svg";
import Image from "next/image";

interface ChatThreadModalProps {
  open: boolean;
  onClose: () => void;
  /** Portal id of the customer on the other side of the conversation */
  customerId: string | null;
  customerName?: string;
  /** The account officer the audit row recorded this conversation against */
  officerName?: string;
  region?: string;
  /**
   * Messages the audit row already carried. Rendered while the live thread
   * loads, and kept as the only content if the live route is not open to this
   * role - the conversation stays readable either way.
   */
  fallbackMessages?: AuditChatMessage[];
  /** Hides the composer for a reader who may only view the thread */
  canReply?: boolean;
}

/** One thread entry, whichever source it came from */
interface ThreadMessage {
  id: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
  isStaff: boolean;
  /** "Admin", "Regional Admin", "Account Officer" or the customer's name */
  senderLabel: string;
}

interface SenderLookup {
  viewer: { id?: string | null; role?: string | null } | null;
  customerName?: string;
  /** The officer the audit row recorded the conversation against */
  officerName?: string;
}

const toThreadMessages = (
  messages: Array<ChatMessage | AuditChatMessage>,
  lookup: SenderLookup,
): ThreadMessage[] =>
  messages.map((message, index) => ({
    id: safeText(message?.id, `message-${index}`),
    content: safeText(message?.content, ""),
    attachmentUrl: message?.attachmentUrl ?? null,
    createdAt: safeText(message?.createdAt, ""),
    isStaff: message?.senderType === "STAFF",
    // A staff message names the role that wrote it. The audit row groups by
    // (customer, officer), so its own officer name is the last fallback -
    // an admin's reply is recorded as a separate row with a separate name.
    senderLabel: resolveSenderLabel({
      senderType: message?.senderType,
      // staff.id first: on a customer row `staffId` is the recipient, not
      // the author, so the block is the only trustworthy identity
      staffId: message?.staff?.id ?? message?.staffId,
      staffRole: message?.staff?.role,
      staffName: message?.staff?.name ?? lookup.officerName,
      viewer: lookup.viewer,
      customerName: lookup.customerName,
    }),
  }));

/**
 * Chat Thread Modal
 *
 * Opened from a row on the admin Interaction Audit "Chat" tab. It shows the
 * conversation between one customer and one account officer, and lets an
 * admin or regional admin reply into it exactly as the officer would -
 * POST /chat/{receiverId}, addressed to the customer.
 *
 * `ADMIN` is authorised on both routes for any customer and `REGIONAL_ADMIN`
 * for their own region, so the composer is always available - a failure here
 * is a real failure, not a permission the role lacks.
 *
 * The live history (GET /chat/{otherUserId}) is the authority; the audit row's
 * own messages are the initial paint while it loads, so the conversation is
 * readable immediately.
 *
 * NOTE the chat audit groups by (customer, officer), so an admin's reply is
 * attributed to the admin and shows up as a SECOND conversation row for that
 * customer. That is deliberate - it records who actually answered.
 */
export default function ChatThreadModal({
  open,
  onClose,
  customerId,
  customerName,
  officerName,
  region,
  fallbackMessages,
  canReply = true,
}: ChatThreadModalProps) {
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shouldQuery = open && Boolean(customerId);

  const {
    data: liveMessages,
    isLoading,
    error,
  } = useChatHistory(shouldQuery ? customerId : null);

  const { mutate: sendMessage } = useSendMessage(customerId || "");
  const { mutate: uploadFile } = useFileUpload();

  /**
   * The live thread wins whenever it resolved; the audit copy is the initial
   * paint while it loads, and what is left on screen if it fails outright.
   */
  const messages: ThreadMessage[] = useMemo(() => {
    const lookup: SenderLookup = { viewer: user, customerName, officerName };
    const live = safeArray<ChatMessage>(liveMessages);
    if (!error && !isLoading) return toThreadMessages(live, lookup);
    if (!error && live.length > 0) return toThreadMessages(live, lookup);
    return toThreadMessages(
      safeArray<AuditChatMessage>(fallbackMessages),
      lookup,
    );
  }, [liveMessages, error, isLoading, fallbackMessages, user, customerName, officerName]);

  // Sending is authorised for every role that can open this modal
  const canCompose = canReply && Boolean(customerId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /** Closing discards the draft, so the next conversation opens clean */
  const handleClose = () => {
    setMessageInput("");
    setAttachmentUrl(null);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploadingFile(true);
    uploadFile(
      { file, folder: "chat-attachments" },
      {
        onSuccess: (url) => {
          setAttachmentUrl(url);
          setIsUploadingFile(false);
          input.value = "";
        },
        onError: (uploadError) => {
          toast.error(getErrorMessage(uploadError, "Failed to upload file"));
          setIsUploadingFile(false);
        },
      },
    );
  };

  const handleSend = () => {
    if (!messageInput.trim() || !customerId || isSubmitting || isUploadingFile) {
      return;
    }

    setIsSubmitting(true);
    sendMessage(
      { content: messageInput, attachmentUrl: attachmentUrl || undefined },
      {
        onSuccess: () => {
          setMessageInput("");
          setAttachmentUrl(null);
          setIsSubmitting(false);
        },
        onError: (sendError) => {
          setIsSubmitting(false);
          toast.error(getErrorMessage(sendError, "Failed to send message"));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-2xl">
      <div className="w-full">
        {/* Header */}
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            {safeText(customerName, "Customer")}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            {officerName
              ? `Account officer: ${officerName}`
              : "No account officer recorded"}
            {region ? ` - ${region}` : ""}
          </Text>
        </div>

        {/* A genuine failure - error bodies are { message, code, statusCode }
            and the message is safe to display, so show what the API said
            rather than guessing at a cause */}
        {!isLoading && error && (
          <div className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
            <Text variant="small" weight="medium" color="muted">
              {getErrorMessage(
                error,
                "The live conversation could not be loaded.",
              )}{" "}
              Showing the recorded messages from the audit trail.
            </Text>
          </div>
        )}

        {/* Messages */}
        <div className="mt-4 h-96 overflow-y-auto rounded-lg bg-white p-4 space-y-2 border border-muted/15">
          {isLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <Text variant="caption" color="muted">
                Loading messages...
              </Text>
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <Text variant="caption" color="muted">
                No messages in this conversation yet.
              </Text>
            </div>
          )}

          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              timestamp={
                message.createdAt
                  ? new Date(message.createdAt).toLocaleString()
                  : ""
              }
              isMine={message.isStaff}
              attachmentUrl={message.attachmentUrl ?? undefined}
              senderLabel={message.senderLabel}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        {canCompose && (
          <div className="mt-4 space-y-2">
            {attachmentUrl && (
              <div className="flex items-center justify-between bg-[#F0F5F9] p-3 rounded-lg">
                <Text variant="small" color="muted">
                  Attachment added
                </Text>
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="text-primary font-bold"
                  aria-label="Remove attachment"
                >
                  &#10005;
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploadingFile || isSubmitting}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile || isSubmitting}
                aria-label="Attach an image"
                className="shrink-0 cursor-pointer hover:opacity-70 transition disabled:opacity-50"
              >
                <Image
                  src={AttachmentIcon}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-auto"
                />
              </button>

              <input
                type="text"
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !isSubmitting &&
                    !isUploadingFile
                  ) {
                    handleSend();
                  }
                }}
                placeholder="Send message"
                disabled={isSubmitting || isUploadingFile}
                className="flex-1 bg-[#ECEDEE] p-3 rounded-xl text-[13px] text-muted outline-none border border-muted/10 disabled:opacity-50"
              />

              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={
                  isSubmitting || isUploadingFile || !messageInput.trim()
                }
                className="bg-linear-to-r from-primary via-orange to-primary whitespace-nowrap"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
