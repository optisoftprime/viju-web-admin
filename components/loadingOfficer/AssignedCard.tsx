"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import { Text } from "../common";

const AssignedCard = ({
  assignedCode,
  assignedStatus,
  assignedName,
  assignedDate,
}: AssignedCardProps) => {
  return (
    <div className="p-2 bg-white rounded-xl space-y-1.5">
      <div className="flex items-center justify-between">
        <Text variant="caption" color="muted" weight="normal">
          {assignedCode}
        </Text>

        <span
          className={`p-1 text-[12px] font-medium ${assignedStatus === "Assigned" ? "bg-[#D4FFE9] text-[#04B054]" : "bg-[#4B5BD1]/20 text-[#4B5BD1]"} rounded`}
        >
          {assignedStatus}
        </span>
      </div>

      <Text variant="body" color="foreground" weight="bold">
        {assignedName}
      </Text>

      <Text variant="caption" color="muted" weight="normal">
        {assignedDate}
      </Text>
    </div>
  );
};

export default AssignedCard;
