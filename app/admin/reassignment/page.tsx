"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useCustomersForReassignment } from "@/hooks/api/useCustomer";
import { useReassignCustomer } from "@/hooks/api/useCustomer";
import { customerService } from "@/services/customer.service";
import { BroadcastRegion } from "@/lib/api/types";
import ExportRecord from "@/components/ExportRecord";

// Interface for customer data structure (transformed from API)
interface CustomerTableRow {
  id: string;
  name: string;
  phoneNo: string;
  account: string;
  region: string;
  officers: string;
  wallet: string;
  stock: string;
  tickets: number;
  action: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "name" as const,
    title: "DISTRIBUTOR",
  },
  {
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "account" as const,
    title: "ACCOUNT",
  },
  {
    key: "region" as const,
    title: "REGION",
  },
  {
    key: "officers" as const,
    title: "OFFICERS",
  },
  {
    key: "wallet" as const,
    title: "WALLET",
  },
  {
    key: "stock" as const,
    title: "STOCK",
  },
  {
    key: "tickets" as const,
    title: "TICKETS",
  },
  {
    key: "action" as const,
    title: "ACTION",
  },
];

// Region options for tabs
const regions = [
  { name: "All Regions", value: "" },
  { name: "Lagos", value: "LAGOS" },
  { name: "South West", value: "SOUTH_WEST" },
  { name: "South East", value: "SOUTH_EAST" },
  { name: "North", value: "NORTH" },
];

function CustomerReassignmentContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("");

  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // State for reassign modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerTableRow | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch customers from API
  const {
    data: customersData,
    isLoading,
    error,
  } = useCustomersForReassignment({
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion ? (selectedRegion as BroadcastRegion) : undefined,
    search: searchTerm || undefined,
  });

  // Reassign customer mutation
  const reassignMutation = useReassignCustomer();

  /**
   * Transform API response to table format
   */
  const tableData: CustomerTableRow[] = useMemo(() => {
    if (!customersData?.data) return [];

    return customersData.data.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phoneNo: customer.phone,
      account: customer.erpId,
      region: customer.region,
      officers: customer.officerAssignments?.[0]?.staff?.name || "Unassigned",
      wallet: `₦${customer.outstandingBalance?.toLocaleString() || "0"}`,
      stock: `₦${customer.outstandingBalance?.toLocaleString() || "0"}`,
      tickets: customer._count?.supportTickets || 0,
      action: "Reassign Officer",
    }));
  }, [customersData?.data]);

  const totalItems = customersData?.meta.total || 0;
  const totalPages = customersData?.meta.totalPages || 1;

  /**
   * Reset pagination when region changes
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setCurrentPage(1);
  };

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);

    setCurrentPage(1);
  };

  const downloadCsvFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(
      new Blob([blob], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      const csvBlob = await customerService.exportCustomers({
        region: selectedRegion
          ? (selectedRegion as BroadcastRegion)
          : undefined,
        search: searchTerm || undefined,
      });
      downloadCsvFile(csvBlob, "viju-customers.csv");
    } catch (error) {
      console.error("Customer export failed", error);
    }
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: CustomerTableRow) => {
    if (action.includes("Reassign")) {
      setSelectedCustomer(row);
      setIsReassignModalOpen(true);
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
   * Handle officer assignment
   */
  const handleOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    if (selectedCustomer) {
      reassignMutation.mutate(
        {
          customerId: selectedCustomer.id,
          request: {
            newOfficerId: officer.id,
          },
        },
        {
          onSuccess: () => {
            setIsReassignModalOpen(false);
            setSelectedCustomer(null);
          },
        },
      );
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Customer Reassignment"
            subtitle="Reassign account officers to customers"
          />
          <ExportRecord onClick={handleExport} />
        </div>

        {/* Customer List Card */}
        <Card border={false}>
          {/* Tabs and Search Bar Section */}
          <div className="">
            {/* Region Filter Tabs */}
            <div className="flex items-center space-x-6 flex-wrap gap-4">
              {regions.map((region) => (
                <Button
                  key={region.value}
                  variant={
                    selectedRegion === region.value ? "primary" : "outline"
                  }
                  onClick={() => handleRegionChange(region.value)}
                  className={
                    selectedRegion === region.value
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border border-primary"
                      : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {region.name}
                </Button>
              ))}

              {/* Search Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or account"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading customers...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-red-500">
              Error loading customers. Please try again.
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && (
            <>
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

        {/* Reassign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleOfficerAssigned}
          distributorName={selectedCustomer?.name}
        />
      </div>
    </MainLayout>
  );
}

/**
 * Customer Reassignment Page - Protected Route Wrapper
 */
export default function CustomerReassignmentPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <CustomerReassignmentContent />
    </ProtectedRoute>
  );
}
