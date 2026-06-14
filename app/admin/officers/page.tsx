"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AddAccountOfficerFormModal from "@/components/AddAccountOfficerFormModal";
import PreviewAccountOfficerModal from "@/components/PreviewAccountOfficerModal";
import SuccessModal from "@/components/SuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import plus from "@/assets/icons/plus.svg";
import Image from "next/image";

// Interface for officer data structure
interface Officer {
  id: string;
  name: string;
  email: string;
  region: string;
  role: string;
  phoneNo: string;
  distributors: number;
  tickets: number;
  lastLogin: string;
  action: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "name" as const,
    title: "OFFICER",
  },
  {
    key: "email" as const,
    title: "EMAIL",
  },
  {
    key: "region" as const,
    title: "REGION",
  },
  {
    key: "role" as const,
    title: "ROLE",
  },
  {
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "distributors" as const,
    title: "DISTRIBUTORS",
  },
  {
    key: "tickets" as const,
    title: "TICKETS",
  },
  {
    key: "lastLogin" as const,
    title: "LAST LOGIN",
  },
  {
    key: "action" as const,
    title: "ACTION",
  },
];

// Mock officer data
const mockOfficerData: Officer[] = [
  {
    id: "1",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Loading Officer",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "2",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Ware house",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "3",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Loading Officer",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "4",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Account",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "5",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Loading Officer",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "6",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Account",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "7",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Loading Officer",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "8",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Ware house",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "9",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Loading Officer",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
  {
    id: "10",
    name: "James Okonkwo",
    email: "james@gmail.com",
    region: "Lagos",
    role: "Inactive",
    phoneNo: "+2340987654321",
    distributors: 14,
    tickets: 2,
    lastLogin: "Today, 09:14",
    action: "Deactivate",
  },
];

// Region options for tabs
const regions = [
  { name: "Lagos", value: "Lagos" },
  { name: "South West", value: "South West" },
  { name: "South East", value: "South East" },
  { name: "North", value: "North" },
];

function AccountOfficersContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("Lagos");

  // State for modals
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for selected officer
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * Filter officers by selected region
   */
  const filteredOfficers = useMemo(() => {
    return mockOfficerData.filter(
      (officer) => officer.region === selectedRegion,
    );
  }, [selectedRegion]);

  /**
   * Calculate pagination
   */
  const totalItems = filteredOfficers.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOfficers.slice(startIndex, endIndex);
  }, [filteredOfficers, currentPage]);

  /**
   * Handle region change and reset pagination
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setCurrentPage(1);
  };

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    console.log("Search value:", value);
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: Officer) => {
    console.log(`Action: ${action}`, row);
    if (action.includes("Deactivate")) {
      setSelectedOfficer(row);
      setIsPreviewModalOpen(true);
    }
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * Handle next page button click
   */
  const handleNextPage = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Handle new officer button click
   */
  const handleNewOfficer = () => {
    setIsAddOfficerModalOpen(true);
  };

  /**
   * Handle successful officer creation
   */
  const handleOfficerCreated = () => {
    setSuccessMessage("Officer Created Successfully");
    setIsSuccessModalOpen(true);
  };

  /**
   * Handle successful officer deactivation
   */
  const handleOfficerDeactivated = () => {
    setSuccessMessage("Officer Deactivated Successfully");
    setIsSuccessModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="p-4 overflow-y-auto space-y-6 pb-30 h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <div className="flex justify-between items-center ">
          <PageHeader
            title="Account Officers"
            subtitle="Manage account officer portfolio. Phone numbers are fixed once set - password is via OTP to registered phone or email."
          />
          <Button
            variant="primary"
            onClick={handleNewOfficer}
            className="bg-gradient-to-r from-primary via-orange to-primary flex items-center gap-2"
          >
            <Image
              src={plus}
              width={50}
              height={50}
              className="w-2.5 h-2.5"
              alt="plus icon"
            />
            <span>New Officer</span>
          </Button>
        </div>

        {/* Officers List Card */}
        <Card border={false}>
          {/* New Officer Button */}

          {/* Data Table */}
          <div className="overflow-x-auto mt-6">
            <Table
              columns={tableColumns}
              data={paginatedData}
              onRowClick={() => {}}
              onActionClick={handleActionClick}
            />
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </Card>

        {/* Add Account Officer Modal */}
        <AddAccountOfficerFormModal
          isOpen={isAddOfficerModalOpen}
          onClose={() => setIsAddOfficerModalOpen(false)}
          onSuccess={handleOfficerCreated}
        />

        {/* Preview/Deactivate Officer Modal */}
        {selectedOfficer && (
          <PreviewAccountOfficerModal
            isOpen={isPreviewModalOpen}
            onClose={() => {
              setIsPreviewModalOpen(false);
              setSelectedOfficer(null);
            }}
            officer={selectedOfficer}
            onConfirm={handleOfficerDeactivated}
          />
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setSuccessMessage("");
          }}
          title={
            successMessage.includes("Deactivated")
              ? "Officer Deactivated Successfully"
              : "Officer Created Successfully"
          }
          message={
            successMessage.includes("Deactivated")
              ? "The officer account has been deactivated successfully. Platform access has been revoked, and all historical records remain available for audit purposes."
              : "The new officer account has been created successfully. They will receive an email with their login credentials."
          }
        />
      </div>
    </MainLayout>
  );
}

/**
 * Account Officers Page - Protected Route Wrapper
 */
export default function AccountOfficersPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <AccountOfficersContent />
    </ProtectedRoute>
  );
}
