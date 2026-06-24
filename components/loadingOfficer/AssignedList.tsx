"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import { Text } from "../common";
import AssignedCard from "./AssignedCard";

interface AssignedListProps {
  assignedList: AssignedCardProps[];
}

const AssignedList = ({ assignedList }: AssignedListProps) => {
  return (
    <div>
      <div className="space-y-2">
        {assignedList.map((item) => (
          <AssignedCard key={item.assignedCode} {...item} />
        ))}
      </div>
    </div>
  );
};

export default AssignedList;
