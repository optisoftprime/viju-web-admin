"use client";

import { useMemo, useState } from "react";
import { Modal, Button, Text } from "@/components/common";
import { TicketReply } from "@/lib/api/types";
import {
  useTicketThread,
  useSendTicketReply,
  useFileUpload,
} from "@/hooks/api/useOfficerCustomer";
import AttachmentIcon from "@/assets/icons/attachment.svg";
import Image from "next/image";

interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  distributorId: string | null;
  distributorName?: string;
}

export default function TicketDetailModal({
  open,
  onClose,
  ticketId,
  distributorId: _distributorId,
  distributorName,
}: TicketDetailModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const {
    data: ticketData,
    isLoading,
    error,
    refetch,
  } = useTicketThread(open && ticketId ? ticketId : null);

  const { mutate: sendReply } = useSendTicketReply(ticketId || "");
  const { mutate: uploadFile } = useFileUpload();

  const handleFileUpload = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploadingFile(true);
    uploadFile(
      { file, folder: "ticket-attachments" },
      {
        onSuccess: (url) => {
          setAttachmentUrl(url);
          setIsUploadingFile(false);
          event.target.value = "";
        },
        onError: (error) => {
          console.error("File upload failed:", error);
          alert("Failed to upload file");
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
        onSuccess: () => {
          setReplyContent("");
          setAttachmentUrl(null);
          setIsSubmitting(false);
          refetch();
        },
        onError: () => {
          setIsSubmitting(false);
          alert("Failed to send reply");
        },
      },
    );
  };

  const handleClose = () => {
    setReplyContent("");
    setAttachmentUrl(null);
    onClose();
  };

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
        senderName:
          reply.senderType === "STAFF"
            ? "Staff"
            : ticketData.customer?.name || "Customer",
        timestamp: reply.createdAt,
        attachmentUrl: reply.attachmentUrl || null,
      })),
    ];
  }, [ticketData]);

  return (
    <Modal
      title={
        ticketData?.ticketId
          ? `Ticket: ${ticketData.ticketId}${distributorName ? ` - ${distributorName}` : ""}`
          : "Ticket Details"
      }
      open={open}
      onClose={handleClose}
    >
      <div className="flex flex-col h-150 bg-white rounded-lg">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Text variant="caption" color="muted">
              Loading ticket details...
            </Text>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <Text variant="caption" color="muted">
              Error loading ticket details. Please try again.
            </Text>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {allMessages.length > 0 ? (
                allMessages.map((message) => (
                  <div key={message.id} className="flex">
                    <div
                      className={`flex ${
                        message.senderType === "STAFF"
                          ? "justify-start"
                          : "justify-end"
                      } w-full`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
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
                        {message.attachmentUrl && (
                          <a
                            href={message.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-block mt-2 underline text-sm ${
                              message.senderType === "STAFF"
                                ? "text-[#4B5BD1]"
                                : "text-white"
                            }`}
                          >
                            View Attachment
                          </a>
                        )}
                        <Text
                          variant="caption"
                          className={
                            message.senderType === "STAFF"
                              ? "text-muted/70 block mt-2"
                              : "text-white/70 block mt-2"
                          }
                          weight="medium"
                        >
                          {new Date(message.timestamp).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Text variant="caption" color="muted" className="text-center">
                  No messages yet
                </Text>
              )}
            </div>

            <div className="sticky bottom-0 bg-white py-2 border-t border-[#E0E0E0] space-y-3">
              {attachmentUrl && (
                <div className="flex items-center justify-between bg-[#F0F5F9] p-3 rounded-lg">
                  <Text variant="small" color="muted">
                    Attachment added
                  </Text>
                  <button
                    onClick={() => setAttachmentUrl(null)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-[5%_80%_15%] w-full gap-2 items-center">
                <label className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile || isSubmitting}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      const input = event.currentTarget
                        .previousElementSibling as HTMLInputElement | null;
                      input?.click();
                    }}
                    disabled={isUploadingFile || isSubmitting}
                    className=" bg-[#F0F5F9] border border-muted/20 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingFile ? (
                      "..."
                    ) : (
                      <Image
                        src={AttachmentIcon}
                        alt="Attachment"
                        width={24}
                        height={24}
                        className="w-3 h-auto cursor-pointer"
                      />
                    )}
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="Add Reply"
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  onKeyPress={(event) => {
                    if (
                      event.key === "Enter" &&
                      !isSubmitting &&
                      !isUploadingFile
                    ) {
                      handleSendReply();
                    }
                  }}
                  disabled={isSubmitting || isUploadingFile}
                  className="flex-1 bg-[#ECEDEE] rounded-xl text-[14px] text-muted p-2 focus:border-gray-400 outline-none border border-muted/10 disabled:opacity-50"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendReply}
                  disabled={
                    isSubmitting || isUploadingFile || !replyContent.trim()
                  }
                  className="bg-[#FF6B35]"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
