"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput, Text } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AddManagedUserModal from "@/components/AddAccountOfficerFormModal";
import PreviewAccountOfficerModal from "@/components/PreviewAccountOfficerModal";
import OfficerDetailsModal from "@/components/OfficerDetailsModal";
import BulkReassignOfficersModal from "@/components/BulkReassignOfficersModal";
import SuccessModal from "@/components/SuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { useOfficers, useBulkSetOfficerRegion } from "@/hooks/api/useOfficer";
import plus from "@/assets/icons/plus.svg";
import Image from "next/image";
import { formatRegion } from "@/utils/formatter";
import { safeText, safeNumber, safeDateText } from "@/utils/safe";
import {
  canBulkReassignOfficerRegion,
  formatRole,
  formatRoleScope,
  normalizeStaffRole,
} from "@/constants/roles";
import { REGION_FILTER_TABS } from "@/constants/regions";
import { useAuthStore } from "@/store/auth.store";
import { STATUS_FILTER_OPTIONS } from "@/constants/roles";
import type { BroadcastRegion, CreateOfficerResponse } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";

// Interface for officer data structure (transformed from API)
interface OfficerTableRow {
  id: string;
  name: string;
  email: string;
  /** Display label; regionValue is the API enum the region picker writes */
  region: string;
  regionValue: string;
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
  /**
   * The success notice, as the title and body it will actually render.
   *
   * It used to be one string that the modal re-derived a title from by
   * substring-matching ("Deactivated"), which only worked while there were
   * exactly two outcomes. Spec 39 adds bulk reassignment, so the outcome is
   * now stated where it is known rather than inferred where it is shown.
   */
  const [successNotice, setSuccessNotice] = useState<{
    title: string;
    message: string;
  }>({ title: "", message: "" });

  // State for selected officer
  const [selectedOfficer, setSelectedOfficer] =
    useState<OfficerTableRow | null>(null);

  // Row click opens the read-only profile; the ACTION button opens the
  // deactivate flow, so the two are tracked separately
  const [detailsRow, setDetailsRow] = useState<OfficerTableRow | null>(null);

  /**
   * Spec 39 - bulk selection. Whole rows are kept, not just ids: the modal
   * needs each officer's name, region and customer count, and a selection
   * made on page 1 has to survive a move to page 2 where those rows are no
   * longer loaded.
   */
  const [selectedRows, setSelectedRows] = useState<OfficerTableRow[]>([]);
  const [isBulkReassignOpen, setIsBulkReassignOpen] = useState(false);

  /**
   * Spec 40: PATCH /admin/officers/bulk-region stays ADMIN-only - moving an
   * officer between regions is an organisation-wide act. This screen is not
   * on a regional admin's sidebar, but a URL is a URL.
   */
  const { user } = useAuthStore();
  const canBulkReassign = canBulkReassignOfficerRegion(user?.role);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  // "" means no isActive filter at all, which is the API's default
  const [statusFilter, setStatusFilter] = useState("");
  /**
   * "" means no `region` param at all, which is how the API says "every
   * region" - there is no wildcard value to send.
   */
  const [regionFilter, setRegionFilter] = useState("");
  const itemsPerPage = 20;

  /**
   * The region picker is an ADMIN control.
   *
   * For a REGIONAL_ADMIN this route is pinned to their own region from the
   * token: a `region` param is ACCEPTED AND IGNORED, answering 200 with their
   * own region either way. A dropdown that appears to work and changes nothing
   * is worse than no dropdown, so it is not rendered for them at all.
   *
   * This screen is already ADMIN-only behind `RoleProtectedRoute`, so in
   * practice the guard never fires - it is here so the rule travels with the
   * control if the component is ever reused somewhere less restricted.
   *
   * NOTE this deliberately differs from GET /admin/customers, which REFUSES a
   * region a regional admin may not see. Nothing leaks either way: scope is
   * read from the token, so no query string can widen it.
   */
  const canFilterByRegion = normalizeStaffRole(user?.role) === "ADMIN";

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
    /**
     * Sent only when one is chosen. An unknown query parameter is a 400 on
     * this route - it rejects properties it does not recognise - so a blank
     * value must not reach the wire.
     */
    region: canFilterByRegion && regionFilter ? regionFilter : undefined,
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
        regionValue: safeText(officer.region, ""),
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

  const bulkReassignMutation = useBulkSetOfficerRegion();

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
   * Handle region filter change.
   *
   * The page must restart: `meta.total` counts what the new filter matches, so
   * page 3 of Lagos is very likely past the end of Eastern.
   */
  const handleRegionFilter = (value: string) => {
    setRegionFilter(value);
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
   * Spec 39 - keep the whole row for anything newly ticked, and drop anything
   * unticked. Rows selected on another page are matched from what we already
   * hold, since they are not in `tableData` any more.
   */
  const handleSelectionChange = (keys: string[]) => {
    const known = new Map<string, OfficerTableRow>();
    selectedRows.forEach((row) => known.set(row.id, row));
    tableData.forEach((row) => known.set(row.id, row));

    setSelectedRows(
      keys
        .map((key) => known.get(key))
        .filter((row): row is OfficerTableRow => Boolean(row)),
    );
  };

  /**
   * Spec 39 - move every selected officer into one region. A partial move is
   * a real outcome, so the summary names both halves and whatever failed stays
   * ticked for a retry.
   */
  const handleBulkReassign = (region: BroadcastRegion) => {
    if (selectedRows.length === 0) return;

    const total = selectedRows.length;

    bulkReassignMutation.mutate(
      { officerIds: selectedRows.map((row) => row.id), region },
      {
        onSuccess: (result) => {
          setIsBulkReassignOpen(false);
          const failedIds = new Set(
            result.failed.map((failure) => failure.officerId),
          );
          setSelectedRows((rows) =>
            rows.filter((row) => failedIds.has(row.id)),
          );

          setSuccessNotice(
            result.failed.length === 0
              ? {
                  title: "Officers Reassigned Successfully",
                  message: `All ${total} officers are now in ${formatRegion(region)}.`,
                }
              : {
                  title: "Some Officers Could Not Be Reassigned",
                  message: `${result.succeeded.length} of ${total} officers moved to ${formatRegion(region)}. The ${result.failed.length} that failed are still selected so you can try again.${
                    result.failed[0].message
                      ? ` First failure: ${result.failed[0].message}`
                      : ""
                  }`,
                },
          );
          setIsSuccessModalOpen(true);
        },
      },
    );
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
    // false only means the credentials email did not go out - the account exists
    const emailSent = created?.emailSent !== false;
    setSuccessNotice({
      title: "Officer Created Successfully",
      message: emailSent
        ? "The new officer account has been created successfully. They will receive an email with their login credentials."
        : "The officer account has been created. The credentials email could not be sent, so pass the password on directly.",
    });
    setIsSuccessModalOpen(true);
  };

  /**
   * Handle successful officer deactivation
   */
  const handleOfficerDeactivated = () => {
    setSuccessNotice({
      title: "Officer Deactivated Successfully",
      message:
        "The officer account has been deactivated successfully. Platform access has been revoked, and all historical records remain available for audit purposes.",
    });
    setIsSuccessModalOpen(true);
  };

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
          {/*
            The filters live ABOVE the loading and error branches, not inside
            them.

            They used to sit inside `!isLoading && !error`, which had three
            consequences: they were absent on first paint, they UNMOUNTED on
            every filter change (React Query has no cache for the new key, so
            `isLoading` goes true - taking the search box's focus with it), and
            a failed request left no controls at all, so there was no way to
            change the filter that might recover it.
          */}
          {/*
              Region filter as a TAB STRIP, matching the customers, audits
              and reassignment tables. It was a third dropdown sitting beside
              the status one, which is where it went unnoticed - three
              identical grey selects in a row read as one control.

              The six regions come from the canonical list rather than from
              the current page, which would only ever show regions that
              happen to have officers.
            */}
          {canFilterByRegion && (
            <div className="flex items-center flex-wrap gap-3 mt-4">
              {REGION_FILTER_TABS.map((option) => (
                <Button
                  key={option.value || "all"}
                  variant={
                    regionFilter === option.value ? "primary" : "outline"
                  }
                  onClick={() => handleRegionFilter(option.value)}
                  className={
                    regionFilter === option.value
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border border-primary whitespace-nowrap"
                      : "bg-white border border-muted/30 text-muted hover:border-primary hover:bg-primary hover:text-white whitespace-nowrap"
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

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
              {/* Spec 39 - the bulk bar only exists while something is
                  selected, so the table is unchanged for anyone not using it */}
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

              {/*
                A region with no officers answers `data: []` with a valid
                `meta` - never a 404 - so an empty result is a staffing fact,
                not a failure. Worth saying plainly for OTHERS in particular:
                it is a real region holding real distributors that simply has
                nobody assigned to it yet, and a bare "No data available" reads
                like the filter is broken.
              */}
              {tableData.length === 0 ? (
                <div className="mt-6 rounded-lg border border-muted/20 bg-white px-4 py-8 text-center">
                  <Text variant="caption" weight="bold" color="foreground">
                    No account officers
                    {regionFilter ? ` in ${formatRegion(regionFilter)}` : ""}
                  </Text>
                  <Text variant="caption" color="muted">
                    {regionFilter
                      ? "Nobody is assigned to this region yet. Create an officer here, or move one across from another region."
                      : "Nothing matches the current filters."}
                  </Text>
                </div>
              ) : (
                <div className="overflow-x-auto mt-6">
                  <Table
                    columns={tableColumns}
                    data={tableData}
                    onRowClick={setDetailsRow}
                    onActionClick={handleActionClick}
                    selectable={canBulkReassign}
                    rowKey={(row: OfficerTableRow) => row.id}
                    selectedKeys={selectedRows.map((row) => row.id)}
                    onSelectionChange={handleSelectionChange}
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
                  regionValue: detailsRow.regionValue,
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

        {/* Spec 39 - bulk region reassignment for everything ticked above */}
        <BulkReassignOfficersModal
          isOpen={isBulkReassignOpen}
          onClose={() => setIsBulkReassignOpen(false)}
          onConfirm={handleBulkReassign}
          isSubmitting={bulkReassignMutation.isPending}
          officers={selectedRows.map((row) => ({
            id: row.id,
            name: row.name,
            regionValue: row.regionValue,
            customers: row.distributors,
          }))}
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
            setSuccessNotice({ title: "", message: "" });
          }}
          title={successNotice.title}
          message={successNotice.message}
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
      <RoleProtectedRoute allow={["ADMIN"]}>
        <AccountOfficersContent />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
