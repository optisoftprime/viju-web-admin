"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Text, Modal, Input, Button } from "@/components/common";
import OfficerSelectionCard from "@/components/OfficerSelectionCard";
import searchIcon from "@/assets/icons/search-icon-gray.svg";
import { BoldTopText } from "./common/BoldTopText";
import { useLoadingOfficers } from "@/hooks/api/useLoading";
import { safeText, safeNumber } from "@/utils/safe";

interface Officer {
  id: string;
  name: string;
  role: string;
}

interface AssignLoadingOfficerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (officer: Officer) => void;
  /** True while the parent's assign request is in flight */
  isSubmitting?: boolean;
  truckName?: string;
  driver?: string;
  date?: string;
  qty?: string;
  region?: string;
}

export default function AssignLoadingOfficerModal({
  isOpen = false,
  onClose,
  onConfirm,
  isSubmitting = false,
  truckName = "LAG-234-XY",
  driver = "John Dare",
  date = "Today, 14:00",
  qty = "320 Cartons",
  region = "Lagos",
}: AssignLoadingOfficerModalProps) {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");

  // RA-06 - real loading officers, not the three hardcoded names
  const {
    data: officersResponse,
    isLoading: isLoadingOfficers,
    error: officersError,
  } = useLoadingOfficers(searchInput.trim() || undefined);

  const officers: Officer[] = useMemo(
    () =>
      (Array.isArray(officersResponse) ? officersResponse : []).map(
        (officer: any) => ({
          id: safeText(officer?.id, ""),
          name: safeText(officer?.name, "Unnamed officer"),
          role: `Loading - ${safeNumber(officer?._count?.customers, 0)} assigned`,
        }),
      ),
    [officersResponse],
  );

  // Filter officers based on search input
  const filteredOfficers = useMemo(() => {
    if (!searchInput.trim()) return officers;
    return officers.filter(
      (officer) =>
        officer.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        officer.role.toLowerCase().includes(searchInput.toLowerCase()),
    );
  }, [searchInput]);

  const selectedOfficer = officers.find((o) => o.id === selectedOfficerId);

  const handleConfirm = () => {
    if (selectedOfficer) {
      onConfirm?.(selectedOfficer);
      // Reset state after confirmation
      setSelectedOfficerId(null);
      setSearchInput("");
      onClose?.();
    }
  };

  const handleClose = () => {
    setSelectedOfficerId(null);
    setSearchInput("");
    onClose?.();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto p-2">
        {/* Header Section */}
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <Text variant="body" weight="bold" color="foreground">
              Assign Loading Officer
            </Text>
            <Text variant="caption" weight="medium" color="muted">
              Request {truckName} for Alfuji Faruk Shola
            </Text>
          </div>
        </div>

        {/* Loading Details Grid Section */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12 py-8">
          <BoldTopText top="Truck Name" bottom={truckName} />
          <BoldTopText top="Driver" bottom={driver} />
          <BoldTopText top="Date" bottom={date} />
          <BoldTopText top="Qty" bottom={qty} />
        </div>

        {/* Available Officers Section */}
        <div className="space-y-2 pt-4">
          <Text variant="body" weight="bold" color="foreground">
            Available Officers in {region}
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
              placeholder="Search for loading officer name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white border border-[#D9DEE5] placeholder:text-black/80 rounded-full p-3 text-[13px] pl-10"
            />
          </div>

          {/* Officer Selection List */}
          <div className="space-y-0 rounded-md overflow-hidden">
            {filteredOfficers.length > 0 ? (
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
            ) : (
              <div className="p-4 text-center">
                <Text variant="caption" color="muted">
                  {isLoadingOfficers
                    ? "Loading officers..."
                    : officersError
                      ? "Could not load loading officers. Please try again."
                      : searchInput.trim()
                        ? "No officers match that search"
                        : "No loading officers available in your region"}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Notification Info Box */}
        <div className="bg-[#EAF3FF] px-4 py-4 rounded-md mt-6">
          <Text variant="caption" weight="medium" color="primary">
            <span className="text-[#155BBD]">
              On assignment, the officer is notified in-app and the distributor
              receives a push notification that their loading has been
              scheduled.
            </span>
          </Text>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!selectedOfficer}
          className="w-full mt-8 bg-linear-to-r from-[#FF0000] to-[#FF5A00] text-white rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Assignment
        </Button>
      </div>
    </Modal>
  );
}
