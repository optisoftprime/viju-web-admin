"use client";

import { Trash2 } from "lucide-react";
import { Modal, Button, Text } from "./";
import { useLogout } from "@/hooks/api/useAuth";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogoutModal({ open, onClose }: LogoutModalProps) {
  const logoutMutation = useLogout();
  const isLoading = logoutMutation.isPending;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {}
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Out">
      <div className="p-4">
        {/* Icon Section */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Message Section */}
        <div className="text-center mb-6">
          <Text
            variant="h3"
            weight="semibold"
            color="foreground"
            className="mb-2"
          >
            Log Out
          </Text>
          <Text variant="small" color="muted">
            Are you sure you want to log out? You'll need to sign in again to
            access your account.
          </Text>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? "Logging Out..." : "Log Out"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
