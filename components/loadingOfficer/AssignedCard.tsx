"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import { Text } from "../common";
import { safeText } from "@/utils/safe";

interface Props extends AssignedCardProps {
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Status badge colour. The API sends UPPER_SNAKE, which LoadingOfficer
 * humanises before it gets here - match on the humanised label but stay
 * tolerant of anything unexpected rather than rendering an unstyled chip.
 */
const badgeClass = (status: string) => {
  const value = status.toLowerCase();
  if (value.includes("complete")) return "bg-[#D4FFE9] text-[#04B054]";
  if (value.includes("progress")) return "bg-[#4B5BD1]/20 text-[#4B5BD1]";
  if (value.includes("cancel")) return "bg-[#FFE1E1] text-[#B00020]";
  return "bg-[#FFF4E1] text-[#FFA10B]";
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
