"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Text, Modal, Input, Button } from "@/components/common";
import OfficerSelectionCard from "@/components/OfficerSelectionCard";
import searchIcon from "@/assets/icons/search-icon-gray.svg";
import { BoldTopText } from "./common/BoldTopText";
import { useOfficers } from "@/hooks/api/useOfficer";
import { formatRole } from "@/constants/roles";
import { safeText } from "@/utils/safe";

interface OfficerData {
  id: string;
  name: string;
  role: string;
}

interface AssignAccountOfficerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (officer: OfficerData) => void;
  /**
   * Set while the parent's assignment request is in flight.
   * Keeps the modal open, shows a spinner and blocks duplicate submissions.
   */
  isSubmitting?: boolean;
  distributorName?: string;
  /**
   * Spec 39: the API enum for the CUSTOMER's region.
   *
   * PATCH /admin/customers/{id}/reassign answers "Officer not found or
   * inactive" for a deactivated officer AND for one whose region differs from
   * the customer's, so the picker must not offer either. Without this the
   * modal listed every officer in the organisation and most picks failed.
   *
   * The backend has confirmed the comparison is against the CUSTOMER's region,
   * not the officer's own - so the customer's is what belongs here.
   */
  regionValue?: string;
  distributorData?: {
    distributor: string;
    phoneNumber: string;
    account: string;
    region: string;
    officers: string;
    wallet: string;
    stock: string;
    ticket: string;
  };
}

export default function AssignAccountOfficerModal({
  isOpen = false,
  onClose,
  onConfirm,
  isSubmitting = false,
  distributorName = "LAG-234-XG",
  regionValue,
  distributorData = {
    distributor: "LAG-234-XG",
    phoneNumber: "Tunde Dare",
    account: "Today, 14:00",
    region: "320 Cartons",
    officers: "Today, 14:00",
    wallet: "320 Cartons",
    stock: "Today, 14:00",
    ticket: "320 Cartons",
  },
}: AssignAccountOfficerModalProps) {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");

  /**
   * Only ACTIVE account officers, and only in this customer's own region.
   * Both filters are confirmed applied server-side.
   *
   * `role` is left off - GET /admin/officers already defaults to OFFICER, and
   * that is exactly the population this modal assigns from. The region is only
   * attached when it is known: an unresolved region would otherwise silently
   * narrow the list to nothing rather than showing every candidate.
   *
   * For a REGIONAL_ADMIN the region param is accepted and ignored - they are
   * always pinned to their own token's region - so this is correct for them
   * too, since a customer they can see is by definition in that region.
   *
   * The query is skipped entirely while the modal is closed so a closed modal
   * is not holding a request open per row.
   */
  const {
    data: officersData,
    isLoading,
    error,
  } = useOfficers({
    isActive: true,
    region: regionValue || undefined,
    pageSize: 100,
    enabled: isOpen,
  });

  // Transform API officers to component format and filter based on search
  const filteredOfficers = useMemo(() => {
    if (!officersData?.data) return [];

    const officers = officersData.data.map((officer) => ({
      id: officer.id,
      // Two officers can share a name, so the row also carries the email
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
  }, [officersData?.data, searchInput]);

  const selectedOfficer = filteredOfficers.find(
    (o) => o.id === selectedOfficerId,
  );

  // Clear the selection whenever the modal closes, whether it was dismissed
  // here or closed by the parent after a successful request
  useEffect(() => {
    if (!isOpen) {
      setSelectedOfficerId(null);
      setSearchInput("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedOfficer || isSubmitting) return;

    // The parent owns closing - it waits for the request to succeed first
    onConfirm?.(selectedOfficer);
  };

  const handleClose = () => {
    // Don't let the user dismiss a request that is already in flight
    if (isSubmitting) return;
    onClose?.();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto p-2">
        {/* Header Section */}
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <Text variant="body" weight="bold" color="foreground">
              Assign Account Officer
            </Text>
            <Text variant="caption" weight="medium" color="muted">
              Account officers details
            </Text>
          </div>
        </div>

        {/* Account Details Grid Section */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12 py-8">
          {/* Left Column */}
          <BoldTopText top="Distributor" bottom={distributorData.distributor} />
          <BoldTopText
            top="Phone Number"
            bottom={distributorData.phoneNumber}
          />
          <BoldTopText top="Account" bottom={distributorData.account} />
          <BoldTopText top="Region" bottom={distributorData.region} />
          <BoldTopText top="Officers" bottom={distributorData.officers} />
          <BoldTopText top="Wallet" bottom={distributorData.wallet} />
          <BoldTopText top="Stock" bottom={distributorData.stock} />
          <BoldTopText top="Ticket" bottom={distributorData.ticket} />
        </div>

        {/* Available Officers Section */}
        <div className="space-y-2 pt-4">
          <Text variant="body" weight="bold" color="foreground">
            Available Account Officers
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            {regionValue
              ? `Active officers in ${distributorData.region}. An officer outside this region, or a deactivated one, is rejected by the API.`
              : "Active account officers."}
          </Text>

          {/* Search Input */}
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
              name="officerSearch"
              placeholder="Search for account officer name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white border border-[#D9DEE5] placeholder:text-black/80 rounded-full p-3 text-[13px] pl-10"
            />
          </div>

          {/* Officer Selection List */}
          <div className="space-y-0 rounded-md overflow-hidden">
            {isLoading && (
              <div className="p-4 text-center">
                <Text variant="caption" color="muted">
                  Loading officers...
                </Text>
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <Text variant="caption" color="muted">
                  Error loading officers. Please try again.
                </Text>
              </div>
            )}

            {!isLoading && !error && filteredOfficers.length > 0 ? (
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
            ) : !isLoading && !error ? (
              <div className="p-4 text-center">
                <Text variant="caption" color="muted">
                  {searchInput.trim()
                    ? "No officers match that search"
                    : regionValue
                      ? `No active account officer is assigned to ${distributorData.region}. Create one, or reactivate an existing officer, before assigning this customer.`
                      : "No officers found"}
                </Text>
              </div>
            ) : null}
          </div>
        </div>

        {/* Assignment Notification Info Box */}
        <div className="bg-[#EAF3FF] px-4 py-4 rounded-md mt-6">
          <Text variant="caption" weight="medium" color="primary">
            <span className="text-[#155BBD]">
              On assignment, the account officer is notified in-app and receives
              a push notification.
            </span>
          </Text>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          loading={isSubmitting}
          disabled={!selectedOfficer || isLoading}
          className="w-full mt-8 bg-linear-to-r from-[#FF0000] to-[#FF5A00] text-white rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Assignment
        </Button>
      </div>
    </Modal>
  );
}
