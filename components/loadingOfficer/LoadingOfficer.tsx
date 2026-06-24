"use client";

import { AssignedCardProps } from "@/src/types/assignment";
import AssignedList from "./AssignedList";
import SelectedAssignement from "./SelectedAssignement";
import { Text } from "../common";

const LoadingOfficer = () => {
  const assignedList: AssignedCardProps[] = [
    {
      assignedCode: "WB-009",
      assignedStatus: "Assigned",
      assignedName: "Ikorodu Mega Distributor",
      assignedDate: "IKJ-901-LA - Tomorrow, 08:30 AM",
    },
    {
      assignedCode: "WB-010",
      assignedStatus: "Loading in progress",
      assignedName: "Lekki Prime Supplies",
      assignedDate: "LKI-245-LA - Today, 02:15 PM",
    },
    {
      assignedCode: "WB-011",
      assignedStatus: "Assigned",
      assignedName: "Victoria Island Wholesale Hub",
      assignedDate: "VIH-332-LA - Friday, 10:00 AM",
    },
    {
      assignedCode: "WB-012",
      assignedStatus: "Loading in progress",
      assignedName: "Surulere Retail Network",
      assignedDate: "SUR-118-LA - Monday, 09:45 AM",
    },
    {
      assignedCode: "WB-013",
      assignedStatus: "Assigned",
      assignedName: "Yaba Distribution Center",
      assignedDate: "YAB-567-LA - Wednesday, 01:30 PM",
    },
  ];
  return (
    <section>
      <Text variant="caption" color="muted" weight="normal" className="mb-2">
        Assigned to you - {assignedList.length}
      </Text>
      <div className="grid grid-cols-[35%_65%] gap-4">
        <AssignedList assignedList={assignedList} />
        <SelectedAssignement assignedStatus="Assigned" />
      </div>
    </section>
  );
};

export default LoadingOfficer;
