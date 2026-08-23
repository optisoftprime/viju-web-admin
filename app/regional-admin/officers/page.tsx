"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import OfficerDetailsModal from "@/components/OfficerDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useOfficers } from "@/hooks/api/useOfficer";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime, formatRegion } from "@/utils/formatter";
import { safeText, safeNumber, safeDateText } from "@/utils/safe";
import { formatRole } from "@/constants/roles";
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

          {/* Data Table */}
          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  onRowClick={setDetailsRow}
                  onActionClick={() => {}}
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
      <RegionalAdminOfficersContent />
    </ProtectedRoute>
  );
}
