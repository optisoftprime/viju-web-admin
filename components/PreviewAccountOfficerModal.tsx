"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { BoldTopText } from "./common/BoldTopText";
import { useSetOfficerActive } from "@/hooks/api/useOfficer";
import { useAuthStore } from "@/store/auth.store";
import { getErrorCode, getErrorMessage, getErrorStatus } from "@/utils/apiError";
import { formatRole } from "@/constants/roles";
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
  /**
   * From GET /admin/officers/{id}. A WAREHOUSE_OFFICER is still ERP-managed
   * and comes back false; the backend refuses the call for those. Undefined
   * means the caller has not loaded the detail, in which case the control
   * stays available and the API remains the control.
   */
  isManaged?: boolean;
  /** Wire role value, used to spot the signed-in admin's own row */
  roleValue?: string | null;
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

  // Everything else the API refuses, in its own words
  const [failure, setFailure] = useState("");

  const { user } = useAuthStore();
  const setActiveMutation = useSetOfficerActive();

  // Treat a missing flag as active, matching how the list renders
  const isActive = officer?.isActive !== false;

  // SELF_DEACTIVATION is a 400. Disabling the control on your own row turns a
  // server rejection into something the UI never offers in the first place.
  const isSelf = Boolean(officer?.id && user?.id && officer.id === user.id);

  // A WAREHOUSE_OFFICER is not ours to deactivate
  const isUnmanaged = officer?.isManaged === false;

  const canToggle = !isSelf && !isUnmanaged;

  const handleToggleActive = async () => {
    if (!officer || setActiveMutation.isPending || !canToggle) return;
    setBlocker(null);
    setFailure("");

    try {
      // Sent unconditionally: the API is idempotent and reports what it did
      // through `changed`. Pre-checking the status here would just reintroduce
      // the race that flag exists to absorb.
      const result = await setActiveMutation.mutateAsync({
        officerId: officer.id,
        body: { isActive: !isActive },
      });

      if (result?.changed === false) {
        toast.info(
          result.isActive
            ? "User is already active."
            : "User is already inactive.",
        );
      } else {
        toast.success(
          result?.isActive ? "User reactivated." : "User deactivated.",
        );
      }

      onConfirm?.(officer);
      onClose();
    } catch (error) {
      // Branch on `code`, never on the message text (backend handoff).
      const code = getErrorCode(error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error);

      if (code === "OFFICER_HAS_CUSTOMERS") {
        const body = (error as { response?: { data?: unknown } })?.response
          ?.data as { assignedCustomers?: unknown } | undefined;

        setBlocker({
          message: safeText(
            message,
            "Reassign this officer's customers before deactivating.",
          ),
          assignedCustomers: Number(body?.assignedCustomers) || 0,
        });
        return;
      }

      if (code === "LAST_ACTIVE_ADMIN") {
        setFailure(
          message || "Create another admin before deactivating this one.",
        );
        return;
      }

      if (status === 404) {
        setFailure("That user no longer exists. Refresh the list.");
        return;
      }

      // ROLE_NOT_MANAGED, SELF_DEACTIVATION and 403 all carry wording written
      // for the user - render it rather than paraphrasing.
      setFailure(message || "Could not update this user. Try again.");
      toast.error(message || "Could not update this user. Try again.");
    }
  };

  /**
   * Clear the blockers whenever the modal opens or closes, so a reopened
   * modal never shows the previous attempt's failure.
   *
   * Adjusted during render rather than in an effect - React's documented
   * pattern for state derived from a prop change, and one render cheaper
   * than an effect that immediately triggers a second one.
   */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setBlocker(null);
    setFailure("");
  }

  if (!officer) return null;

  const actionLabel = isActive ? "Deactivate" : "Reactivate";
  const roleLabel = officer.roleValue
    ? formatRole(officer.roleValue)
    : officer.role;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <Text variant="h3" weight="bold">
              {actionLabel} User
            </Text>
            <Text variant="caption" color="muted">
              {roleLabel} details
            </Text>
          </div>
        </div>

        {/* Officer Details Grid */}
        <div className="">
          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Name" bottom={officer.name} />
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
              bottom={roleLabel}
              className="flex flex-col items-end justify-end"
            />
          </div>

          <div className="flex justify-between items-center border-b border-muted/50 pb-2">
            <BoldTopText top="Phone No" bottom={officer.phoneNo} />
            <BoldTopText
              top="Customers"
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

        {/* Everything else the API refused */}
        {failure && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Text variant="small" weight="medium" color="primary">
              {failure}
            </Text>
          </div>
        )}

        {/* Why the control is unavailable, when it is */}
        {!canToggle && (
          <div className="rounded-lg border border-muted/30 bg-muted/10 p-3">
            <Text variant="caption" color="muted">
              {isSelf
                ? "You cannot deactivate your own account. Ask another admin to do it."
                : "This account is managed in the ERP and cannot be deactivated here."}
            </Text>
          </div>
        )}

        {/* Deactivate / Reactivate Button */}
        <div className="pt-4 border-t border-muted/20">
          <Button
            variant="primary"
            fullWidth
            disabled={!canToggle || setActiveMutation.isPending}
            loading={setActiveMutation.isPending}
            onClick={handleToggleActive}
            className="bg-orange hover:bg-orange/90"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
