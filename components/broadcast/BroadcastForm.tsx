"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Text } from "@/components/common/Text";
import { MultiSelectField } from "@/components/common/MultiSelectField";
import { BroadcastTypeTabs } from "./BroadcastTypeTabs";
import {
  useBroadcastRegional,
  useBroadcastIndividual,
  useInfiniteCustomers,
} from "@/hooks/api/useBroadcast";
import { toast } from "sonner";

interface BroadcastFormData {
  broadcastType: "regional" | "individual";
  regions: string[];
  distributor: string;
  message: string;
  allowance: number;
}

interface BroadcastFormProps {
  onSubmit?: (data: BroadcastFormData) => void;
}

const regionOptions = [
  { label: "North", value: "NORTH" },
  { label: "South West", value: "SOUTH_WEST" },
  { label: "South East", value: "SOUTH_EAST" },
  { label: "Lagos", value: "LAGOS" },
];

const validationSchema = yup.object().shape({
  broadcastType: yup
    .string()
    .oneOf(["regional", "individual"])
    .required() as any,
  regions: yup.array().when("broadcastType", {
    is: "regional",
    then: (schema) =>
      schema
        .min(1, "At least one region is required")
        .required("Region is required") as any,
    otherwise: (schema) => schema.optional(),
  }) as any,
  distributor: yup.string().when("broadcastType", {
    is: "individual",
    then: (schema) => schema.required("Distributor is required"),
    otherwise: (schema) => schema.optional(),
  }) as any,
  message: yup
    .string()
    .required("Message is required")
    .max(200, "Message must not exceed 200 characters") as any,
  allowance: yup
    .number()
    .positive("Allowance must be a positive number")
    .typeError("Allowance must be a number")
    .optional() as any,
}) as any;

export function BroadcastForm({ onSubmit }: BroadcastFormProps) {
  const [broadcastType, setBroadcastType] = useState<"regional" | "individual">(
    "individual",
  );
  const [messageLength, setMessageLength] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const scrollListenerRef = useRef<HTMLDivElement>(null);

  const regionalMutation = useBroadcastRegional();
  const individualMutation = useBroadcastIndividual();
  const {
    data: customerPages,
    fetchNextPage: fetchNextCustomers,
    hasNextPage: hasMoreCustomers,
    isFetchingNextPage: isFetchingMoreCustomers,
    isLoading: isLoadingCustomers,
  } = useInfiniteCustomers(customerSearch);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BroadcastFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      broadcastType: "individual",
      regions: [],
      distributor: "",
      message: "",
      allowance: 0,
    },
  });

  const messageValue = watch("message");

  // Get the transformed customer options from the hook
  const customerOptions: Array<{ label: string; value: string }> =
    (customerPages as any) || [];

  // Handle scroll detection for infinite load
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.scrollHeight - target.scrollTop <= target.clientHeight + 100 &&
        hasMoreCustomers &&
        !isFetchingMoreCustomers
      ) {
        fetchNextCustomers();
      }
    };

    const scrollElement = scrollListenerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [hasMoreCustomers, isFetchingMoreCustomers, fetchNextCustomers]);

  const handleTypeChange = (type: "regional" | "individual") => {
    setBroadcastType(type);
    reset({
      broadcastType: type,
      regions: [],
      distributor: "",
      message: "",
      allowance: 0,
    });
    setMessageLength(0);
    setCustomerSearch("");
  };

  const onFormSubmit = async (data: BroadcastFormData) => {
    try {
      if (data.broadcastType === "regional") {
        // Send regional broadcast
        await regionalMutation.mutateAsync({
          regions: data.regions as any,
          message: data.message,
        });
      } else {
        // Send individual broadcast
        await individualMutation.mutateAsync({
          customerId: data.distributor,
          message: data.message,
          deliveryAllowance:
            data.allowance && data.allowance > 0 ? Number(data.allowance) : 0,
        });
      }
      // Reset form on success
      reset();
      setMessageLength(0);
      setCustomerSearch("");
      if (onSubmit) {
        onSubmit(data);
      }
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      toast.error("Broadcast submission error: " + (error as Error).message);
    }
  };

  const isLoading =
    isSubmitting || regionalMutation.isPending || individualMutation.isPending;

  return (
    <div className="bg-white border h-screen pb-30 border-[#E5E7EB] rounded-lg overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB]">
        <div className="flex justify-between items-start">
          <div>
            <Text variant="body" weight="bold" color="foreground">
              New Broadcast
            </Text>
            <Text variant="caption" color="muted" className="mt-1">
              Push notification delivered to distributor mobile apps.
            </Text>
          </div>
          <BroadcastTypeTabs
            activeTab={broadcastType}
            onChange={handleTypeChange}
          />
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-6">
        {/* Regions / Distributor Field */}
        {broadcastType === "individual" ? (
          <Controller
            name="distributor"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Text
                  variant="small"
                  weight="bold"
                  color="foreground"
                  className="block"
                >
                  Target Distributor
                </Text>
                <div
                  ref={scrollListenerRef}
                  className="border border-[#E5E7EB] rounded-md p-2 h-40 overflow-y-auto"
                >
                  <input
                    type="text"
                    placeholder="Search distributor..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full p-2 border border-[#E5E7EB] rounded-md mb-2 outline-none"
                    disabled={isLoading}
                  />
                  {isLoadingCustomers && (
                    <Text variant="caption" color="muted" className="block p-2">
                      Loading customers...
                    </Text>
                  )}
                  {customerOptions.length === 0 && !isLoadingCustomers && (
                    <Text variant="caption" color="muted" className="block p-2">
                      No customers found
                    </Text>
                  )}
                  {customerOptions.map((option: any) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        field.onChange(option.value);
                        setCustomerSearch("");
                      }}
                      className="p-2 cursor-pointer hover:bg-[#F0F5F9] rounded-md text-sm"
                    >
                      {option.label}
                    </div>
                  ))}
                  {isFetchingMoreCustomers && (
                    <Text
                      variant="caption"
                      color="muted"
                      className="block p-2 text-center"
                    >
                      Loading more...
                    </Text>
                  )}
                </div>
                {field.value && (
                  <Text variant="small" color="foreground" className="mt-2">
                    Selected:{" "}
                    {customerOptions.find(
                      (opt: any) => opt.value === field.value,
                    )?.label || field.value}
                  </Text>
                )}
                {errors.distributor && (
                  <Text
                    variant="caption"
                    color="primary"
                    className="text-red-500"
                  >
                    {errors.distributor.message}
                  </Text>
                )}
              </div>
            )}
          />
        ) : (
          <MultiSelectField
            name="regions"
            control={control}
            label="Target Regions"
            options={regionOptions}
            placeholder="Select regions..."
            searchMode="internal"
            filterOptions={true}
            disabled={isLoading}
          />
        )}

        {/* Message Textarea */}
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <div>
              <Textarea
                label="Message"
                {...field}
                placeholder="Type the announcement here..."
                maxLength={200}
                onChange={(value) => {
                  field.onChange(value);
                  setMessageLength(value.length);
                }}
                className="min-h-35 rounded-md "
                error={errors.message?.message}
                disabled={isLoading}
              />
              <Text variant="thinnote" color="muted" className="mt-2">
                {messageLength}/200 characters
              </Text>
            </div>
          )}
        />

        {/* Delivery Allowance */}
        <div className="border border-[#E5E7EB] rounded-md p-2 flex justify-between items-center">
          <div>
            <Text variant="small" weight="semibold" color="foreground">
              Delivery Allowance
            </Text>
            <Text
              variant="caption"
              color="muted"
              className="mt-1 max-w-[320px]"
            >
              Optional. If entered, the distributor's wallet is credited
              immediately on receipt.
            </Text>
          </div>
          <Controller
            name="allowance"
            control={control}
            render={({ field }) => (
              <div className="w-[140px] h-10 bg-[#F3F4F6] rounded-md flex items-center px-3 gap-2">
                <span className="text-[#374151] font-medium">₦</span>
                <input
                  {...field}
                  type="number"
                  min="0"
                  placeholder="enter amount"
                  onChange={(e) => field.onChange(e.target.value || 0)}
                  disabled={isLoading}
                  className="bg-transparent outline-none w-full text-right text-[#111827] disabled:opacity-60"
                />
              </div>
            )}
          />
        </div>

        {/* Footer Action Area */}
        <div className="border border-[#E5E7EB] rounded-md p-5 flex justify-between items-center">
          <Text variant="caption" color="muted">
            {broadcastType === "individual"
              ? "Push notification will include distributor's name"
              : "Push notification will be delivered to all distributors in selected regions"}
          </Text>
          <Button
            type="submit"
            variant="orange"
            size="sm"
            gradient={true}
            className="w-35 h-10"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Broadcast"}
          </Button>
        </div>
      </form>
    </div>
  );
}
