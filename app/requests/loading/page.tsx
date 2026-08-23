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
import { usePagination } from "@/hooks/usePagination";
import { useAuthStore } from "@/store/auth.store";
import {
  useRegionalLoadingRequests,
  useAssignLoadingOfficer,
} from "@/hooks/api/useLoading";
import { safeText, safeNumber, safeDateText, humanizeEnum } from "@/utils/safe";
import type { LoadingRequest as ApiLoadingRequest } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";

interface LoadingRequest {
  id: string;
  waybill: string;
  distributor: string;
  order: string;
  truck: string;
  driver: string;
  submitted: string;
  officer: string;
  /** Humanised for display; rawStatus keeps the API value for logic */
  status: string;
  rawStatus: string;
  quantity: string;
  action: string;
}

/** Tab value -> API status filter. "ALL" means send nothing. */
const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "Loading In Progress" },
  { value: "COMPLETED", label: "Completed" },
] as const;

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
  {
    key: "action" as const,
    title: "ACTION",
  },
];

function LoadingRequestPageContent() {
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LoadingRequest | null>(
    null,
  );
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

  /**
   * RA-06 - region is derived from the token, never sent as a query param.
   * The server paginates, so no client-side slicing.
   */
  const { data, isLoading, error } = useRegionalLoadingRequests({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
    status: selectedTab,
  });

  const assignMutation = useAssignLoadingOfficer();

  const rows: ApiLoadingRequest[] = data?.data ?? [];

  const paginatedData: LoadingRequest[] = useMemo(
    () =>
      rows.map((row) => ({
        id: safeText(row.id, ""),
        waybill: safeText(row.waybill, "-"),
        distributor: safeText(row.distributorName, "Unknown distributor"),
        // On this route the ERP reference lives in `reference`, NOT orderId
        order: safeText(row.reference, "-"),
        truck: safeText(row.truckPlateNumber),
        driver: safeText(row.driverName),
        submitted: safeDateText(row.submittedAt),
        officer: safeText(row.assignedOfficer?.name, "Unassigned"),
        status: humanizeEnum(row.status, "Pending"),
        rawStatus: safeText(row.status, "PENDING").toUpperCase(),
        quantity:
          row.quantityCartons != null
            ? `${safeNumber(row.quantityCartons)} Cartons`
            : "N/A",
        action:
          safeText(row.status, "").toUpperCase() === "PENDING"
            ? "Assign Officer"
            : "View",
      })),
    [rows],
  );

  const totalItems = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  /**
   * Handle search input - server-side, so reset to page 1
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Handle action button click - only PENDING rows can be assigned
   */
  const handleActionClick = (action: string, row: LoadingRequest) => {
    if (row.rawStatus === "PENDING") {
      setSelectedRequest(row);
      setIsAssignLoadingOfficerModalOpen(true);
    } else {
      setDetailsRow(row);
    }
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => previousPage();

  /**
   * Handle next page button click
   */
  const handleNextPage = () => nextPage(totalPages);

  /**
   * Handle loading officer assignment
   */
  const handleLoadingOfficerAssigned = async (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    if (!selectedRequest?.id) return;

    try {
      await assignMutation.mutateAsync({
        requestId: selectedRequest.id,
        body: { loadingOfficerId: officer.id },
      });
      setIsAssignLoadingOfficerModalOpen(false);
      setSelectedRequest(null);
      setIsLoadingOfficerSuccessOpen(true);
    } catch {
      // useAssignLoadingOfficer already surfaced the API message
    }
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
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
              {STATUS_TABS.map((tab) => (
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
            </div>
          </div>

          {/* Search Input Component */}
          <div className="flex justify-end mt-4">
            <SearchInput
              placeholder="Search waybill, order, distributor, truck or driver"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {isLoading && (
            <div className="py-8 text-center">
              <Text variant="caption" color="muted">
                Loading requests...
              </Text>
            </div>
          )}

          {!isLoading && error && (
            <div className="py-8 text-center">
              <Text variant="caption" color="muted">
                Could not load loading requests. Please try again.
              </Text>
            </div>
          )}

          {!isLoading && !error && paginatedData.length === 0 && (
            <div className="py-8 text-center">
              <Text variant="body" weight="bold" color="foreground">
                No loading requests
              </Text>
              <Text variant="caption" color="muted">
                Requests submitted by distributors in your region appear here.
              </Text>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && paginatedData.length > 0 && (
            <div className="overflow-x-auto mt-6">
              <Table
                columns={tableColumns}
                data={paginatedData}
                onRowClick={setDetailsRow}
                onActionClick={handleActionClick}
              />
            </div>
          )}

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
          isSubmitting={assignMutation.isPending}
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
