"use client";

import { useState, useRef, useEffect } from "react";
import { Text } from "@/components/common";
import MessageCard from "./MessageCard";
import AttachmentIcon from "@/assets/icons/attachment.svg";
import ArrowUpIcon from "@/assets/icons/arrow-up.svg";
import Image from "next/image";
import {
  useChatHistory,
  useSendMessage,
  useFileUpload,
} from "@/hooks/api/useChat";

interface ChatUIProps {
  profileName?: string;
  profileStatus?: string;
  distributorId?: string | null;
}

export default function ChatUI({
  profileName = "Viju Account Officer",
  profileStatus = "Online",
  distributorId,
}: ChatUIProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useChatHistory(distributorId || null);

  // Send message mutation
  const { mutate: sendMessage } = useSendMessage(distributorId || "");

  // File upload mutation
  const { mutate: uploadFile } = useFileUpload();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      { file, folder: "chat-attachments" },
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

  const handleSendMessage = () => {
    if (
      !messageInput.trim() ||
      !distributorId ||
      isSubmitting ||
      isUploadingFile
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      sendMessage(
        {
          content: messageInput,
          attachmentUrl: attachmentUrl || undefined,
        },
        {
          onSuccess: () => {
            setMessageInput("");
            setAttachmentUrl(null);
            setSelectedImage(null);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
            alert("Failed to send message");
          },
        },
      );
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Profile Section - Fixed */}
      <div className="sticky top-0 z-10 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="p-3 w-10 h-10 bg-muted uppercase text-white font-bold rounded-full flex justify-center items-center">
            {profileName?.charAt(0) || "A"}
          </span>
          <div>
            <Text variant="small" weight="bold" color="foreground">
              {profileName}
            </Text>
            <span className="text-[12px] text-[#00CF61] font-bold">
              {profileStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Section - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Text variant="caption" color="muted">
              Loading messages...
            </Text>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <Text variant="caption" color="muted">
              Error loading messages. Please try again.
            </Text>
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Text variant="caption" color="muted">
              No messages yet. Start a conversation!
            </Text>
          </div>
        )}

        {messages.map((message) => (
          <MessageCard
            key={message.id}
            content={message.content}
            timestamp={new Date(message.createdAt).toLocaleTimeString()}
            isMine={message.senderType === "STAFF"}
            attachmentUrl={message.attachmentUrl}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section - Fixed */}
      <div className="fixed bottom-0 bg-white p-4 border-t border-[#E0E0E0]/30 w-[75vw] space-y-2">
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

        <div className="grid grid-cols-[8%_82%_8%] gap-2 w-full">
          {/* Attachment Icon */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploadingFile || isSubmitting}
            className="hidden"
          />
          <button
            onClick={handleAttachmentClick}
            disabled={isUploadingFile || isSubmitting}
            className="shrink-0 cursor-pointer hover:opacity-70 transition flex items-center justify-center disabled:opacity-50"
          >
            <Image
              src={AttachmentIcon}
              alt="Attachment"
              width={24}
              height={24}
              className="w-5 h-auto"
            />
          </button>

          {/* Input Field */}
          <input
            type="text"
            name="message"
            placeholder="Send message"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isSubmitting && !isUploadingFile) {
                handleSendMessage();
              }
            }}
            disabled={isSubmitting || isUploadingFile}
            className="bg-[#ECEDEE] p-3 rounded-xl w-full text-[13px] text-muted focus:border-gray-400 outline-none border border-muted/10 disabled:opacity-50"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isSubmitting || isUploadingFile || !messageInput.trim()}
            className="flex p-1 rounded-full w-14 h-14 text-white bg-[#E90000] items-center justify-center cursor-pointer hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src={ArrowUpIcon}
              alt="Send"
              width={20}
              height={20}
              className="w-5 h-auto"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
