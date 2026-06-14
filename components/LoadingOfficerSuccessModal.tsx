"use client";

import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { CheckCircle2 } from "lucide-react";

interface LoadingOfficerSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoadingOfficerSuccessModal({
  isOpen,
  onClose,
}: LoadingOfficerSuccessModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Success Icon */}
        <CheckCircle2 className="w-16 h-16 text-success" />

        {/* Title */}
        <Text variant="h3" weight="bold">
          Loading Officer Assigned
        </Text>

        {/* Message */}
        <Text variant="body" color="muted">
          The loading request has been assigned successfully. The assigned
          officer has been notified and processing can begin.
        </Text>

        {/* Button */}
        <Button
          variant="primary"
          onClick={onClose}
          className="mt-4 bg-linear-to-r from-[#FF0000] to-[#FF5A00] text-white hover:opacity-90"
        >
          Thank you
        </Button>
      </div>
    </Modal>
  );
}
