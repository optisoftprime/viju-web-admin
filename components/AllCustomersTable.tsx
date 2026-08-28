"use client";

import { useMemo, useState } from "react";
import { Text, Table, SearchInput } from "@/components/common";
import Pagination from "@/components/Pagination";
import RowDetailsModal from "@/components/RowDetailsModal";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useCustomers, useRegionalCustomers } from "@/hooks/api/useCustomer";
import { useOfficerCustomersPage } from "@/hooks/api/useDashboard";
import { useAuthStore } from "@/store/auth.store";
import { normalizeStaffRole } from "@/constants/roles";
import {
  formatRegion,
  formatToNairaExact,
  formatNumberExact,
} from "@/utils/formatter";
import { safeArray, safeNumber, safeText, safeDateText } from "@/utils/safe";
import {
  BroadcastRegion,
  CustomerWithOfficers,
  OfficerCustomer,
} from "@/lib/api/types";

export interface AllCustomersTableProps {
  /**
   * Whether the queries should run. The page always fetches; the flag remains
   * for any caller that mounts this behind something closed.
   */
  enabled?: boolean;
  region?: BroadcastRegion;
  /**
   * Chrome around the table. "modal" keeps the dialog's own height cap and
   * scroll; "page" lets the page own both, so the table does not scroll
   * inside a scrolling page.
   */
  variant?: "modal" | "page";
}

interface CustomerRow {
  /** Portal record id - null for an ERP-only row */
  id: string | null;
  /** Unique across the union, so this is the React key */
  erpId: string;
  name: string;
  account: string;
  phoneNo: string;
  region: string;
  officers: string;
  wallet: string;
  stock: string;
  tickets: number | string;
  /** AO-C1 - officer view only; the admin list carries no unread signal */
  unread: number | string;
  lastSyncedAt: string;
  isProjected: boolean;
}

/**
 * Every nullable field renders through this one fallback rather than a
 * per-cell isProjected check: lastSyncedAt can be null on a projected row too,
 * and when projection starts working the fallbacks simply stop firing.
 */
const EMPTY = "—";

/** Cartons rendered exactly as the API sent them, never rounded */
const formatCartons = (cartons: number): string =>
  `${formatNumberExact(cartons)} ${cartons === 1 ? "Carton" : "Cartons"}`;

const tableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
    render: (value: unknown, row: CustomerRow) => (
      <span className="inline-flex items-center gap-2">
        <span>{String(value ?? EMPTY)}</span>
        {!row.isProjected && (
          <span
            title="In the ERP, not yet in the portal"
            className="shrink-0 rounded-full bg-orange/15 text-orange text-[10px] font-semibold px-2 py-0.5"
          >
            ERP only
          </span>
        )}
      </span>
    ),
  },
  { key: "account" as const, title: "CODE" },
  { key: "phoneNo" as const, title: "PHONE NO" },
  { key: "region" as const, title: "REGION" },
  { key: "officers" as const, title: "OFFICERS" },
  { key: "wallet" as const, title: "WALLET" },
  { key: "stock" as const, title: "STOCK" },
  { key: "tickets" as const, title: "TICKETS" },
];

/**
 * The officer view adds UNREAD - the admin customer list carries no unread
 * signal, so the column would render an em-dash on every row there.
 */
const officerTableColumns = [
  ...tableColumns,
  { key: "unread" as const, title: "UNREAD" },
];

/**
 * All Customers Modal
 *
 * Opened from the dashboard's Total Customers tile. The source follows the
 * signed-in role, because the two are not interchangeable:
 *
 *  - ADMIN / REGIONAL_ADMIN read GET /admin/customers in union mode
 *    (`includeUnprojected=true`) so `meta.total` equals the tile's count and
 *    the table can page through every customer the ERP knows about. Rows the
 *    portal has not copied yet come back with `isProjected: false` and only
 *    erpId / name / phone / region populated - they are dimmed, badged, and
 *    not clickable, since opening one needs a portal id they do not have.
 *  - A REGIONAL_ADMIN reads GET /regional/customers, where the region is
 *    resolved from their staff record. `region` is never sent - naming one is
 *    a 403 - so the modal cannot leak another region even by accident.
 *  - An OFFICER is not authorised on either admin route, so their view reads
 *    GET /officers/customers instead: the customers assigned to them, with the
 *    columns that endpoint actually returns.
 *
 * `search` is applied SERVER-side in all three cases and `meta.total` counts
 * the filtered set, so the pager arithmetic holds while a search is active.
 */
/**
 * The customers table shared by the "Total Customers" surfaces.
 *
 * Spec 42 moved the admin and regional admin onto a PAGE; spec 43 moved the
 * account officer too, so the dialog is gone entirely and `variant="modal"` is
 * now only a layout option rather than a second caller.
 *
 * The query branching, the ERP projection notice and the row details live here
 * once, which is what let the container change three times without any of that
 * being rewritten.
 */
export default function AllCustomersTable({
  enabled = true,
  region,
  variant = "modal",
}: AllCustomersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailsRow, setDetailsRow] = useState<CustomerRow | null>(null);

  const { user } = useAuthStore();
  const role = normalizeStaffRole(user?.role);
  const isOfficerView = role === "OFFICER";
  const isRegionalView = role === "REGIONAL_ADMIN";

  const {
    currentPage,
    pageSize,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  // Only the source that matches the role reaches the network
  const adminQuery = useCustomers({
    page: currentPage,
    pageSize,
    region,
    search: searchTerm || undefined,
    includeUnprojected: true,
    enabled: enabled && !isOfficerView && !isRegionalView,
  });

  /**
   * RA-07. `region` is deliberately NOT forwarded: on this route it is
   * resolved from the caller's staff record, and a regional admin naming any
   * region - even their own - is a 403.
   */
  const regionalQuery = useRegionalCustomers({
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
    includeUnprojected: true,
    enabled: enabled && isRegionalView,
  });

  const officerQuery = useOfficerCustomersPage({
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
    enabled: enabled && isOfficerView,
  });

  const { data, isLoading, error } = isOfficerView
    ? officerQuery
    : isRegionalView
      ? regionalQuery
      : adminQuery;

  const tableData: CustomerRow[] = useMemo(() => {
    if (isOfficerView) {
      // GET /officers/customers has no ERP-projection concept, so every row
      // here is a real portal record
      return safeArray<OfficerCustomer>(data?.data).map((customer, index) => ({
        id: typeof customer?.id === "string" ? customer.id : null,
        erpId: safeText(customer?.accountNumber, `row-${index}`),
        name: safeText(customer?.name, "Unnamed customer"),
        account: safeText(customer?.accountNumber, EMPTY),
        phoneNo: safeText(customer?.phone, EMPTY),
        region: formatRegion(customer?.region),
        // Every row on this route is assigned to the signed-in officer
        officers: safeText(user?.name, "You"),
        wallet:
          typeof customer?.walletBalance === "number"
            ? formatToNairaExact(customer.walletBalance)
            : EMPTY,
        // AO-P2 - always a number on this route, computed by the same helper
        // that backs /admin/customers, so the column means the same thing here
        stock: formatCartons(safeNumber(customer?.stockBalanceCartons, 0)),
        tickets: safeNumber(customer?.openTickets, 0),
        unread: safeNumber(customer?.unreadMessages, 0),
        lastSyncedAt: safeDateText(customer?.lastContactDate, EMPTY),
        isProjected: true,
      }));
    }

    return safeArray<CustomerWithOfficers>(data?.data).map(
      (customer, index) => {
        // Absent means default mode, where every row is projected
        const isProjected = customer?.isProjected !== false;

        const officerNames = safeArray<{ staff?: { name?: string } | null }>(
          customer?.officerAssignments,
        )
          .map((assignment) => assignment?.staff?.name)
          .filter((name): name is string => Boolean(name && name.trim()));

        const cartons = customer?.stockBalanceCartons;
        const balance = customer?.outstandingBalance;

        return {
          id: typeof customer?.id === "string" ? customer.id : null,
          erpId: safeText(customer?.erpId, `row-${index}`),
          name: safeText(customer?.name, "Unnamed customer"),
          account: safeText(customer?.erpId, EMPTY),
          phoneNo: safeText(customer?.phone, EMPTY),
          region: formatRegion(customer?.region),
          officers:
            officerNames.length > 0
              ? officerNames.join(", ")
              : isProjected
                ? "Unassigned"
                : EMPTY,
          // Shown to the API's own precision - a wallet is reconciled against
          // the ERP figure, so rounding -10,140,600.1232 to two decimals would
          // make the column disagree with the source of truth
          wallet:
            typeof balance === "number" ? formatToNairaExact(balance) : EMPTY,
          stock: typeof cartons === "number" ? formatCartons(cartons) : EMPTY,
          tickets: isProjected
            ? safeNumber(customer?._count?.supportTickets, 0)
            : EMPTY,
          // Unread counts are an officer-portfolio signal only
          unread: EMPTY,
          lastSyncedAt: safeDateText(customer?.lastSyncedAt, EMPTY),
          isProjected,
        };
      },
    );
  }, [data?.data, isOfficerView, user?.name]);

  const totalItems = safeNumber(data?.meta?.total, 0);
  const totalPages = Math.max(1, safeNumber(data?.meta?.totalPages, 1));
  const appliedPageSize = getAppliedPageSize(data?.meta, pageSize);

  /**
   * Branch on the value, not on the key existing: environments with no ERP
   * feed return 0 here, and the notice must stay hidden there.
   */
  const unprojectedTotal = safeNumber(data?.meta?.unprojectedTotal, 0);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /** Opening a customer needs a portal record, so ERP-only rows do nothing */
  const handleRowClick = (row: CustomerRow) => {
    if (!row.isProjected) return;
    setDetailsRow(row);
  };

  return (
    <>
      <div
        className={
          variant === "modal"
            ? "w-full max-w-6xl mx-auto max-h-[85vh] overflow-y-auto p-1"
            : "w-full"
        }
      >
        {/* Header */}
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            {isOfficerView
              ? "My Customers"
              : isRegionalView
                ? "Regional Customers"
                : "All Customers"}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            {isLoading
              ? "Loading customers..."
              : error
                ? "Customers could not be loaded"
                : `${totalItems.toLocaleString()} ${
                    totalItems === 1 ? "customer" : "customers"
                  }${
                    isOfficerView
                      ? " assigned to you"
                      : isRegionalView
                        ? " in your region"
                        : ""
                  }`}
          </Text>
        </div>

        {/* Hides itself once the ERP backlog reaches zero */}
        {!isLoading && !error && unprojectedTotal > 0 && (
          <div className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
            <Text variant="caption" weight="bold" color="orange">
              Showing all {totalItems.toLocaleString()} customers
            </Text>
            <Text variant="small" weight="medium" color="muted">
              {unprojectedTotal.toLocaleString()} are in the ERP but not yet
              in the portal due to duplicate phone no — greyed rows are
              read-only until the duplicate phone no is corrected.
            </Text>
          </div>
        )}

        {/* Search */}
        <div className="flex justify-end mt-4">
          <SearchInput
            placeholder="Search name or code"
            onSearch={handleSearch}
            debounceDelay={500}
          />
        </div>

        {/* States */}
        {isLoading && (
          <div className="py-8 text-center">
            <Text variant="caption" color="muted">
              Loading customers...
            </Text>
          </div>
        )}

        {!isLoading && error && (
          <div className="py-8 text-center">
            <Text variant="caption" color="primary">
              Customers could not be loaded. Please try again.
            </Text>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto mt-4">
              <Table
                columns={isOfficerView ? officerTableColumns : tableColumns}
                data={tableData}
                onRowClick={handleRowClick}
                onActionClick={() => {}}
                rowClassName={(row) =>
                  row.isProjected ? undefined : "opacity-60"
                }
                // id is null for ERP-only rows, so erpId is the identity
                rowKey={(row) => row.erpId}
              />
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={appliedPageSize}
              onPrevious={previousPage}
              onNext={() => nextPage(totalPages)}
              onItemsPerPageChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Row details - only reachable for a projected customer */}
      <RowDetailsModal
        open={!!detailsRow}
        onClose={() => setDetailsRow(null)}
        title={detailsRow?.name || "Customer"}
        subtitle="Customer details"
        sections={[
          {
            title: "Customer",
            fields: [
              { label: "Name", value: detailsRow?.name },
              { label: "Code", value: detailsRow?.account, type: "id" },
              { label: "Phone Number", value: detailsRow?.phoneNo },
              { label: "Region", value: detailsRow?.region },
            ],
          },
          {
            title: "Account Standing",
            fields: [
              { label: "Wallet", value: detailsRow?.wallet, type: "amount" },
              { label: "Stock", value: detailsRow?.stock },
              { label: "Open Tickets", value: detailsRow?.tickets },
              ...(isOfficerView
                ? [{ label: "Unread Messages", value: detailsRow?.unread }]
                : []),
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
            title: isOfficerView ? "Activity" : "ERP Sync",
            fields: [
              {
                label: isOfficerView ? "Last Contact" : "Last Synced",
                value: detailsRow?.lastSyncedAt,
              },
            ],
          },
        ]}
      />
    </>
  );
}
