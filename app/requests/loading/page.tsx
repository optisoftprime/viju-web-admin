"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignLoadingOfficerModal from "@/components/AssignLoadingOfficerModal";
import LoadingOfficerSuccessModal from "@/components/LoadingOfficerSuccessModal";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePagination, getTotalPages } from "@/hooks/usePagination";
import { useAuthStore } from "@/store/auth.store";
import userIcon from "@/assets/icons/usersblack.svg";

interface LoadingRequest {
  id: string;
  waybill: string;
  distributor: string;
  order: string;
  truck: string;
  driver: string;
  submitted: string;
  officer: string;
  status: string;
  action: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "waybill" as const,
    title: "WAYBILL",
  },
  {
    key: "distributor" as const,
    title: "DISTRIBUTOR",
  },
  {
    key: "order" as const,
    title: "ORDER",
  },
  {
    key: "truck" as const,
    title: "TRUCK",
  },
  {
    key: "driver" as const,
    title: "DRIVER",
  },
  {
    key: "submitted" as const,
    title: "SUBMITTED",
  },
  {
    key: "officer" as const,
    title: "OFFICER",
  },
  {
    key: "status" as const,
    title: "STATUS",
  },
];

// Mock loading requests data
const mockLoadingRequests: LoadingRequest[] = Array.from(
  { length: 25 },
  (_, i) => ({
    id: `${i + 1}`,
    waybill: `WR-0099${i + 1}`,
    distributor: "Alfaji Bello & Sons",
    order: "ORD-0098",
    truck: "LAG-234-XY",
    driver: "John Dare",
    submitted: "09:14 AM",
    officer: i % 3 === 0 ? "James Okonkwo" : "",
    status:
      i % 4 === 0
        ? "Pending"
        : i % 4 === 1
          ? "Assigned"
          : i % 4 === 2
            ? "Loading In Progress"
            : "Completed",
    action: "View",
  }),
);

function LoadingRequestPageContent() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [isAssignLoadingOfficerModalOpen, setIsAssignLoadingOfficerModalOpen] =
    useState(false);
  const [isLoadingOfficerSuccessOpen, setIsLoadingOfficerSuccessOpen] =
    useState(false);
  const [detailsRow, setDetailsRow] = useState<LoadingRequest | null>(null);
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();
  const { user } = useAuthStore();

  // Filter data based on selected tab
  const filteredData = useMemo(() => {
    if (selectedTab === "all") return mockLoadingRequests;
    return mockLoadingRequests.filter(
      (item) => item.status.toLowerCase() === selectedTab.toLowerCase(),
    );
  }, [selectedTab]);

  // Calculate pagination
  const totalItems = filteredData.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    // Search logic can be implemented here
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action: string, row: LoadingRequest) => {
    if (row.status === "Pending") {
      setIsAssignLoadingOfficerModalOpen(true);
    }
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => previousPage();

  /**
   * Handle next page button click
   */
  const handleNextPage = () =>
    nextPage(getTotalPages(totalItems, itemsPerPage));

  /**
   * Handle loading officer assignment
   */
  const handleLoadingOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    setIsLoadingOfficerSuccessOpen(true);
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Loading Requests"
          subtitle="Manage and track all loading requests"
        />

        {/* Loading Requests Card */}
        <Card border={false}>
          <div className="">
            {/* Tab Buttons */}
            <div className="flex items-center space-x-4">
              {[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "assigned", label: "Assigned" },
                { value: "loading in progress", label: "Loading In Progress" },
                { value: "completed", label: "Completed" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={selectedTab === tab.value ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedTab(tab.value);
                    resetPage();
                  }}
                  className={
                    selectedTab === tab.value
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border-0"
                      : "bg-white border border-muted/30 text-muted hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {tab.label}
                </Button>
              ))}
              {/* Search Input Component */}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto mt-6">
            <Table
              columns={tableColumns}
              data={paginatedData}
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
            onItemsPerPageChange={setPageSize}
          />
        </Card>

        {/* Row Details Modal - opened by clicking any table row */}
        <RowDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          title={detailsRow?.distributor || "Loading Request"}
          subtitle={detailsRow ? `Waybill ${detailsRow.waybill}` : undefined}
          sections={[
            {
              title: "Request",
              fields: [
                { label: "Waybill", value: detailsRow?.waybill, type: "id" },
                { label: "Order", value: detailsRow?.order, type: "id" },
                { label: "Status", value: detailsRow?.status, type: "status" },
                { label: "Submitted", value: detailsRow?.submitted },
              ],
            },
            {
              title: "Logistics",
              fields: [
                { label: "Truck", value: detailsRow?.truck },
                { label: "Driver", value: detailsRow?.driver },
              ],
            },
            {
              title: "Assignment",
              fields: [
                { label: "Distributor", value: detailsRow?.distributor },
                { label: "Loading Officer", value: detailsRow?.officer },
              ],
            },
          ]}
          footer={
            detailsRow?.status === "Pending" ? (
              <Button
                variant="primary"
                className="bg-linear-to-r from-primary via-orange to-primary"
                onClick={() => {
                  setDetailsRow(null);
                  setIsAssignLoadingOfficerModalOpen(true);
                }}
              >
                Assign Officer
              </Button>
            ) : undefined
          }
        />

        {/* Assign Loading Officer Modal */}
        <AssignLoadingOfficerModal
          isOpen={isAssignLoadingOfficerModalOpen}
          onClose={() => setIsAssignLoadingOfficerModalOpen(false)}
          onConfirm={handleLoadingOfficerAssigned}
          truckName="LAG-234-XY"
          driver="John Dare"
          date="Today, 14:00"
          qty="320 Cartons"
          region="Lagos"
        />

        {/* Loading Officer Success Modal */}
        <LoadingOfficerSuccessModal
          isOpen={isLoadingOfficerSuccessOpen}
          onClose={() => {
            setIsLoadingOfficerSuccessOpen(false);
            setIsAssignLoadingOfficerModalOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
}

/**
 * Loading Request Page - Protected Route Wrapper
 */
export default function LoadingRequestPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <LoadingRequestPageContent />
    </ProtectedRoute>
  );
}
