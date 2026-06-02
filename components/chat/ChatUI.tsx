"use client";

import { useState, useRef } from "react";
import { Text, Input } from "@/components/common";
import MessageCard from "./MessageCard";
import AttachmentIcon from "@/assets/icons/attachment.svg";
import ArrowUpIcon from "@/assets/icons/arrow-up.svg";
import Image from "next/image";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

interface ChatUIProps {
  profileName?: string;
  profileStatus?: string;
  messages?: ChatMessage[];
}

export default function ChatUI({
  profileName = "Viju Account Officer",
  profileStatus = "Online",
  messages = [
    {
      id: "1",
      content:
        "Good afternoon sir, I hope you are doin okay.kindly confirm the payment we made yester",
      timestamp: "10:05 AM",
      isMine: false,
    },
    {
      id: "2",
      content:
        "Confirm, I also updated your April statement, do well to confirm it please. thanks.",
      timestamp: "10:05 AM",
      isMine: true,
    },
    {
      id: "3",
      content: "Can we get more chocolate drink this week?",
      timestamp: "10:05 AM",
      isMine: false,
    },
  ],
}: ChatUIProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Prepare message to be submitted
      console.log("Message:", messageInput);
      if (selectedImage) {
        console.log("Image:", selectedImage);
        setSelectedImage(null);
      }
      setMessageInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Profile Section - Fixed */}
      <div className="sticky top-0  z-10">
        <div className="flex items-center gap-2">
          <span className="p-3 w-10 h-10 bg-muted uppercase text-white font-bold rounded-full flex justify-center items-center">
            A
          </span>
          <div className="">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            content={message.content}
            timestamp={message.timestamp}
            isMine={message.isMine}
          />
        ))}
      </div>

      {/* Input Section - Fixed */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-[#E0E0E0]/30 w-full">
        <div className="grid grid-cols-[8%_82%_8%] gap-2 w-full">
          {/* Attachment Icon */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleAttachmentClick}
            className="shrink-0 cursor-pointer hover:opacity-70 transition flex items-center justify-center"
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
            className="bg-[#ECEDEE] p-3 rounded-xl w-full text-[13px] text-muted focus:border-gray-400 outline-none"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            className="flex p-1 rounded-full w-14 h-14 text-white bg-[#E90000] items-center justify-center cursor-pointer hover:bg-opacity-90 transition "
          >
            <Image
              src={ArrowUpIcon}
              alt="Send"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </button>
        </div>
        {selectedImage && (
          <div className="mt-2 text-[12px] text-muted">
            Image selected: {selectedImage.name}
          </div>
        )}
      </div>
    </div>
  );
}
