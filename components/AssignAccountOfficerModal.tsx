"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Text, Modal, Input, Button } from "@/components/common";
import OfficerSelectionCard from "@/components/OfficerSelectionCard";
import searchIcon from "@/assets/icons/search-icon-gray.svg";
import { BoldTopText } from "./common/BoldTopText";
import { useOfficers } from "@/hooks/api/useOfficer";

interface OfficerData {
  id: string;
  name: string;
  role: string;
}

interface AssignAccountOfficerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (officer: OfficerData) => void;
  distributorName?: string;
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
  distributorName = "LAG-234-XG",
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

  // Fetch officers from API
  const { data: officersData, isLoading, error } = useOfficers();

  // Transform API officers to component format and filter based on search
  const filteredOfficers = useMemo(() => {
    if (!officersData?.data) return [];

    const officers = officersData.data.map((officer) => ({
      id: officer.id,
      name: officer.name,
      role: "Account Officer",
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
                  No officers found
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
          disabled={!selectedOfficer || isLoading}
          className="w-full mt-8 bg-linear-to-r from-[#FF0000] to-[#FF5A00] text-white rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Assignment
        </Button>
      </div>
    </Modal>
  );
}
