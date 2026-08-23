"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AddManagedUserModal from "@/components/AddAccountOfficerFormModal";
import PreviewAccountOfficerModal from "@/components/PreviewAccountOfficerModal";
import OfficerDetailsModal from "@/components/OfficerDetailsModal";
import SuccessModal from "@/components/SuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useOfficers } from "@/hooks/api/useOfficer";
import plus from "@/assets/icons/plus.svg";
import Image from "next/image";
import { formatRegion } from "@/utils/formatter";
import { safeText, safeNumber, safeDateText } from "@/utils/safe";
import { formatRole, formatRoleScope } from "@/constants/roles";
import { STATUS_FILTER_OPTIONS } from "@/constants/roles";
import type { CreateOfficerResponse } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";

// Interface for officer data structure (transformed from API)
interface OfficerTableRow {
  id: string;
  name: string;
  email: string;
  region: string;
  role: string;
  /** Wire value behind the label, e.g. "OFFICER" */
  roleValue: string;
  phoneNo: string;
  distributors: number;
  tickets: number;
  status: string;
  lastLogin: string;
  createdAt: string;
  isActive: boolean;
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
    title: "CUSTOMERS",
  },
  {
    key: "tickets" as const,
    title: "TICKETS",
  },
  {
    key: "status" as const,
    title: "STATUS",
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
  // false only means the credentials email did not go out - the account exists
  const [credentialsEmailSent, setCredentialsEmailSent] = useState(true);

  // State for selected officer
  const [selectedOfficer, setSelectedOfficer] =
    useState<OfficerTableRow | null>(null);

  // Row click opens the read-only profile; the ACTION button opens the
  // deactivate flow, so the two are tracked separately
  const [detailsRow, setDetailsRow] = useState<OfficerTableRow | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  // "" means no isActive filter at all, which is the API's default
  const [statusFilter, setStatusFilter] = useState("");
  const itemsPerPage = 20;

  // Fetch officers from API. No `role` is sent: the endpoint defaults to
  // OFFICER, which is exactly what this screen lists.
  const {
    data: officersData,
    isLoading,
    error,
  } = useOfficers({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "true",
  });

  /**
   * Transform API response to table format
   */
  const tableData: OfficerTableRow[] = useMemo(() => {
    if (!officersData?.data) return [];

    return officersData.data.map((officer) => {
      const roleValue = safeText(officer.role, "OFFICER");
      const isActive = officer.isActive !== false;

      return {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        // An ADMIN has no region; every other role does
        region: formatRoleScope(roleValue, formatRegion(officer.region)),
        // Role and status are separate facts - never fold one into the other
        role: formatRole(roleValue),
        roleValue,
        phoneNo: safeText(officer.phone),
        distributors: safeNumber(officer._count?.customers, 0),
        // AD-15 - real open-ticket count, no longer hardcoded to 0
        tickets: safeNumber(officer._count?.supportTickets, 0),
        status: isActive ? "Active" : "Inactive",
        // AD-15 - null until the officer has logged in at least once
        lastLogin: officer.lastLoginAt
          ? safeDateText(officer.lastLoginAt)
          : "Never",
        createdAt: safeDateText(officer.createdAt),
        isActive,
        action: isActive ? "Deactivate" : "Reactivate",
      };
    });
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
   * Handle status filter change
   */
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: OfficerTableRow) => {
    if (action.includes("Deactivate") || action.includes("Reactivate")) {
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
  const handleOfficerCreated = (created: CreateOfficerResponse) => {
    setCredentialsEmailSent(created?.emailSent !== false);
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

  const wasDeactivation = successMessage.includes("Deactivated");

  return (
    <MainLayout>
      <div className="p-4 overflow-y-auto space-y-6 pb-30 h-screen bg-milkwhite/90">
        <ArrowBack />
        {/* Page Header Component */}
        <div className="flex flex-col-reverse md:flex-row justify-between md:items-center items-end gap-4">
          <PageHeader
            title="Account Officers"
            subtitle="Manage account officer portfolio. Officers sign in with their email address and password."
          />
          <Button
            variant="primary"
            onClick={handleNewOfficer}
            className="bg-linear-to-r from-primary via-orange to-primary flex items-center gap-1 p-1 md:gap-2"
          >
            <Image
              src={plus}
              width={50}
              height={50}
              className="w-1.5 h-1.5 md:w-2.5 md:h-2.5"
              alt="plus icon"
            />
            <span className="whitespace-nowrap md:whitespace-normal text-[12px] font-medium md:text-[14px]">
              New Officer
            </span>
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
              <div className="flex flex-wrap justify-end items-center gap-3 mt-4">
                {/* Status filter - omitted entirely means "both", the default */}
                <select
                  value={statusFilter}
                  onChange={(event) => handleStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                  className="px-3 py-2 rounded-md border border-muted/50 bg-white text-[13px] font-medium"
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

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
                  onRowClick={setDetailsRow}
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

        {/* Officer Details Modal - profile plus customer conversations */}
        <OfficerDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          officer={
            detailsRow
              ? {
                  id: detailsRow.id,
                  name: detailsRow.name,
                  email: detailsRow.email,
                  phone: detailsRow.phoneNo,
                  region: detailsRow.region,
                  role: detailsRow.roleValue,
                  status: detailsRow.status,
                  customers: detailsRow.distributors,
                  tickets: detailsRow.tickets,
                  lastLogin: detailsRow.lastLogin,
                  createdAt: detailsRow.createdAt,
                }
              : null
          }
        />

        {/* Add Account Officer Modal - this screen only creates officers */}
        <AddManagedUserModal
          isOpen={isAddOfficerModalOpen}
          onClose={() => setIsAddOfficerModalOpen(false)}
          onSuccess={handleOfficerCreated}
          roles={["OFFICER"]}
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
            setCredentialsEmailSent(true);
          }}
          title={
            wasDeactivation
              ? "Officer Deactivated Successfully"
              : "Officer Created Successfully"
          }
          message={
            wasDeactivation
              ? "The officer account has been deactivated successfully. Platform access has been revoked, and all historical records remain available for audit purposes."
              : credentialsEmailSent
                ? "The new officer account has been created successfully. They will receive an email with their login credentials."
                : "The officer account has been created. The credentials email could not be sent, so pass the password on directly."
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
