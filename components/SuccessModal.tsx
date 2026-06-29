"use client";

import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Thank you",
}: SuccessModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Success Icon */}
        <CheckCircle2 className="w-16 h-16 text-success" />

        {/* Title */}
        <Text variant="h3" weight="bold">
          {title}
        </Text>

        {/* Message */}
        <Text variant="body" color="muted">
          {message}
        </Text>

        {/* Button */}
        <Button
          variant="primary"
          onClick={onClose}
          className="mt-4 bg-orange hover:bg-orange/90"
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}
