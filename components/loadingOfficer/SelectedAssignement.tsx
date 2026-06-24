"use client";

import { Text } from "../common";
import { BoldTopText } from "../common/BoldTopText";
import assigned from "@/assets/icons/assigned.svg";
import completed from "@/assets/icons/completed.svg";
import loadingInProgress from "@/assets/icons/loading-in-progress.svg";
import Image from "next/image";

interface SelectedAssignementProps {
  assignedStatus: string;
}

const SelectedAssignement = ({ assignedStatus }: SelectedAssignementProps) => {
  return (
    <div className="">
      <div className="p-4 bg-white rounded-xl space-y-1.5">
        <div className="flex items-center justify-between">
          <Text variant="caption" color="muted" weight="normal">
            <span>WB-0099</span>
            <span className="ml-5">ORD - 9923</span>
          </Text>

          <span
            className={`p-1 text-[12px] font-medium ${assignedStatus === "Assigned" ? "bg-[#D4FFE9] text-[#04B054]" : "bg-[#4B5BD1]/20 text-[#4B5BD1]"} rounded`}
          >
            {assignedStatus}
          </span>
        </div>

        <Text variant="body" color="foreground" weight="bold">
          Ikorodu Mega Distributor
        </Text>

        <Text variant="caption" color="muted" weight="normal">
          IKJ-901-LA - Tomorrow, 08:30 AM
        </Text>
      </div>

      <div className="px-4 pb-4 grid grid-cols-4 gap-2 pt-6 border-t border-muted/30 bg-white">
        <BoldTopText top="Truck" bottom="IKJ-901-LA" />
        <BoldTopText top="Driver" bottom="Dare John" />
        <BoldTopText top="Loading Date" bottom="Tomorrow 09:30" />
        <BoldTopText top="Quantity" bottom="540 cartons" />
      </div>

      <div className="p-4 bg-white my-6 rounded-xl">
        <Text variant="body" color="muted" weight="medium" className="mb-4">
          Update Status
        </Text>

        <div className="grid grid-cols-3 gap-2">
          <div className={`flex items-center justify-center gap-1`}>
            <Image
              src={assigned}
              alt="Assigned"
              width={40}
              height={40}
              className="w-3 h-4"
            />
            <Text variant="caption" color="white" weight="medium">
              Assigned
            </Text>
          </div>
          <div className={`flex items-center justify-center gap-1`}>
            <Image
              src={loadingInProgress}
              alt="Loading in Progress"
              width={40}
              height={40}
            />
            <Text variant="caption" color="white" weight="medium">
              Loading in Progress
            </Text>
          </div>
          <div className={`flex items-center justify-center gap-1`}>
            <Image
              src={completed}
              alt="Completed"
              width={40}
              height={40}
              className="w-3 h-4"
            />
            <Text variant="caption" color="white" weight="medium">
              Completed
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedAssignement;
