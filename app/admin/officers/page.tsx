"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AddAccountOfficerFormModal from "@/components/AddAccountOfficerFormModal";
import PreviewAccountOfficerModal from "@/components/PreviewAccountOfficerModal";
import SuccessModal from "@/components/SuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useOfficers, useCreateOfficer } from "@/hooks/api/useOfficer";
import plus from "@/assets/icons/plus.svg";
import Image from "next/image";

// Interface for officer data structure (transformed from API)
interface OfficerTableRow {
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

function AccountOfficersContent() {
  // State for modals
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for selected officer
  const [selectedOfficer, setSelectedOfficer] =
    useState<OfficerTableRow | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;

  // Fetch officers from API
  const {
    data: officersData,
    isLoading,
    error,
  } = useOfficers({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
  });

  // Create officer mutation
  const createOfficerMutation = useCreateOfficer();

  /**
   * Transform API response to table format
   */
  const tableData: OfficerTableRow[] = useMemo(() => {
    if (!officersData?.data) return [];

    return officersData.data.map((officer) => ({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      region: officer.region,
      role: officer.isActive ? "Account Officer" : "Inactive",
      phoneNo: officer.phone,
      distributors: officer._count?.customers || 0,
      tickets: 0, // Tickets count not in API response, using 0
      lastLogin: "N/A", // Last login not in API response
      action: "Deactivate",
    }));
  }, [officersData?.data]);

  const totalItems = officersData?.meta.total || 0;
  const totalPages = officersData?.meta.totalPages || 1;

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: OfficerTableRow) => {
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
            className="bg-linear-to-r from-primary via-orange to-primary flex items-center gap-2"
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
          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading officers...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-red-500">
              Error loading officers. Please try again.
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && (
            <>
              <div className="flex justify-end mt-4">
                <SearchInput
                  placeholder="Search officers"
                  onSearch={handleSearch}
                  debounceDelay={500}
                />
              </div>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
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
            </>
          )}
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
