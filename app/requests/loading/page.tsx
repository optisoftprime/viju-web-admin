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
  useLoadingRequests,
  useAssignLoadingOfficer,
  useCancelLoadingRequest,
} from "@/hooks/api/useLoading";
import { safeText, safeNumber, safeDateText, humanizeEnum } from "@/utils/safe";
import { formatRegion } from "@/utils/formatter";
import { isAccountOfficer } from "@/constants/roles";
import type { LoadingRequest as ApiLoadingRequest } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";
import CancelLoadingRequestModal from "@/components/CancelLoadingRequestModal";

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
  /** Spec 39 - the loading officer's note. "-" until they write one. */
  description: string;
  action: string;
  /** Display label for the header; regionValue is the enum the API filters on */
  region: string;
  regionValue: string;
  /** Spec 39 - false once the load is finished or already called off */
  canCancel: boolean;
}

/**
 * Spec 41: a load can be called off only BEFORE loading starts.
 *
 * Spec 39 allowed IN_PROGRESS too. That is now wrong for a real reason rather
 * than a rule change: once a truck is being loaded, cancelling leaves stock
 * already moved with no waybill to account for it. COMPLETED was always final.
 *
 * ASSIGNED is included deliberately - a load with an officer on it that has
 * not started is still a plan, not work in progress, and it is the only state
 * in which the loading officer themselves can call one off (their queue never
 * contains PENDING loads, since PENDING means nobody is assigned yet).
 *
 * LC-1 is closed: the API refuses IN_PROGRESS -> CANCELLED with a 409
 * INVALID_STATUS_TRANSITION, so this list and the server agree. The button is
 * still hidden rather than left to fail - the API is the guarantee, the UI is
 * the better experience.
 */
const CANCELLABLE_STATUSES = ["PENDING", "ASSIGNED"];

/** Tab value -> API status filter. "ALL" means send nothing. */
const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "Loading In Progress" },
  { value: "COMPLETED", label: "Completed" },
  // Spec 39 - cancelled loads stay visible rather than vanishing from the list
  { value: "CANCELLED", label: "Cancelled" },
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
    // Spec 39 - the loading officer's note, empty as "-" until one is written
    key: "description" as const,
    title: "DESCRIPTION",
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
  // Spec 39 - the row whose cancellation is being confirmed
  const [cancelTarget, setCancelTarget] = useState<LoadingRequest | null>(null);
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
   *
   * Spec 39 - `useLoadingRequests` picks the route from the signed-in role, so
   * an ACCOUNT OFFICER and a REGIONAL ADMIN both land here and each reads the
   * list their own authorisation allows. Neither names a path.
   */
  const { data, isLoading, error } = useLoadingRequests({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
    status: selectedTab,
  });

  const assignMutation = useAssignLoadingOfficer();
  const cancelMutation = useCancelLoadingRequest();

  // Only the copy differs - the two roles do exactly the same job here
  const viewerIsAccountOfficer = isAccountOfficer(user?.role);

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
        // Spec 39 - written by the loading officer; a load without one is "-"
        description: safeText(row.description, "-"),
        region: formatRegion(row.region),
        regionValue: safeText(row.region, ""),
        action:
          safeText(row.status, "").toUpperCase() === "PENDING"
            ? "Assign Officer"
            : "View",
        canCancel: CANCELLABLE_STATUSES.includes(
          safeText(row.status, "PENDING").toUpperCase(),
        ),
      })),
    [rows],
  );

  const totalItems = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  /**
   * Spec 39 - CANCEL is its own column rather than a second value in ACTION:
   * ACTION already carries assign/view, and folding a destructive action into
   * the same button would make what it does depend on the row's status.
   */
  const columns = useMemo(
    () => [
      ...tableColumns,
      {
        key: "canCancel" as const,
        title: "CANCEL",
        render: (_value: unknown, row: LoadingRequest) =>
          row.canCancel ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setCancelTarget(row);
              }}
              className="text-primary underline hover:text-orange transition-colors"
            >
              Cancel
            </button>
          ) : (
            <span className="text-muted">-</span>
          ),
      },
    ],
    [],
  );

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
   * Spec 39 - call off a load. The reason is optional; when given it is what
   * the loading officer sees against the cancelled row.
   */
  const handleCancelConfirmed = async (reason: string) => {
    if (!cancelTarget?.id) return;

    try {
      await cancelMutation.mutateAsync({
        requestId: cancelTarget.id,
        body: reason ? { reason } : undefined,
      });
      setCancelTarget(null);
      setDetailsRow(null);
    } catch {
      // useCancelLoadingRequest already surfaced the API message
    }
  };

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
          subtitle={
            viewerIsAccountOfficer
              ? "Assign, track and cancel loading requests for your customers"
              : "Manage and track all loading requests"
          }
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
                {viewerIsAccountOfficer
                  ? "Requests submitted by the distributors on your accounts appear here."
                  : "Requests submitted by distributors in your region appear here."}
              </Text>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && paginatedData.length > 0 && (
            <div className="overflow-x-auto mt-6">
              <Table
                columns={columns}
                data={paginatedData}
                onRowClick={setDetailsRow}
                onActionClick={handleActionClick}
                rowKey={(row: LoadingRequest) => row.id}
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
                // Spec 39 - the loading officer's own note on this load
                {
                  label: "Description",
                  value: detailsRow?.description,
                  fullWidth: true,
                },
              ],
            },
          ]}
          footer={
            <div className="flex flex-wrap gap-3">
              {detailsRow?.rawStatus === "PENDING" && (
                <Button
                  variant="primary"
                  className="bg-linear-to-r from-primary via-orange to-primary"
                  onClick={() => {
                    setSelectedRequest(detailsRow);
                    setDetailsRow(null);
                    setIsAssignLoadingOfficerModalOpen(true);
                  }}
                >
                  Assign Officer
                </Button>
              )}
              {detailsRow?.canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setCancelTarget(detailsRow)}
                  className="border-primary text-primary"
                >
                  Cancel Request
                </Button>
              )}
            </div>
          }
        />

        {/* Assign Loading Officer Modal - fed by the row that opened it, not
            by the placeholder values it used to be pinned to */}
        <AssignLoadingOfficerModal
          isOpen={isAssignLoadingOfficerModalOpen}
          onClose={() => {
            setIsAssignLoadingOfficerModalOpen(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleLoadingOfficerAssigned}
          isSubmitting={assignMutation.isPending}
          distributor={selectedRequest?.distributor}
          truckName={selectedRequest?.truck}
          driver={selectedRequest?.driver}
          date={selectedRequest?.submitted}
          qty={selectedRequest?.quantity}
          region={selectedRequest?.region}
          regionValue={selectedRequest?.regionValue}
        />

        {/* Spec 39 - cancel confirmation, with an optional reason */}
        <CancelLoadingRequestModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirmed}
          isSubmitting={cancelMutation.isPending}
          distributor={cancelTarget?.distributor}
          waybill={cancelTarget?.waybill}
          officer={cancelTarget?.officer}
          status={cancelTarget?.status}
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
