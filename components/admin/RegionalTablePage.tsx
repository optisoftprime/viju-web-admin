"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import SuccessModal from "@/components/SuccessModal";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import {
  useCustomers,
  useCustomer,
  useReassignCustomer,
} from "@/hooks/api/useCustomer";
import {
  BroadcastRegion,
  CustomerSortBy,
  SortOrder,
} from "@/lib/api/types";
import { REGIONS } from "@/constants/regions";
import { formatToNaira, formatRegion } from "@/utils/formatter";
import { safeArray, safeNumber, safeText, safeDateText } from "@/utils/safe";
import ArrowBack from "../common/ArrowBack";

interface RegionalTablePageProps {
  region?: string;
  isAdmin?: boolean;
}

interface Customer {
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
    title: "TICKETS",
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
function RegionalTable({}: RegionalTablePageProps) {
  const [selectedTab, setSelectedTab] = useState("all-regions");
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

  const selectedRegion = regionTabs.find(
    (tab) => tab.value === selectedTab,
  )?.apiValue;

  // Fetch customers from API
  // B-3 - full ERP detail for whichever row is open. Fetched lazily; the
  // modal renders from the row data until (or unless) it resolves.
  const { data: customerDetail, isLoading: isDetailLoading } = useCustomer(
    detailsRow?.id,
  );

  const {
    data: customersData,
    isLoading,
    error,
  } = useCustomers({
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion as BroadcastRegion | undefined,
    search: searchTerm || undefined,
    hasOfficer: unassignedOnly ? false : undefined,
    sortBy: sortKey ? SORT_FIELDS[sortKey] : undefined,
    sortOrder,
  });

  // Assign the customer to an account officer
  const assignMutation = useReassignCustomer();

  /**
   * Transform API response to table format
   */
  const tableData: Customer[] = useMemo(() => {
    if (!customersData?.data) return [];

    return customersData.data.map((customer) => {
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
        officers: officerNames.length > 0 ? officerNames.join(", ") : "Unassigned",
        wallet: formatToNaira(safeNumber(customer?.outstandingBalance, 0)),
        // B-1.1 - cartons paid for but not loaded, not a second copy of wallet
        stock: `${cartons.toLocaleString()} ${cartons === 1 ? "Carton" : "Cartons"}`,
        tickets: safeNumber(customer?._count?.supportTickets, 0),
        action: "Assign Officer",
        hasOfficer,
        lastSyncedAt: safeDateText(customer?.lastSyncedAt, "Not yet synced"),
      };
    });
  }, [customersData?.data]);

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
          subtitle="Manage all customers in your region"
        />

        {/* Customers Card */}
        <Card border={false}>
          <div className="">
            {/* Tab Buttons */}
            <div className="flex items-center space-x-4 md:grid grid-cols-6 gap-2 overflow-x-auto md:gap-4">
              {regionTabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={selectedTab === tab.value ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedTab(tab.value);
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
          </div>

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
            <SearchInput
              placeholder="Search name or code"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading customers...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-primary">
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
                  onRowClick={setDetailsRow}
                  onActionClick={handleActionClick}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={handleSort}
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
                      ? formatToNaira(customerDetail.creditLimit)
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
}: RegionalTablePageProps) {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RegionalTable isAdmin={isAdmin} region={region} />
    </ProtectedRoute>
  );
}
