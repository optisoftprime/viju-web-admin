"use client";

import { useMemo, useState } from "react";
import { Button, Text } from "@/components/common";
import { TicketReply } from "@/lib/api/types";
import {
  useTicketThread,
  useSendTicketReply,
  useFileUpload,
  useUpdateTicketStatus,
} from "@/hooks/api/useOfficerCustomer";
import { TICKET_STATUS_OPTIONS } from "@/constants/tickets";
import { getErrorMessage } from "@/utils/apiError";
import { safeText } from "@/utils/safe";
import { resolveSenderLabel } from "@/utils/sender";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import AttachmentIcon from "@/assets/icons/attachment.svg";
import AttachmentPreview from "@/components/common/AttachmentPreview";
import Image from "next/image";

interface TicketThreadPanelProps {
  /** Portal id of the ticket. Null renders the empty state. */
  ticketId: string | null;
  /** Name shown when the thread has not resolved yet */
  customerName?: string;
  /**
   * Hides the status picker for a viewer who may only read the thread.
   * Defaults to on - an account officer, an admin and a regional admin all
   * carry the authority to move a ticket along.
   */
  canUpdateStatus?: boolean;
  /** Hides the composer for a read-only viewer */
  canReply?: boolean;
  /** Height of the scrolling message area, so a modal and a page can differ */
  className?: string;
}

/**
 * Ticket Thread Panel
 *
 * The whole ticket conversation - header, messages, status control and the
 * reply composer with its image attachment - with no opinion about the
 * container. `TicketDetailModal` puts it in a dialog for the officer and admin
 * screens; the regional admin Open Tickets page renders it straight onto the
 * page beside the ticket list.
 *
 * Every mutation is API-driven: the status select renders the ticket's own
 * status rather than local state, so a rejected change snaps back to whatever
 * the API still holds.
 */
export default function TicketThreadPanel({
  ticketId,
  customerName,
  canUpdateStatus = true,
  canReply = true,
  className = "h-96",
}: TicketThreadPanelProps) {
  const { user } = useAuthStore();
  const [replyContent, setReplyContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: ticketData, isLoading, error } = useTicketThread(ticketId);

  const { mutate: sendReply } = useSendTicketReply(ticketId || "");
  const { mutate: uploadFile } = useFileUpload();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTicketStatus();

  const handleStatusChange = (status: string) => {
    if (!ticketId || status === ticketData?.status) return;

    updateStatus(
      { ticketId, status },
      {
        // The mutation patches the cached thread, so the select settles on
        // the API's value without a refetch
        onSuccess: () => {
          toast.success("Ticket status updated");
        },
        onError: (statusError) => {
          toast.error(
            getErrorMessage(statusError, "Ticket status could not be updated"),
          );
        },
      },
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      { file, folder: "ticket-attachments" },
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

  const handleSendReply = () => {
    if (!replyContent.trim() || !ticketId || isSubmitting || isUploadingFile) {
      return;
    }

    setIsSubmitting(true);
    sendReply(
      { content: replyContent, attachmentUrl: attachmentUrl || undefined },
      {
        // The 201 body is the whole updated thread and the mutation writes it
        // straight into the cache, so the reply is on screen already
        onSuccess: () => {
          setReplyContent("");
          setAttachmentUrl(null);
          setIsSubmitting(false);
        },
        onError: (replyError) => {
          setIsSubmitting(false);
          toast.error(getErrorMessage(replyError, "Failed to send reply"));
        },
      },
    );
  };

  /** The opening description plus every reply, in one conversation order */
  const allMessages = useMemo(() => {
    if (!ticketData) return [];

    return [
      {
        id: ticketData.id,
        content: ticketData.description,
        senderType: "CUSTOMER" as const,
        senderName: ticketData.customer?.name || "Customer",
        timestamp: ticketData.createdAt,
        attachmentUrl: ticketData.attachmentUrl || null,
      },
      ...(ticketData.replies || []).map((reply: TicketReply) => ({
        id: reply.id,
        content: reply.content,
        senderType: reply.senderType as "CUSTOMER" | "STAFF",
        // A staff reply names the role that wrote it - "Admin", "Regional
        // Admin", "Account Officer" - never a flat "Staff"
        senderName: resolveSenderLabel({
          senderType: reply.senderType,
          staffId: reply.staff?.id ?? reply.staffId,
          staffRole: reply.staff?.role,
          staffName: reply.staff?.name,
          viewer: user,
          assignedOfficerId: ticketData.customer?.assignedOfficerId,
          customerName: ticketData.customer?.name,
        }),
        timestamp: reply.createdAt,
        attachmentUrl: reply.attachmentUrl || null,
      })),
    ];
  }, [ticketData, user]);

  if (!ticketId) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Text variant="caption" color="muted">
          Select a ticket to read the conversation.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-lg">
      {isLoading && (
        <div className={`flex items-center justify-center ${className}`}>
          <Text variant="caption" color="muted">
            Loading ticket details...
          </Text>
        </div>
      )}

      {/* Error bodies are { message, code, statusCode } - the message is safe
          to display, so show what the API actually said */}
      {!isLoading && error && (
        <div className={`flex items-center justify-center px-4 ${className}`}>
          <Text variant="caption" color="muted" className="text-center">
            {getErrorMessage(
              error,
              "Ticket details could not be loaded. Please try again.",
            )}
          </Text>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Ticket meta + status control - the one place a reader can move
              the ticket along without leaving the thread */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E0E0E0]">
            <div className="min-w-0">
              <Text variant="small" weight="bold" color="foreground">
                {safeText(ticketData?.subject, "Ticket")}
              </Text>
              <Text variant="caption" color="muted">
                {ticketData?.customer?.name || customerName || "Customer"}
                {ticketData?.category ? ` - ${ticketData.category}` : ""}
              </Text>
            </div>

            {canUpdateStatus && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`ticket-status-panel-${ticketId}`}
                  className="text-[12px] font-medium text-muted"
                >
                  Status
                </label>
                <select
                  id={`ticket-status-panel-${ticketId}`}
                  value={ticketData?.status || "OPEN"}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  disabled={isUpdatingStatus || !ticketData}
                  className="rounded-lg border border-[#D3D5D8] bg-white px-3 py-2 text-[12px] text-muted disabled:opacity-50"
                >
                  {TICKET_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className={`overflow-y-auto p-4 space-y-4 ${className}`}>
            {allMessages.length > 0 ? (
              allMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${
                    message.senderType === "STAFF"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-sm px-4 py-3 rounded-lg ${
                      message.senderType === "STAFF"
                        ? "bg-[#F0F5F9] text-muted"
                        : "bg-[#FF6B35] text-white"
                    }`}
                  >
                    <Text
                      variant="small"
                      weight="semibold"
                      className={
                        message.senderType === "STAFF"
                          ? "text-muted"
                          : "text-white"
                      }
                    >
                      {message.senderName}
                    </Text>
                    <Text
                      variant="body"
                      className={
                        message.senderType === "STAFF"
                          ? "text-muted"
                          : "text-white"
                      }
                    >
                      {message.content}
                    </Text>
                    {/* Spec 43 - the picture itself, not the word */}
                    {message.attachmentUrl && (
                      <AttachmentPreview
                        url={message.attachmentUrl}
                        size="sm"
                        className="mt-2"
                      />
                    )}
                    <Text
                      variant="caption"
                      weight="medium"
                      className={
                        message.senderType === "STAFF"
                          ? "text-muted/70 block mt-2"
                          : "text-white/70 block mt-2"
                      }
                    >
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleString()
                        : ""}
                    </Text>
                  </div>
                </div>
              ))
            ) : (
              <Text variant="caption" color="muted" className="text-center">
                No messages yet
              </Text>
            )}
          </div>

          {/* Composer */}
          {canReply && (
            <div className="bg-white py-2 px-4 border-t border-[#E0E0E0] space-y-3">
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
                <label
                  className="shrink-0"
                  aria-label="Attach an image to the reply"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile || isSubmitting}
                    className="hidden"
                  />
                  <span className="flex items-center justify-center cursor-pointer hover:opacity-70 transition">
                    {isUploadingFile ? (
                      <Text variant="caption" color="muted">
                        ...
                      </Text>
                    ) : (
                      <Image
                        src={AttachmentIcon}
                        alt=""
                        width={20}
                        height={20}
                        className="w-4 h-auto"
                      />
                    )}
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="Add Reply"
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !isSubmitting &&
                      !isUploadingFile
                    ) {
                      handleSendReply();
                    }
                  }}
                  disabled={isSubmitting || isUploadingFile}
                  className="flex-1 bg-[#ECEDEE] rounded-xl text-[14px] text-muted p-2 outline-none border border-muted/10 disabled:opacity-50"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendReply}
                  disabled={
                    isSubmitting || isUploadingFile || !replyContent.trim()
                  }
                  className="bg-linear-to-r from-primary via-orange to-primary whitespace-nowrap"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
