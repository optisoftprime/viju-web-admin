"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import { Text } from "../common";
import { safeText } from "@/utils/safe";
import { getStatusBadgeStyle } from "@/components/common/Table";

interface Props extends AssignedCardProps {
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Status badge colour, from the SHARED palette.
 *
 * This card had its own three-way map, which left ASSIGNED on the fallback
 * amber - the same colour the regional admin's table gives PENDING, and a
 * different one from the purple it now gives ASSIGNED. These are the same
 * loading requests seen from another screen, so they have to look the same.
 */
const badgeClass = (status: string) => {
  const { bgColor, textColor } = getStatusBadgeStyle(status);
  return `${bgColor} ${textColor}`;
};

const AssignedCard = ({
  assignedCode,
  assignedStatus,
  assignedName,
  assignedDate,
  isSelected = false,
  onClick,
}: Props) => {
  const status = safeText(assignedStatus, "Assigned");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-2 bg-white rounded-xl space-y-1.5 transition-colors ${
        isSelected
          ? "border-2 border-primary"
          : "border border-muted/20 hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Text variant="caption" color="muted" weight="normal">
          {safeText(assignedCode, "-")}
        </Text>

        <span
          className={`p-1 text-[12px] font-medium rounded whitespace-nowrap ${badgeClass(status)}`}
        >
          {status}
        </span>
      </div>

      <Text variant="body" color="foreground" weight="bold">
        {safeText(assignedName, "Unknown distributor")}
      </Text>

      <Text variant="caption" color="muted" weight="normal">
        {safeText(assignedDate, "No date set")}
      </Text>
    </button>
  );
};

export default AssignedCard;
