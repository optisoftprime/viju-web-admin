"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Text, Modal, Input, Button } from "@/components/common";
import OfficerSelectionCard from "@/components/OfficerSelectionCard";
import searchIcon from "@/assets/icons/search-icon-gray.svg";
import { useOfficers } from "@/hooks/api/useOfficer";
import { formatRole } from "@/constants/roles";
import { formatRegion } from "@/utils/formatter";
import { safeText } from "@/utils/safe";

export interface BulkAssignCustomer {
  id: string;
  name: string;
  /** API enum, not the display label */
  regionValue: string;
}

interface OfficerData {
  id: string;
  name: string;
  role: string;
}

interface BulkAssignAccountOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (officer: OfficerData) => void;
  isSubmitting?: boolean;
  customers: BulkAssignCustomer[];
}

/**
 * Spec 39: assign ONE account officer to EVERY selected customer.
 *
 * The officer list is scoped to the selection's own region and to active
 * accounts, for the same reason the single-customer modal is:
 * PATCH /admin/customers/{id}/reassign answers "Officer not found or inactive"
 * for a deactivated officer and for one outside the customer's region.
 *
 * A selection spanning two regions therefore has no valid officer at all - one
 * officer cannot be in both - so rather than listing candidates that are
 * guaranteed to fail for half the batch, the modal says which regions are
 * mixed and refuses to submit. Splitting the selection is the fix, and it is
 * the admin's call which region to do first.
 */
export default function BulkAssignAccountOfficerModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  customers,
}: BulkAssignAccountOfficerModalProps) {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");

  // Regions present in the selection. One is workable; more than one is not.
  const regions = useMemo(() => {
    const unique = new Set(
      customers.map((customer) => customer.regionValue).filter(Boolean),
    );
    return Array.from(unique);
  }, [customers]);

  const singleRegion = regions.length === 1 ? regions[0] : undefined;
  const isMixedRegion = regions.length > 1;
  // A selection whose rows carry no region at all cannot be scoped either
  const hasNoRegion = regions.length === 0 && customers.length > 0;

  const {
    data: officersData,
    isLoading,
    error,
  } = useOfficers({
    isActive: true,
    region: singleRegion,
    pageSize: 100,
    enabled: isOpen && Boolean(singleRegion),
  });

  // Read once so the memo's dependency is the exact value it uses - a
  // `officersData?.data` dependency reads as less specific than the property
  // actually touched, and the compiler then declines to memoise at all
  const officerRows = officersData?.data;

  const filteredOfficers: OfficerData[] = useMemo(() => {
    if (!officerRows) return [];

    const officers = officerRows.map((officer) => ({
      id: officer.id,
      name: safeText(officer.name, "Unnamed officer"),
      role: officer.email
        ? `${formatRole(officer.role, "Account Officer")} - ${officer.email}`
        : formatRole(officer.role, "Account Officer"),
    }));

    if (!searchInput.trim()) return officers;

    return officers.filter(
      (officer) =>
        officer.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        officer.role.toLowerCase().includes(searchInput.toLowerCase()),
    );
  }, [officerRows, searchInput]);

  const selectedOfficer = filteredOfficers.find(
    (officer) => officer.id === selectedOfficerId,
  );

  /**
   * A reopened modal starts clean rather than showing the last pick. Reset
   * during render, not in an effect - an effect would paint the previous
   * selection for one frame before clearing it.
   */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setSelectedOfficerId(null);
    setSearchInput("");
  }

  const handleClose = () => {
    // Don't let the user dismiss a batch that is already running
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto p-2">
        <div className="border-b pb-3">
          <Text variant="body" weight="bold" color="foreground">
            Assign {customers.length}{" "}
            {customers.length === 1 ? "Customer" : "Customers"}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            One account officer takes every customer selected below.
          </Text>
        </div>

        {/* Who is in the batch - named, so nothing is assigned unseen */}
        <div className="mt-4 max-h-32 overflow-y-auto rounded-md border border-muted/20 p-3 space-y-1">
          {customers.map((customer) => (
            <Text
              key={customer.id}
              variant="caption"
              weight="medium"
              color="muted"
              className="block"
            >
              {customer.name} - {formatRegion(customer.regionValue)}
            </Text>
          ))}
        </div>

        {isMixedRegion && (
          <div className="mt-4 rounded-md bg-[#FFF4E1] px-4 py-3">
            <Text variant="caption" weight="semibold" color="orange">
              This selection spans {regions.length} regions
            </Text>
            <Text variant="caption" weight="medium" color="orange">
              {regions.map(formatRegion).join(", ")}. An officer belongs to one
              region, so no single officer can take all of these. Select the
              customers of one region at a time.
            </Text>
          </div>
        )}

        {hasNoRegion && (
          <div className="mt-4 rounded-md bg-[#FFF4E1] px-4 py-3">
            <Text variant="caption" weight="medium" color="orange">
              None of the selected customers carries a region, so the officer
              list cannot be scoped. Fix the region on these records first.
            </Text>
          </div>
        )}

        {singleRegion && (
          <div className="space-y-2 pt-5">
            <Text variant="body" weight="bold" color="foreground">
              Available Account Officers
            </Text>
            <Text variant="caption" weight="medium" color="muted">
              Active officers in {formatRegion(singleRegion)}.
            </Text>

            <div className="relative">
              <Image
                src={searchIcon}
                alt="Search"
                width={16}
                height={16}
                className="absolute w-3 h-3 z-10 left-4 top-3.5 pointer-events-none"
              />
              <Input
                type="text"
                name="bulkOfficerSearch"
                placeholder="Search for account officer name"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="bg-white border border-[#D9DEE5] placeholder:text-black/80 rounded-full p-3 text-[13px] pl-10"
              />
            </div>

            <div className="space-y-0 rounded-md overflow-hidden">
              {isLoading && (
                <div className="p-4 text-center">
                  <Text variant="caption" color="muted">
                    Loading officers...
                  </Text>
                </div>
              )}

              {!isLoading && error && (
                <div className="p-4 text-center">
                  <Text variant="caption" color="muted">
                    Error loading officers. Please try again.
                  </Text>
                </div>
              )}

              {!isLoading && !error && filteredOfficers.length > 0 && (
                filteredOfficers.map((officer) => (
                  <OfficerSelectionCard
                    key={officer.id}
                    id={officer.id}
                    name={officer.name}
                    role={officer.role}
                    isSelected={selectedOfficerId === officer.id}
                    onClick={() => setSelectedOfficerId(officer.id)}
                  />
                ))
              )}

              {!isLoading && !error && filteredOfficers.length === 0 && (
                <div className="p-4 text-center">
                  <Text variant="caption" color="muted">
                    {searchInput.trim()
                      ? "No officers match that search"
                      : `No active account officer is assigned to ${formatRegion(
                          singleRegion,
                        )}.`}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#EAF3FF] px-4 py-4 rounded-md mt-6">
          <Text variant="caption" weight="medium" color="primary">
            <span className="text-[#155BBD]">
              Each customer is assigned individually, so a failure on one leaves
              the rest assigned. The result is reported when the batch finishes.
            </span>
          </Text>
        </div>

        <Button
          onClick={() => selectedOfficer && onConfirm(selectedOfficer)}
          loading={isSubmitting}
          disabled={!selectedOfficer || isLoading || isSubmitting}
          className="w-full mt-8 bg-linear-to-r from-[#FF0000] to-[#FF5A00] text-white rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Assign {customers.length}{" "}
          {customers.length === 1 ? "Customer" : "Customers"}
        </Button>
      </div>
    </Modal>
  );
}
