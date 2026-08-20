"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { BoldTopText } from "./common/BoldTopText";
import { useSetOfficerActive } from "@/hooks/api/useOfficer";
import { getErrorMessage } from "@/utils/apiError";
import { safeText } from "@/utils/safe";

interface Officer {
  id: string;
  name: string;
  email: string;
  region: string;
  role: string;
  phoneNo: string;
  distributors: number;
  tickets: number | string;
  createdAt: string;
  /** Present once the list carries it - drives reactivate vs deactivate */
  isActive?: boolean;
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
  // 409 OFFICER_HAS_CUSTOMERS is rendered inline, not as a toast, because the
  // admin needs the count and the next step in front of them.
  const [blocker, setBlocker] = useState<{
    message: string;
    assignedCustomers: number;
  } | null>(null);

  const setActiveMutation = useSetOfficerActive();

  // Treat a missing flag as active, matching how the list renders
  const isActive = officer?.isActive !== false;

  const handleToggleActive = async () => {
    if (!officer || setActiveMutation.isPending) return;
    setBlocker(null);

    try {
      await setActiveMutation.mutateAsync({
        officerId: officer.id,
        body: { isActive: !isActive },
      });
      onConfirm?.(officer);
      onClose();
    } catch (error) {
      const body = (error as any)?.response?.data;

      // Branch on `code`, never on the message text (backend handoff).
      if (body?.code === "OFFICER_HAS_CUSTOMERS") {
        setBlocker({
          message: safeText(
            body?.message,
            "Reassign this officer's customers before deactivating.",
          ),
          assignedCustomers: Number(body?.assignedCustomers) || 0,
        });
        return;
      }

      toast.error(
        getErrorMessage(error) || "Could not update this officer. Try again.",
      );
    }
  };

  // Clear the blocker when the modal is dismissed and reopened
  useEffect(() => {
    if (!isOpen) setBlocker(null);
  }, [isOpen]);

  if (!officer) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <Text variant="h3" weight="bold">
              {isActive ? "Deactivate" : "Reactivate"} Account Officer
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

        {/* 409 - customers must be reassigned first */}
        {blocker && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
            <Text variant="small" weight="bold" color="primary">
              {blocker.message}
            </Text>
            <Text variant="caption" color="muted">
              Move {blocker.assignedCustomers}{" "}
              {blocker.assignedCustomers === 1 ? "customer" : "customers"} from
              the Customer Reassignment page, then try again.
            </Text>
          </div>
        )}

        {/* Deactivate / Reactivate Button */}
        <div className="pt-4 border-t border-muted/20">
          <Button
            variant="primary"
            fullWidth
            loading={setActiveMutation.isPending}
            onClick={handleToggleActive}
            className="bg-orange hover:bg-orange/90"
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
