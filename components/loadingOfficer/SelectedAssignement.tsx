"use client";

import { Button, Text } from "../common";
import { BoldTopText } from "../common/BoldTopText";
import assigned from "@/assets/icons/assigned.svg";
import completed from "@/assets/icons/completed.svg";
import upload from "@/assets/icons/upload.svg";
import loadingInProgress from "@/assets/icons/loading-in-progress.svg";
import Image from "next/image";
import { useState } from "react";

interface SelectedAssignementProps {
  assignedStatus: string;
}

const SelectedAssignement = ({ assignedStatus }: SelectedAssignementProps) => {
  const [activeStatus, setActiveStatus] = useState("markedLoadingInProgress");

  const statusArray = [
    {
      name: "Assigned",
      icon: assigned,
      isActive: assignedStatus === "Assigned",
    },
    {
      name: "Loading in Progress",
      icon: loadingInProgress,
      isActive: assignedStatus === "Loading in Progress",
    },
    {
      name: "Completed",
      icon: completed,
      isActive: assignedStatus === "Completed",
    },
  ];

  const handleStatusClick = (statusName: string) => {
    setActiveStatus(statusName);
  };

  const handleFileUpload = () => {};
  return (
    <form className="">
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

      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20 ">
        <Text variant="small" color="muted" weight="semibold" className="mb-4">
          Update Status
        </Text>

        <div className="grid grid-cols-3 gap-2">
          {statusArray.map((status) => (
            <div
              className={`flex items-center py-2 justify-center ${status.isActive ? "border border-blue-700 bg-blue-700" : "border border-muted/30 bg-gray-100"} gap-1 rounded-md`}
            >
              <Image
                src={status.icon}
                alt={status.name}
                width={40}
                height={40}
                className={`w-3 h-3 ${status.isActive ? "bg-blue-700" : "text-gray-500"}`}
              />
              <Text
                variant="caption"
                color={status.isActive ? "white" : "muted"}
                weight="medium"
              >
                {status.name}
              </Text>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div
            onClick={() => handleStatusClick("markedLoadingInProgress")}
            className={`flex cursor-pointer items-center py-2 justify-center border ${activeStatus === "markedLoadingInProgress" ? "border-lime-400 bg-lime-400" : "border-muted/30 bg-white"} gap-1 rounded-md`}
          >
            <Text variant="caption" color={"muted"} weight="medium">
              Mark Loading in Progress
            </Text>
          </div>
          <div
            onClick={() => handleStatusClick("markedCompleted")}
            className={`flex cursor-pointer items-center py-2 justify-center border ${activeStatus === "markedCompleted" ? "border-lime-400 bg-lime-400" : "border-muted/30 bg-white"} gap-1 rounded-md`}
          >
            <Text variant="caption" color={"muted"} weight="medium">
              Mark Completed{" "}
            </Text>
          </div>
        </div>
      </div>

      {/* way bill section  */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20 ">
        <Text variant="small" color="muted" weight="bold" className="">
          Waybill / Loading Bill
        </Text>
        <Text variant="caption" color="muted" weight="medium" className="mb-2">
          Upload the issued document. It becomes visible in the distributor’s
          mobile app.
        </Text>

        <div
          onClick={handleFileUpload}
          className="mt-4 cursor-pointer border border-dashed rounded-xl border-muted p-4 "
        >
          <div className="flex-col items-center justify-center flex gap-2 space-y-2">
            <Image
              src={upload}
              alt="Upload"
              width={60}
              height={60}
              className="w-5 h-5 mt-3"
            />
            <Text
              variant="caption"
              color="foreground"
              weight="medium"
              className=""
            >
              Drop file or click to to upload
            </Text>
            <Text variant="thinnote" color="muted" weight="medium" className="">
              PDF,JPG, PNG - up to 10MB
            </Text>
          </div>
          <input hidden type="file" name="waybill" id="waybill" />
        </div>
      </div>

      <Button variant="primary" fullWidth={true}>
        Submit
      </Button>
    </form>
  );
};

export default SelectedAssignement;
