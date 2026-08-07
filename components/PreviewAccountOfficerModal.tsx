"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { BoldTopText } from "./common/BoldTopText";

interface Officer {
  id: string;
  name: string;
  email: string;
  region: string;
  role: string;
  phoneNo: string;
  distributors: number;
  tickets: number;
  createdAt: string;
}

interface PreviewAccountOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer?: Officer;
  onConfirm?: (officer: Officer) => void;
}

export default function PreviewAccountOfficerModal({
  isOpen,
  onClose,
  officer,
  onConfirm,
}: PreviewAccountOfficerModalProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!officer) return;
    setIsDeactivating(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setIsDeactivating(false);
        onConfirm?.(officer);
        onClose();
      }, 500);
    } catch (error) {
      setIsDeactivating(false);
    }
  };

  if (!officer) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <Text variant="h3" weight="bold">
              Deactivate Account Officer
            </Text>
            <Text variant="caption" color="muted">
              Account Officer's details
            </Text>
          </div>
        </div>

        {/* Officer Details Grid */}
        <div className="">
          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Officer" bottom={officer.name} />
            <BoldTopText
              top="Email"
              bottom={officer.email}
              className="flex flex-col items-end justify-end"
            />
          </div>

          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Region" bottom={officer.region} />
            <BoldTopText
              top="Role"
              bottom={officer.role}
              className="flex flex-col items-end justify-end"
            />
          </div>

          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Phone No" bottom={officer.phoneNo} />
            <BoldTopText
              top="Distributors"
              bottom={officer.distributors}
              className="flex flex-col items-end justify-end"
            />
          </div>

          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Tickets" bottom={officer.tickets} />
            <BoldTopText
              top="Created At"
              bottom={officer.createdAt}
              className="flex flex-col items-end justify-end"
            />
          </div>
        </div>

        {/* Deactivate Button */}
        <div className="pt-4 border-t border-muted/20">
          <Button
            variant="primary"
            fullWidth
            loading={isDeactivating}
            onClick={handleDeactivate}
            className="bg-orange hover:bg-orange/90"
          >
            Deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
