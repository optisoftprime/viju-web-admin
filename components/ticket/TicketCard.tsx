"use client";

import { Text, Select, type SelectOption } from "@/components/common";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface TicketCardProps {
  ticketId: string;
  title: string;
  status?: "Open" | "In Progress" | "Awaiting Customer" | "Resolved";
  repliesUpdated?: number;
  dateUpdated?: string;
  onStatusChange?: (status: string) => void;
}

const statusOptions: SelectOption[] = [
  { label: "Open", value: "Open" },
  { label: "In Progress", value: "In Progress" },
  { label: "Awaiting Customer", value: "Awaiting Customer" },
  { label: "Resolved", value: "Resolved" },
];

type TicketForm = {
  status: string;
};

const schema = yup.object({
  status: yup.string().required("Status is required"),
});

export default function TicketCard({
  ticketId,
  title,
  status = "Open",
  repliesUpdated = 0,
  dateUpdated = "",
  onStatusChange,
}: TicketCardProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: yupResolver(schema),
  });

  return (
    <div className="bg-[#F5F5F5] p-6 rounded-lg space-y-2 my-3">
      {/* Title and Status Select */}
      <div className="flex items-center justify-between w-full">
        <Text variant="h3" weight="bold" color="foreground">
          {ticketId}
        </Text>
        <div className="w-40">
          <Select
            name="status"
            control={control}
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            placeholder="Select Status"
          />
          {/* <Select
            label=""
            name={`ticket-${ticketId}-status`}
            options={statusOptions}
            value={status}
            onChange={onStatusChange}
          /> */}
        </div>
      </div>

      {/* Description/Title */}
      <Text variant="h3" weight="medium" color="foreground">
        {title}
      </Text>

      {/* Status Badges and Date */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2 items-center">
          <span className="flex items-center justify-center text-[12px] text-[#3F79FA] font-bold px-2 py-1 rounded-md bg-[#D3E0FF]">
            Open
          </span>
          <span className="flex items-center justify-center text-[12px] text-[#7F8DA1] font-bold px-2 py-1 rounded-md bg-[#DFE1E3]">
            {repliesUpdated} replies updated
          </span>
        </div>
        <Text variant="caption" weight="medium" color="muted">
          {dateUpdated}
        </Text>
      </div>
    </div>
  );
}
