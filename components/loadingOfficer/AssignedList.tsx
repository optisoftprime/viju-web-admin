"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import AssignedCard from "./AssignedCard";

export interface AssignedListItem extends AssignedCardProps {
  id: string;
}

interface AssignedListProps {
  assignedList: AssignedListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const AssignedList = ({
  assignedList,
  selectedId,
  onSelect,
}: AssignedListProps) => {
  return (
    <div>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {assignedList.map((item, index) => (
          <AssignedCard
            // ids come from the API but fall back to the index so a missing
            // id can never collapse two rows onto one key
            key={item.id || `assignment-${index}`}
            {...item}
            isSelected={!!item.id && item.id === selectedId}
            onClick={() => item.id && onSelect?.(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AssignedList;
