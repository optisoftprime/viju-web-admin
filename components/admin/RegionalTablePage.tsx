"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput, Text } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import BulkAssignAccountOfficerModal from "@/components/BulkAssignAccountOfficerModal";
import SuccessModal from "@/components/SuccessModal";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import {
  useCustomers,
  useCustomer,
  useRegionalCustomers,
  useReassignCustomer,
  useBulkReassignCustomers,
} from "@/hooks/api/useCustomer";
import {
  BroadcastRegion,
  CustomerSortBy,
  SortOrder,
  isProjectedCustomer,
} from "@/lib/api/types";
import { REGIONS, resolveRegion } from "@/constants/regions";
import { canBulkAssignCustomers, normalizeStaffRole } from "@/constants/roles";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useAuthStore } from "@/store/auth.store";
import {
  formatToNairaExact,
  formatNumberExact,
  formatRegion,
} from "@/utils/formatter";
import { safeArray, safeNumber, safeText, safeDateText } from "@/utils/safe";
import {
  getErrorMessage,
  isAdminRegionRequiredError,
  isOutsideRegionError,
  isRegionNotSetError,
  isRoleForbiddenError,
} from "@/utils/apiError";
import ArrowBack from "../common/ArrowBack";

interface RegionalTablePageProps {
  region?: string;
  isAdmin?: boolean;
  /**
   * RA-07: rendered inside the regional admin portal, which reads
   * GET /regional/customers instead of GET /admin/customers. The two return
   * identical rows - only the path and the region handling differ.
   */
  regionalPortal?: boolean;
}

interface Customer {
  id: string;
  name: string;
  phoneNo: string;
  account: string;
  /** Display label; regionValue is the API enum the officer picker filters on */
  region: string;
  regionValue: string;
  officers: string;
  wallet: string;
  stock: string;
  tickets: number;
  action: string;
  /** B-1.1 - mirrors ?hasOfficer=, so the column needs no lookup */
  hasOfficer: boolean;
  /** B-1.1 - when the ERP last reported this customer */
  lastSyncedAt: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
    sortable: true,
  },
  {
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "account" as const,
    title: "CODE",
    sortable: true,
  },
  {
    key: "region" as const,
    title: "REGION",
    sortable: true,
  },
  {
    key: "officers" as const,
    title: "OFFICERS",
  },
  {
    key: "wallet" as const,
    title: "WALLET",
    sortable: true,
  },
  {
    key: "stock" as const,
    title: "STOCK",
  },
  {
    key: "tickets" as const,
    // RA-07 - _count.supportTickets is OPEN tickets only, not all-time
    title: "OPEN TICKETS",
    sortable: true,
  },
  {
    key: "action" as const,
    title: "ACTION",
  },
];

// Region tab slug -> API region enum, built from the canonical list
const regionTabs: {
  value: string;
  label: string;
  apiValue?: BroadcastRegion;
}[] = [
  { value: "all-regions", label: "All Regions", apiValue: undefined },
  ...REGIONS.map((region) => ({
    value: region.value.toLowerCase(),
    label: region.label,
    apiValue: region.value,
  })),
];

/**
 * Row key -> API sort field. Only these are accepted by GET /admin/customers;
 * anything else is a 400, so an unmapped column simply is not sortable.
 * `createdAt` is supported by the API but has no column in this table.
 */
const SORT_FIELDS: Record<string, CustomerSortBy> = {
  name: "name",
  account: "erpId",
  region: "region",
  wallet: "outstandingBalance",
  tickets: "supportTickets",
};

/**
 * Customer table used by both the admin and regional-admin views.
 * The ACTION column drives the assignment flow, so it is shown for both.
 */
function RegionalTable({ regionalPortal = false }: RegionalTablePageProps) {
  const { user } = useAuthStore();
  const role = normalizeStaffRole(user?.role);

  /**
   * A regional admin is scoped from their token, so the tab strip is hidden
   * for them and `region` is never attached. GET /admin/customers answers 403
   * REGION_NOT_ALLOWED when one sends it at all - even a value that matches
   * their own region, since the parameter is refused rather than compared -
   * and GET /regional/customers answers 403 for any region but their own.
   */
  const isRegionScopedViewer = role === "REGIONAL_ADMIN";

  /**
   * RA-07: the regional portal reads GET /regional/customers. The rows,
   * filters, sorting and meta are identical to GET /admin/customers, so only
   * the query changes here - the table below is untouched.
   */
  const usesRegionalRoute = regionalPortal || isRegionScopedViewer;

  /**
   * An ADMIN has no home region, so on the regional route they must name the
   * one they are previewing - omitting it is a 403. The tab strip therefore
   * loses its "All Regions" entry and nothing is fetched until they pick.
   * For the cross-region list they use /admin/customers instead.
   */
  const adminMustPickRegion = usesRegionalRoute && !isRegionScopedViewer;

  // Region carried over from a dashboard region card, e.g. ?region=LAGOS
  const regionParam = useQueryParam("region");

  /**
   * null means "nobody has pressed a tab yet", which is what lets the
   * ?region= deep link decide. The moment a tab is pressed the choice becomes
   * the user's and the link stops applying.
   */
  const [pickedTab, setPickedTab] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // B-1.1 - "unassigned only" is filtered by the API, not in the browser.
  // Off by default so no row is hidden without the user asking.
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  // B-1.1 - sorting is server-side; null means "server default order"
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isAssignOfficerModalOpen, setIsAssignOfficerModalOpen] =
    useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [detailsRow, setDetailsRow] = useState<Customer | null>(null);
  /**
   * Spec 39 - bulk selection. Rows are kept, not just ids: the bulk modal
   * needs each customer's name and region, and a selection made on page 1
   * has to survive a move to page 2 where those rows are no longer loaded.
   */
  const [selectedRows, setSelectedRows] = useState<Customer[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);

  /**
   * Spec 43 / BA-2: bulk assignment is on for a REGIONAL_ADMIN, and the API
   * agreed - this component is what /regional-admin/distributors renders.
   *
   * The route scopes them on both sides: every customer must be in their
   * region, and so must the receiving officer. The picker inside the modal is
   * already region-scoped, so a valid selection is all they can build.
   */
  const canBulkAssign = canBulkAssignCustomers(user?.role);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  /**
   * The active tab: the user's pick if they have made one, otherwise whatever
   * the dashboard region card linked to. Derived rather than synced in an
   * effect, so the first render already shows the linked region. An
   * unrecognised ?region= simply leaves the default "All Regions" tab.
   */
  const linkedTab = isRegionScopedViewer
    ? undefined
    : resolveRegion(regionParam)?.toLowerCase();
  // An admin previewing the regional portal has no "All Regions" fallback -
  // an unpicked strip means "nothing chosen yet", not "every region".
  const selectedTab =
    pickedTab ?? linkedTab ?? (adminMustPickRegion ? "" : "all-regions");

  // The strip an admin sees on the regional route cannot offer "All Regions"
  const visibleRegionTabs = adminMustPickRegion
    ? regionTabs.filter((tab) => tab.apiValue)
    : regionTabs;

  const selectedRegion = isRegionScopedViewer
    ? undefined
    : regionTabs.find((tab) => tab.value === selectedTab)?.apiValue;

  /** Nothing to request yet - the admin has not named a region */
  const awaitingRegionChoice = adminMustPickRegion && !selectedRegion;

  // Fetch customers from API
  // B-3 - full ERP detail for whichever row is open. Fetched lazily; the
  // modal renders from the row data until (or unless) it resolves.
  const { data: customerDetail, isLoading: isDetailLoading } = useCustomer(
    detailsRow?.id,
  );

  /**
   * The two lists take the same filters and answer the same envelope, so only
   * one of them ever runs - whichever the portal calls for.
   */
  const sharedQuery = {
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
    hasOfficer: unassignedOnly ? false : undefined,
    sortBy: sortKey ? SORT_FIELDS[sortKey] : undefined,
    sortOrder,
  };

  const adminQuery = useCustomers({
    ...sharedQuery,
    region: selectedRegion as BroadcastRegion | undefined,
    enabled: !usesRegionalRoute,
  });

  // RA-07 - `region` is omitted entirely for a regional admin: it comes from
  // their token, and naming even their own region here is only tolerated, not
  // required. An admin previewing the portal must supply one.
  const regionalQuery = useRegionalCustomers({
    ...sharedQuery,
    region: isRegionScopedViewer
      ? undefined
      : (selectedRegion as BroadcastRegion | undefined),
    enabled: usesRegionalRoute && !awaitingRegionChoice,
  });

  const {
    data: customersData,
    isLoading,
    error,
  } = usesRegionalRoute ? regionalQuery : adminQuery;

  // Assign the customer to an account officer
  const assignMutation = useReassignCustomer();
  const bulkAssignMutation = useBulkReassignCustomers();

  /**
   * Transform API response to table format
   */
  const tableData: Customer[] = useMemo(() => {
    if (!customersData?.data) return [];

    // This screen never requests unprojected rows, so every row should have a
    // portal id. Filter defensively rather than assert - a row without one
    // cannot be assigned or opened.
    return customersData.data.filter(isProjectedCustomer).map((customer) => {
      const officerNames = safeArray<{ staff?: { name?: string } | null }>(
        customer?.officerAssignments,
      )
        .map((assignment) => assignment?.staff?.name)
        .filter((name): name is string => Boolean(name && name.trim()));

      // hasOfficer is authoritative; fall back to the assignment list when the
      // API omits it (older builds, or a partially projected row)
      const hasOfficer =
        typeof customer?.hasOfficer === "boolean"
          ? customer.hasOfficer
          : officerNames.length > 0;

      const cartons = safeNumber(customer?.stockBalanceCartons, 0);

      return {
        id: customer.id,
        name: safeText(customer?.name, "Unnamed customer"),
        phoneNo: safeText(customer?.phone),
        account: safeText(customer?.erpId),
        region: formatRegion(customer?.region),
        regionValue: safeText(customer?.region, ""),
        officers: officerNames.length > 0 ? officerNames.join(", ") : "Unassigned",
        // Shown to the API's own precision - a wallet is reconciled against
        // the ERP figure, so rounding to two decimals would make the column
        // disagree with the source of truth (and with the All Customers modal)
        wallet: formatToNairaExact(safeNumber(customer?.outstandingBalance, 0)),
        // B-1.1 - cartons paid for but not loaded, not a second copy of wallet
        stock: `${formatNumberExact(cartons)} ${cartons === 1 ? "Carton" : "Cartons"}`,
        tickets: safeNumber(customer?._count?.supportTickets, 0),
        action: "Assign Officer",
        hasOfficer,
        lastSyncedAt: safeDateText(customer?.lastSyncedAt, "Not yet synced"),
      };
    });
  }, [customersData?.data]);

  /**
   * The region named in the header. The signed-in record is authoritative;
   * a row's own region is the fallback, since every row this route returns
   * carries the caller's region.
   */
  const viewerRegionLabel = useMemo(() => {
    const region = user?.region || customersData?.data?.[0]?.region;
    return region ? formatRegion(region) : "your region";
  }, [user?.region, customersData?.data]);

  /**
   * RA-07: the regional list answers three different 403s and they mean three
   * different things to the operator - a region-scope mistake, an
   * unconfigured account, and a wrong-role token. The API message is safe to
   * display, so it is shown alongside the hint that says what to do about it.
   * Anything else falls through to the ordinary failure notice.
   */
  const regionNotSet = isRegionNotSetError(error);

  const errorNotice = useMemo(() => {
    if (!error) return null;

    const message = getErrorMessage(
      error,
      "Customers could not be loaded. Please try again.",
    );

    if (regionNotSet) {
      return {
        isAccountIssue: true,
        title: "No region is set on your account",
        message,
        hint: "This is an account-configuration problem, not an empty region. Ask an admin to set your region.",
      };
    }
    if (isOutsideRegionError(error)) {
      return {
        isAccountIssue: true,
        title: "That region is outside your scope",
        message,
        hint: "Your region comes from your own record, so this list cannot be pointed at another one.",
      };
    }
    if (isAdminRegionRequiredError(error)) {
      return {
        isAccountIssue: true,
        title: "Choose a region to preview",
        message,
        hint: "An admin has no home region. Pick one above, or use the admin customers page for every region at once.",
      };
    }
    if (isRoleForbiddenError(error)) {
      return {
        isAccountIssue: true,
        title: "This page needs a different account",
        message,
        hint: "Regional customers are readable by a regional admin or an admin only.",
      };
    }

    return { isAccountIssue: false, title: "", message, hint: "" };
  }, [error, regionNotSet]);

  const totalItems = safeNumber(customersData?.meta?.total, 0);
  const totalPages = Math.max(1, safeNumber(customersData?.meta?.totalPages, 1));
  // The server clamps pageSize - report what it actually applied
  const appliedPageSize = getAppliedPageSize(customersData?.meta, itemsPerPage);

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Sort by a column. Clicking the active column flips the direction;
   * a new column starts ascending. Unknown keys are ignored rather than sent
   * to the API, which would answer 400.
   */
  const handleSort = (key: string) => {
    if (!SORT_FIELDS[key]) return;

    if (sortKey === key) {
      setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    resetPage();
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action: string, row: Customer) => {
    if (action === "Assign Officer") {
      setSelectedCustomer(row);
      setIsAssignOfficerModalOpen(true);
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
   * Assign the selected customer to the chosen officer
   * PATCH /admin/customers/{id}/reassign
   */
  /**
   * Spec 39 - keep the whole row for anything newly ticked, and drop anything
   * unticked. Rows selected on other pages are matched from what we already
   * hold, since they are not in `tableData` any more.
   */
  const handleSelectionChange = (keys: string[]) => {
    const known = new Map<string, Customer>();
    selectedRows.forEach((row) => known.set(row.id, row));
    tableData.forEach((row) => known.set(row.id, row));

    setSelectedRows(
      keys
        .map((key) => known.get(key))
        .filter((row): row is Customer => Boolean(row)),
    );
  };

  /**
   * Spec 39 - one officer takes every selected customer. Partial success is a
   * real outcome, so the summary names both halves rather than claiming the
   * whole batch landed.
   */
  const handleBulkOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    if (selectedRows.length === 0) return;

    const total = selectedRows.length;

    bulkAssignMutation.mutate(
      {
        customerIds: selectedRows.map((row) => row.id),
        request: { newOfficerId: officer.id },
      },
      {
        onSuccess: (result) => {
          setIsBulkAssignOpen(false);
          // Only the ones that landed leave the selection - whatever failed
          // stays ticked so it can be retried without re-picking it
          const failedIds = new Set(
            result.failed.map((failure) => failure.customerId),
          );
          setSelectedRows((rows) => rows.filter((row) => failedIds.has(row.id)));

          setSuccessModal({
            isOpen: true,
            title:
              result.failed.length === 0
                ? "Customers Assigned Successfully"
                : "Some Customers Could Not Be Assigned",
            message:
              result.failed.length === 0
                ? `All ${total} customers have been assigned to ${officer.name}.`
                : // The failures carry the same message the single route
                  // returns, so name the reason rather than just the count
                  `${result.succeeded.length} of ${total} customers were assigned to ${officer.name}. The ${result.failed.length} that failed are still selected so you can try again.${
                    result.failed[0].message
                      ? ` First failure: ${result.failed[0].message}`
                      : ""
                  }`,
          });
        },
      },
    );
  };

  const handleOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    if (!selectedCustomer) return;

    // Captured up front - selectedCustomer is cleared before the modal renders
    const distributorName = selectedCustomer.name;

    assignMutation.mutate(
      {
        customerId: selectedCustomer.id,
        request: { newOfficerId: officer.id },
      },
      {
        onSuccess: () => {
          setIsAssignOfficerModalOpen(false);
          setSelectedCustomer(null);
          setSuccessModal({
            isOpen: true,
            title: "Officer Assigned Successfully",
            message: `${distributorName} has been assigned to ${officer.name}.`,
          });
        },
      },
    );
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        {/* Page Header Component */}
        <PageHeader
          title="Customers"
          subtitle={
            isRegionScopedViewer
              ? `Every customer in ${viewerRegionLabel}`
              : adminMustPickRegion
                ? "Preview a single region through the regional portal"
                : "Manage all customers across every region"
          }
        />

        {/* Customers Card */}
        <Card border={false}>
          {/* Region tabs are for an organisation-wide admin only. A regional
              admin already sees exactly their own region and cannot filter
              across the boundary. */}
          {isRegionScopedViewer ? (
            <div className="rounded-lg border border-muted/20 bg-white px-4 py-3">
              <Text variant="caption" weight="medium" color="muted">
                Showing every customer in {viewerRegionLabel}.
              </Text>
            </div>
          ) : (
          <div className="">
            {/* Tab Buttons */}
            <div className="flex items-center space-x-4 md:grid grid-cols-4 lg:grid-cols-7 gap-2 overflow-x-auto md:gap-4">
              {visibleRegionTabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={selectedTab === tab.value ? "primary" : "outline"}
                  onClick={() => {
                    setPickedTab(tab.value);
                    resetPage();
                  }}
                  className={`
                    whitespace-nowrap
                    ${
                      selectedTab === tab.value
                        ? "bg-linear-to-r from-primary via-orange to-primary text-white border-0"
                        : "bg-white border border-muted/30 text-muted hover:border-primary hover:bg-primary hover:text-white"
                    }
                  `}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* RA-07 - an admin has no home region, so the regional route
                refuses the request until one is named */}
            {awaitingRegionChoice && (
              <div className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
                <Text variant="caption" weight="medium" color="orange">
                  Pick a region above to preview its customers.
                </Text>
              </div>
            )}
          </div>
          )}

          {/* Search + assignment filter */}
          <div className="flex flex-wrap items-center justify-end gap-3 mt-4">
            {/* B-1.1 - filtered by the API via ?hasOfficer=false */}
            <Button
              variant={unassignedOnly ? "primary" : "outline"}
              onClick={() => {
                setUnassignedOnly((previous) => !previous);
                resetPage();
              }}
              className={
                unassignedOnly
                  ? "bg-linear-to-r from-primary via-orange to-primary text-white border-0 whitespace-nowrap"
                  : "bg-white border border-muted/30 text-muted hover:border-primary hover:bg-primary hover:text-white whitespace-nowrap"
              }
            >
              Unassigned only
            </Button>
            {/* Server-side search on name OR erpId, debounced, resetting to
                page 1 - never a client-side filter of the current page */}
            <SearchInput
              placeholder="Search name or code"
              onSearch={handleSearch}
              debounceDelay={300}
            />
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading customers...
            </div>
          )}

          {/* The message the API sent is safe to display; the title and hint
              say which of the three region 403s it is and what to do next */}
          {errorNotice && (
            <div
              className={
                errorNotice.isAccountIssue
                  ? "mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 space-y-1"
                  : "py-6 text-center text-primary"
              }
            >
              {errorNotice.title && (
                <Text variant="caption" weight="semibold" color="orange">
                  {errorNotice.title}
                </Text>
              )}
              <Text
                variant="caption"
                weight="medium"
                color={errorNotice.isAccountIssue ? "orange" : "primary"}
              >
                {errorNotice.message}
              </Text>
              {errorNotice.hint && (
                <Text variant="caption" color="muted">
                  {errorNotice.hint}
                </Text>
              )}
            </div>
          )}

          {/* Spec 39 - the bulk bar only exists while something is selected,
              so the table is unchanged for anyone not using it */}
          {canBulkAssign && selectedRows.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <Text variant="caption" weight="semibold" color="foreground">
                {selectedRows.length} customer
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
                  onClick={() => setIsBulkAssignOpen(true)}
                  className="bg-linear-to-r from-primary via-orange to-primary whitespace-nowrap"
                >
                  Assign Account Officer
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && !awaitingRegionChoice && (
            <>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  onRowClick={setDetailsRow}
                  onActionClick={handleActionClick}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  selectable={canBulkAssign}
                  rowKey={(row: Customer) => row.id}
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

        {/* Assign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isAssignOfficerModalOpen}
          onClose={() => {
            setIsAssignOfficerModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleOfficerAssigned}
          isSubmitting={assignMutation.isPending}
          distributorName={selectedCustomer?.name}
          regionValue={selectedCustomer?.regionValue}
          distributorData={{
            distributor: selectedCustomer?.name || "N/A",
            phoneNumber: selectedCustomer?.phoneNo || "N/A",
            account: selectedCustomer?.account || "N/A",
            region: selectedCustomer?.region || "N/A",
            officers: selectedCustomer?.officers || "Unassigned",
            wallet: selectedCustomer?.wallet || "N/A",
            stock: selectedCustomer?.stock || "N/A",
            ticket: String(selectedCustomer?.tickets ?? 0),
          }}
        />

        {/* Spec 39 - bulk assignment for everything ticked above */}
        <BulkAssignAccountOfficerModal
          isOpen={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          onConfirm={handleBulkOfficerAssigned}
          isSubmitting={bulkAssignMutation.isPending}
          customers={selectedRows.map((row) => ({
            id: row.id,
            name: row.name,
            regionValue: row.regionValue,
          }))}
        />

        {/* Row Details Modal - opened by clicking any table row */}
        <RowDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          title={detailsRow?.name || "Customer"}
          subtitle="Customer details"
          sections={[
            {
              title: "CUSTOMER",
              fields: [
                { label: "Name", value: detailsRow?.name },
                { label: "Code", value: detailsRow?.account, type: "id" },
                { label: "Phone Number", value: detailsRow?.phoneNo },
                { label: "Region", value: detailsRow?.region },
                // Detail-only fields: shown once the record resolves, and
                // skipped entirely when the ERP holds no value for them
                ...(customerDetail?.email
                  ? [{ label: "Email", value: customerDetail.email }]
                  : []),
                // address is null for every customer until the ERP master
                // gains the field - render the row only when it is non-null
                ...(customerDetail?.address
                  ? [
                      {
                        label: "Address",
                        value: customerDetail.address,
                        fullWidth: true,
                      },
                    ]
                  : []),
              ],
            },
            {
              title: "Account Standing",
              fields: [
                { label: "Wallet", value: detailsRow?.wallet, type: "amount" },
                { label: "Stock", value: detailsRow?.stock },
                { label: "Open Tickets", value: detailsRow?.tickets },
                {
                  label: "Credit Limit",
                  value:
                    typeof customerDetail?.creditLimit === "number"
                      ? formatToNairaExact(customerDetail.creditLimit)
                      : isDetailLoading
                        ? "Loading..."
                        : "N/A",
                },
              ],
            },
            {
              title: "Assignment",
              fields: [
                {
                  label: "Account Officers",
                  value: detailsRow?.officers,
                  fullWidth: true,
                },
              ],
            },
            {
              title: "ERP Sync",
              fields: [
                { label: "Last Synced", value: detailsRow?.lastSyncedAt },
                {
                  label: "Record Updated",
                  value: customerDetail?.updatedAt,
                  type: "date",
                },
              ],
            },
          ]}
          footer={
            <Button
              variant="primary"
              className="bg-linear-to-r from-primary via-orange to-primary"
              onClick={() => {
                if (!detailsRow) return;
                setSelectedCustomer(detailsRow);
                setDetailsRow(null);
                setIsAssignOfficerModalOpen(true);
              }}
            >
              Assign Officer
            </Button>
          }
        />

        {/* Success Modal - shown after a successful assignment */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() =>
            setSuccessModal({ isOpen: false, title: "", message: "" })
          }
          title={successModal.title}
          message={successModal.message}
          buttonText="Continue"
        />
      </div>
    </MainLayout>
  );
}

/**
 * Regional Admin Customers Page - Protected Route Wrapper
 */
export default function RegionalTablePage({
  isAdmin = false,
  region,
  regionalPortal = false,
}: RegionalTablePageProps) {
  /**
   * Spec 44: one component, two routes, two audiences.
   *
   * `/admin/distributors` is an ADMIN screen. `/regional-admin/distributors`
   * is a REGIONAL_ADMIN one - and also admits an ADMIN, because previewing a
   * single region through the regional portal is a documented case this page
   * already handles (see `adminMustPickRegion`).
   *
   * Nobody else belongs on either: an account officer reads their own
   * portfolio through `/customers`, not the cross-region customer table.
   */
  const allow = regionalPortal
    ? ["REGIONAL_ADMIN", "ADMIN"]
    : ["ADMIN"];

  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RoleProtectedRoute allow={allow}>
        <RegionalTable
          isAdmin={isAdmin}
          region={region}
          regionalPortal={regionalPortal}
        />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
