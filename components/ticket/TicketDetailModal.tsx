"use client";

import { useState, useMemo } from "react";
import { Modal, Button, Text } from "@/components/common";
import { TicketThread, TicketReply } from "@/lib/api/types";
import {
  useTicketThread,
  useSendTicketReply,
  useFileUpload,
} from "@/hooks/api/useOfficerCustomer";

interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  distributorId: string | null;
  distributorName?: string;
}

export default function TicketDetailModal({
  open,
  onClose,
  distributorId,
  distributorName,
}: TicketDetailModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Fetch ticket thread
  const {
    data: ticketData,
    isLoading,
    error,
    refetch,
  } = useTicketThread(open && distributorId ? distributorId : null);

  // Send reply mutation
  const { mutate: sendReply } = useSendTicketReply(ticketData?.id || "");

  // File upload mutation
  const { mutate: uploadFile } = useFileUpload();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (image only)
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
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
          e.target.value = ""; // Reset file input
        },
        onError: (error) => {
          console.error("File upload failed:", error);
          alert("Failed to upload file");
          setIsUploadingFile(false);
        },
      },
    );
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !ticketData) return;

    setIsSubmitting(true);
    try {
      sendReply(
        { content: replyContent, attachmentUrl: attachmentUrl || undefined },
        {
          onSuccess: () => {
            setReplyContent("");
            setAttachmentUrl(null);
            setIsSubmitting(false);
            // Refetch ticket thread to show new reply
            refetch();
          },
          onError: () => {
            setIsSubmitting(false);
          },
        },
      );
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error sending reply:", err);
    }
  };

  // Combine all messages (ticket + replies) with proper sender info
  const allMessages = useMemo(() => {
    if (!ticketData) return [];

    const messages = [
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

    return messages;
  }, [ticketData]);

  return (
    <Modal
      title={`Ticket: ${ticketData?.ticketId ? ticketData.ticketId : ""} ${distributorName}`}
      open={open}
      onClose={onClose}
    >
      <div className="flex flex-col h-150 bg-white rounded-lg">
        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Text variant="caption" color="muted">
              Loading tickets...
            </Text>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <Text variant="caption" color="muted">
              Error loading tickets. Please try again.
            </Text>
          </div>
        )}

        {/* Messages */}
        {!isLoading && !error && (
          <>
            {/* Messages List - Scrollable */}
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

            {/* Input Section - Fixed */}
            <div className="sticky bottom-0 bg-white p-6 border-t border-[#E0E0E0] space-y-3">
              {/* Attachment Preview */}
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

              {/* Input and File Upload */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add Reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (
                      e.key === "Enter" &&
                      !isSubmitting &&
                      !isUploadingFile
                    ) {
                      handleSendReply();
                    }
                  }}
                  disabled={isSubmitting || isUploadingFile}
                  className="flex-1 bg-[#ECEDEE] rounded-xl text-13 text-muted p-4 focus:border-gray-400 outline-none border border-muted/10 disabled:opacity-50"
                />

                {/* File Upload Button */}
                <label className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile || isSubmitting}
                    className="hidden"
                  />
                  <button
                    onClick={(e) =>
                      (e.currentTarget as any).previousElementSibling.click()
                    }
                    disabled={isUploadingFile || isSubmitting}
                    className="px-4 py-2 bg-[#F0F5F9] border border-muted/20 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingFile ? "..." : "📎"}
                  </button>
                </label>

                <Button
                  variant="primary"
                  size="md"
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
