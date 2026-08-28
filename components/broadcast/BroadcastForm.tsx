"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
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
  useBroadcastIndividualMany,
  useInfiniteCustomers,
} from "@/hooks/api/useBroadcast";
import { toast } from "sonner";
import { REGIONS, resolveRegion } from "@/constants/regions";
import { normalizeStaffRole } from "@/constants/roles";
import { formatRegion } from "@/utils/formatter";
import { useAuthStore } from "@/store/auth.store";

interface BroadcastFormData {
  broadcastType: "regional" | "individual";
  regions: string[];
  /**
   * Spec 39: an individual broadcast now goes to ONE OR MORE customers. Kept
   * as an array even for a single recipient, so there is one shape to
   * validate, reset and submit rather than two.
   */
  customers: string[];
  message: string;
  allowance: number;
}

interface BroadcastFormProps {
  onSubmit?: (data: BroadcastFormData) => void;
}



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
  customers: yup.array().when("broadcastType", {
    is: "individual",
    then: (schema) =>
      schema
        .min(1, "Select at least one customer")
        .required("Select at least one customer") as any,
    otherwise: (schema) => schema.optional(),
  }) as any,
  message: yup
    .string()
    .required("Message is required")
    .max(200, "Message must not exceed 200 characters") as any,
  // Optional: an empty field (or 0) means "no allowance", so only reject
  // negative values - `positive()` here used to block every submission
  allowance: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? 0 : value,
    )
    .min(0, "Allowance cannot be a negative number")
    .typeError("Allowance must be a number")
    .default(0) as any,
}) as any;

export function BroadcastForm({ onSubmit }: BroadcastFormProps) {
  const { user } = useAuthStore();

  /**
   * Spec 40: a REGIONAL_ADMIN broadcasts to their OWN region and nowhere else.
   *
   * The picker is narrowed to that one region rather than hidden, so the
   * message still says plainly who it is going to - and if their staff record
   * carries no region the list is empty, which is honest: there is no region
   * to broadcast to until an admin sets one.
   */
  const isRegionScoped =
    normalizeStaffRole(user?.role) === "REGIONAL_ADMIN";
  const ownRegion = resolveRegion(user?.region);

  const regionOptions = useMemo(() => {
    if (!isRegionScoped) return REGIONS;
    return REGIONS.filter((region) => region.value === ownRegion);
  }, [isRegionScoped, ownRegion]);

  const [broadcastType, setBroadcastType] = useState<"regional" | "individual">(
    "individual",
  );
  const [messageLength, setMessageLength] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  /**
   * Kept separately so a chosen customer stays readable after the search box
   * is cleared and the option list reloads - the picked row is often no longer
   * among the loaded options, and an id is not a name.
   */
  const [selectedCustomers, setSelectedCustomers] = useState<
    { label: string; value: string }[]
  >([]);
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const scrollListenerRef = useRef<HTMLDivElement>(null);
  const customerFieldRef = useRef<HTMLDivElement>(null);

  const regionalMutation = useBroadcastRegional();
  const individualMutation = useBroadcastIndividualMany();
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
      customers: [],
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
  }, [
    hasMoreCustomers,
    isFetchingMoreCustomers,
    fetchNextCustomers,
    // the scrollable list only exists while the dropdown is open
    isCustomerListOpen,
  ]);

  // Close the customer dropdown when clicking outside of it
  useEffect(() => {
    if (!isCustomerListOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerFieldRef.current &&
        !customerFieldRef.current.contains(event.target as Node)
      ) {
        setIsCustomerListOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCustomerListOpen]);

  const handleTypeChange = (type: "regional" | "individual") => {
    setBroadcastType(type);
    reset({
      broadcastType: type,
      regions: [],
      customers: [],
      message: "",
      allowance: 0,
    });
    setMessageLength(0);
    setCustomerSearch("");
    setSelectedCustomers([]);
    setIsCustomerListOpen(false);
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
        /**
         * Send individual broadcast - deliveryAllowance is optional and only
         * meaningful when > 0, so it is left out entirely otherwise.
         *
         * Spec 39 (B-2): ONE call carrying every recipient. Unlike the two
         * bulk admin routes this one is not partial - it either sends to all
         * of them or raises - so there is no half-sent state to reconcile, and
         * a rejection lands in the catch below with the form still filled in.
         */
        const allowance = Number(data.allowance);
        await individualMutation.mutateAsync({
          customerIds: data.customers,
          payload: {
            message: data.message,
            ...(allowance > 0 ? { deliveryAllowance: allowance } : {}),
          },
        });
      }
      // Reset form on success, keeping the tab the user is working on
      // (a bare reset() would flip broadcastType back to "individual")
      reset({
        broadcastType: data.broadcastType,
        regions: [],
        customers: [],
        message: "",
        allowance: 0,
      });
      setMessageLength(0);
      setCustomerSearch("");
      setSelectedCustomers([]);
      setIsCustomerListOpen(false);
      if (onSubmit) {
        onSubmit(data);
      }
    } catch {
      // Error is already surfaced by the mutation's onError toast;
      // caught here so the form keeps its values for a retry
    }
  };

  /**
   * Surface validation errors instead of letting the submit button
   * silently do nothing
   */
  const onFormInvalid = (formErrors: Record<string, any>) => {
    const firstError = Object.values(formErrors).find(
      (error) => error?.message,
    );
    toast.error(
      (firstError?.message as string) ||
        "Please complete the form before sending",
    );
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
              Push notification delivered to customer mobile apps.
              {isRegionScoped
                ? ` Scoped to ${ownRegion ? formatRegion(ownRegion) : "your region"}.`
                : ""}
            </Text>
          </div>
          <BroadcastTypeTabs
            activeTab={broadcastType}
            onChange={handleTypeChange}
          />
        </div>
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit(onFormSubmit, onFormInvalid)}
        className="p-4 space-y-6"
      >
        {/* Regions / customer Field */}
        {broadcastType === "individual" ? (
          <Controller
            name="customers"
            control={control}
            render={({ field }) => {
              const selectedValues: string[] = field.value ?? [];

              /**
               * Spec 39: toggling a recipient. The picked option (label AND
               * id) is remembered alongside the form value, because the option
               * list reloads as the search changes and a deselected-then-
               * reselected customer would otherwise lose its name.
               */
              const toggleCustomer = (option: {
                label: string;
                value: string;
              }) => {
                const isSelected = selectedValues.includes(option.value);
                const next = isSelected
                  ? selectedValues.filter((value) => value !== option.value)
                  : [...selectedValues, option.value];

                field.onChange(next);
                setSelectedCustomers((current) =>
                  isSelected
                    ? current.filter(
                        (customer) => customer.value !== option.value,
                      )
                    : [...current, option],
                );
              };

              return (
                <div ref={customerFieldRef} className="space-y-2 relative">
                  <Text
                    variant="small"
                    weight="bold"
                    color="foreground"
                    className="block"
                  >
                    Target customers
                  </Text>

                  {/* Trigger - shows how many are picked, opens the list */}
                  <div
                    onClick={() =>
                      !isLoading && setIsCustomerListOpen((prev) => !prev)
                    }
                    className={`w-full border rounded-md px-3 py-2.5 flex items-center justify-between gap-2 ${
                      errors.customers ? "border-red-500" : "border-[#E5E7EB]"
                    } ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <Text
                      variant="small"
                      color={selectedValues.length ? "foreground" : "muted"}
                      className="truncate"
                    >
                      {selectedValues.length === 0
                        ? "Select customers"
                        : `${selectedValues.length} customer${
                            selectedValues.length === 1 ? "" : "s"
                          } selected`}
                    </Text>
                    <ChevronDown
                      className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                        isCustomerListOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Every recipient named, and removable one at a time -
                      "12 selected" alone is not something you can check */}
                  {selectedCustomers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomers.map((customer) => (
                        <span
                          key={customer.value}
                          className="inline-flex items-center gap-1 rounded-full bg-[#F0F5F9] px-3 py-1 text-[12px] text-[#374151]"
                        >
                          {customer.label}
                          <button
                            type="button"
                            aria-label={`Remove ${customer.label}`}
                            disabled={isLoading}
                            onClick={() => toggleCustomer(customer)}
                            className="text-muted hover:text-primary disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          field.onChange([]);
                          setSelectedCustomers([]);
                        }}
                        className="text-[12px] text-primary underline disabled:opacity-50"
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  {isCustomerListOpen && (
                    <div className="absolute z-50 mt-1 w-full border border-[#E5E7EB] rounded-md bg-white shadow-lg">
                      <div className="p-2 border-b border-[#E5E7EB]">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search customer..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full p-2 border border-[#E5E7EB] rounded-md outline-none text-sm"
                        />
                      </div>
                      <div
                        ref={scrollListenerRef}
                        className="max-h-52 overflow-y-auto p-2"
                      >
                        {isLoadingCustomers && (
                          <Text
                            variant="caption"
                            color="muted"
                            className="block p-2"
                          >
                            Loading customers...
                          </Text>
                        )}
                        {customerOptions.length === 0 &&
                          !isLoadingCustomers && (
                            <Text
                              variant="caption"
                              color="muted"
                              className="block p-2"
                            >
                              No customers found
                            </Text>
                          )}
                        {/* Multi-select: the list stays open so several
                            recipients can be ticked in one pass */}
                        {customerOptions.map((option: any) => {
                          const isSelected = selectedValues.includes(
                            option.value,
                          );
                          return (
                            <label
                              key={option.value}
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[#F0F5F9] rounded-md text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCustomer(option)}
                                className="w-4 h-4 accent-primary cursor-pointer"
                              />
                              <span className="truncate">{option.label}</span>
                            </label>
                          );
                        })}
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
                    </div>
                  )}

                  {errors.customers && (
                    <Text
                      variant="caption"
                      color="primary"
                      className="text-red-500"
                    >
                      {errors.customers.message as string}
                    </Text>
                  )}
                </div>
              );
            }}
          />
        ) : (
          <div className="space-y-2">
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
            {/* An unconfigured regional admin has nothing to broadcast to -
                say so rather than showing an empty picker with no explanation */}
            {isRegionScoped && regionOptions.length === 0 && (
              <Text variant="caption" color="orange">
                No region is set on your account, so there is nowhere to send a
                regional broadcast. Ask an administrator to set your region.
              </Text>
            )}
          </div>
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
              Optional. If entered, the customer's wallet is credited
              immediately on receipt - per recipient, not split between them.
            </Text>
          </div>
          <Controller
            name="allowance"
            control={control}
            render={({ field }) => (
              <div className="w-[140px]">
                <div className="h-10 bg-[#F3F4F6] rounded-md flex items-center px-3 gap-2">
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
                {errors.allowance && (
                  <Text variant="caption" className="text-red-500 mt-1 block">
                    {errors.allowance.message}
                  </Text>
                )}
              </div>
            )}
          />
        </div>

        {/* Footer Action Area */}
        <div className="border border-[#E5E7EB] rounded-md p-5 flex justify-between items-center">
          <Text variant="caption" color="muted">
            {broadcastType === "individual"
              ? `Push notification will include each customer's name, and is sent once per selected customer${
                  isRegionScoped ? " in your region" : ""
                }`
              : "Push notification will be delivered to all customers in selected regions"}
          </Text>
          <Button
            type="submit"
            variant="orange"
            size="xs"
            gradient={true}
            className="px-4 py-2"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </form>
    </div>
  );
}
