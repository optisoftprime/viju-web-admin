"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Table, SearchInput, Button } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import OfficerDetailsModal from "@/components/OfficerDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useOfficers, useBulkSetOfficerRegion } from "@/hooks/api/useOfficer";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime, formatRegion } from "@/utils/formatter";
import { safeText, safeNumber, safeDateText } from "@/utils/safe";
import { canBulkReassignOfficerRegion, formatRole } from "@/constants/roles";
import BulkReassignOfficersModal from "@/components/BulkReassignOfficersModal";
import SuccessModal from "@/components/SuccessModal";
import type { BroadcastRegion } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";

// Row shape rendered by the table (flattened from the API officer)
interface OfficerRow {
  id: string;
  officer: string;
  email: string;
  region: string;
  role: string;
  /** Wire role value behind the label */
  roleValue: string;
  /** API enum for the region - what the bulk reassign modal writes back */
  regionValue: string;
  phoneNo: string;
  customers: number;
  tickets: number;
  status: string;
  lastLogin: string;
  createdAt: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "officer" as const,
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
    key: "customers" as const,
    title: "CUSTOMERS",
  },
  {
    key: "status" as const,
    title: "STATUS",
  },
  {
    key: "createdAt" as const,
    title: "CREATED AT",
  },
];

function RegionalAdminOfficersContent() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [detailsRow, setDetailsRow] = useState<OfficerRow | null>(null);

  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  /** Spec 43 - bulk selection state */
  const [selectedRows, setSelectedRows] = useState<OfficerRow[]>([]);
  const [isBulkReassignOpen, setIsBulkReassignOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<{
    title: string;
    message: string;
  }>({ title: "", message: "" });

  const bulkReassignMutation = useBulkSetOfficerRegion();

  /**
   * The signed-in admin's own region, used for the page copy only.
   *
   * It is NOT sent to the API: GET /admin/officers derives the scope from the
   * token and merely tolerates a `region` param, so sending one adds nothing
   * and would drift from the customer list, which refuses it outright.
   */
  const region = user?.region ?? undefined;

  const {
    data: officersData,
    isLoading,
    error,
  } = useOfficers({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
  });

  /**
   * Transform the API response into table rows
   */
  const tableData: OfficerRow[] = useMemo(() => {
    if (!officersData?.data) return [];

    return officersData.data.map((officer) => ({
      id: officer.id,
      officer: officer.name,
      email: officer.email,
      region: formatRegion(officer.region),
      regionValue: safeText(officer.region, ""),
      role: formatRole(officer.role, "Account Officer"),
      roleValue: safeText(officer.role, "OFFICER"),
      phoneNo: safeText(officer.phone),
      customers: safeNumber(officer._count?.customers, 0),
      tickets: safeNumber(officer._count?.supportTickets, 0),
      status: officer.isActive === false ? "Inactive" : "Active",
      lastLogin: officer.lastLoginAt ? safeDateText(officer.lastLoginAt) : "Never",
      createdAt: officer.createdAt ? formatDateTime(officer.createdAt) : "N/A",
    }));
  }, [officersData?.data]);

  const totalItems = officersData?.meta.total || 0;
  const totalPages = officersData?.meta.totalPages || 1;
  // The server clamps pageSize - report what it actually applied
  const appliedPageSize = getAppliedPageSize(officersData?.meta, itemsPerPage);

  /**
   * Spec 44 re-asks for bulk region reassignment here after the backend
   * refused it as BA-1, so it is on again - the client has now asked twice and
   * that is their decision to make.
   *
   * **It will 403 until the API is reopened.** The failure surfaces through
   * the same per-officer reporting as any other, so nothing is swallowed, but
   * nothing will move either. See BA-1 round 2 in
   * `BACKEND_REQUEST_CANCELLED_BY_AND_REGIONAL_BULK.md`.
   */
  const canBulkReassign = canBulkReassignOfficerRegion(user?.role);

  const handleSelectionChange = (keys: string[]) => {
    const known = new Map<string, OfficerRow>();
    selectedRows.forEach((row) => known.set(row.id, row));
    tableData.forEach((row) => known.set(row.id, row));

    setSelectedRows(
      keys
        .map((key) => known.get(key))
        .filter((row): row is OfficerRow => Boolean(row)),
    );
  };

  /**
   * A partial move is a real outcome on this route, so both halves are named
   * and whatever failed stays ticked for a retry.
   */
  const handleBulkReassign = (nextRegion: BroadcastRegion) => {
    if (selectedRows.length === 0) return;

    const total = selectedRows.length;

    bulkReassignMutation.mutate(
      { officerIds: selectedRows.map((row) => row.id), region: nextRegion },
      {
        onSuccess: (result) => {
          setIsBulkReassignOpen(false);

          const failedIds = new Set(
            result.failed.map((failure) => failure.officerId),
          );
          setSelectedRows((rows) => rows.filter((row) => failedIds.has(row.id)));

          setSuccessNotice(
            result.failed.length === 0
              ? {
                  title: "Officers Reassigned Successfully",
                  message: `All ${total} officers are now in ${formatRegion(nextRegion)}.`,
                }
              : {
                  title: "Some Officers Could Not Be Reassigned",
                  message: `${result.succeeded.length} of ${total} officers moved to ${formatRegion(nextRegion)}. The ${result.failed.length} that failed are still selected so you can try again.${
                    result.failed[0].message
                      ? ` First failure: ${result.failed[0].message}`
                      : ""
                  }`,
                },
          );
          setIsSuccessOpen(true);
        },
      },
    );
  };

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => previousPage();

  /**
   * Handle next page button click
   */
  const handleNextPage = () => nextPage(totalPages);

  return (
    <MainLayout>
      <div className="px-4 pt-4 space-y-3 pb-30 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        {/* Page Header Component */}
        <PageHeader
          title="Account Officers"
          subtitle={
            region
              ? `View all account officers in ${formatRegion(region)}`
              : "View all account officers in your region"
          }
        />

        {/* The list cannot be scoped without a region on the signed-in user */}
        {!region && (
          <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
            <Text variant="caption" weight="medium" color="orange">
              Your account has no region set, so this list is not filtered by
              region. Contact an administrator to have your region assigned.
            </Text>
          </div>
        )}

        {/* Officers Card */}
        <Card border={false}>
          {/* Search */}
          <div className="flex justify-end">
            <SearchInput
              placeholder="Search officers"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-6 text-center">
              <Text variant="caption" color="muted">
                Loading officers...
              </Text>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-6 text-center">
              <Text variant="caption" color="primary">
                Error loading officers. Please try again.
              </Text>
            </div>
          )}

          {/* Spec 43 - only while something is ticked */}
          {canBulkReassign && selectedRows.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <Text variant="caption" weight="semibold" color="foreground">
                {selectedRows.length} officer
                {selectedRows.length === 1 ? "" : "s"} selected
              </Text>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRows([])}
                  className="bg-white border border-muted/30 text-muted"
                >
                  Clear selection
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsBulkReassignOpen(true)}
                  className="bg-linear-to-r from-primary via-orange to-primary whitespace-nowrap"
                >
                  Reassign Region
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  onRowClick={setDetailsRow}
                  onActionClick={() => {}}
                  selectable={canBulkReassign}
                  rowKey={(row: OfficerRow) => row.id}
                  selectedKeys={selectedRows.map((row) => row.id)}
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              {/* Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={appliedPageSize}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
                onItemsPerPageChange={setPageSize}
              />
            </>
          )}
        </Card>

        {/* Spec 43 - bulk region reassignment for everything ticked above */}
        <BulkReassignOfficersModal
          isOpen={isBulkReassignOpen}
          onClose={() => setIsBulkReassignOpen(false)}
          onConfirm={handleBulkReassign}
          isSubmitting={bulkReassignMutation.isPending}
          officers={selectedRows.map((row) => ({
            id: row.id,
            name: row.officer,
            regionValue: row.regionValue,
            customers: row.customers,
          }))}
        />

        <SuccessModal
          isOpen={isSuccessOpen}
          onClose={() => {
            setIsSuccessOpen(false);
            setSuccessNotice({ title: "", message: "" });
          }}
          title={successNotice.title}
          message={successNotice.message}
        />

        {/* Officer Details Modal - profile plus customer conversations */}
        <OfficerDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          officer={
            detailsRow
              ? {
                  id: detailsRow.id,
                  name: detailsRow.officer,
                  email: detailsRow.email,
                  phone: detailsRow.phoneNo,
                  region: detailsRow.region,
                  role: detailsRow.roleValue,
                  status: detailsRow.status,
                  customers: detailsRow.customers,
                  tickets: detailsRow.tickets,
                  lastLogin: detailsRow.lastLogin,
                  createdAt: detailsRow.createdAt,
                }
              : null
          }
        />

      </div>
    </MainLayout>
  );
}

/**
 * Regional Admin Officers Page - Protected Route Wrapper
 */
export default function RegionalAdminOfficersPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RoleProtectedRoute allow={["REGIONAL_ADMIN", "ADMIN"]}>
        <RegionalAdminOfficersContent />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
