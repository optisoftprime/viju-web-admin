"use client";

import Link from "next/link";

import { useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import TicketsUI from "@/components/ticket/TicketsUI";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import AssignLoadingOfficerModal from "@/components/AssignLoadingOfficerModal";
import LoadingOfficerSuccessModal from "@/components/LoadingOfficerSuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RowDetailsModal from "@/components/RowDetailsModal";
import { usePagination, getTotalPages } from "@/hooks/usePagination";
import { DEFAULT_SECTION_PAGE_SIZE } from "@/constants/pagination";
import OverviewSection from "@/components/OverviewSection";
import OrdersSection from "@/components/OrdersSection";
import InvoicesSection from "@/components/InvoicesSection";
import StockSection from "@/components/StockSection";
import WaybillsSection from "@/components/WaybillsSection";
import arrowRight from "@/assets/icons/arrow-right.svg";
import { normalizeStaffRole } from "@/constants/roles";
import { resolveRegion } from "@/constants/regions";
import {
  useDashboardStats,
  useDashboardTableData,
  useNextUnreadCustomer,
} from "@/hooks/api/useDashboard";

import {
  useDistributorOverview,
  useDistributorOrders,
  useDistributorInvoices,
  useDistributorStock,
  useDistributorWaybills,
  useOfficerTickets,
} from "@/hooks/api/useOfficerCustomer";
import {
  AdminDashboardStats,
  OfficerDashboardStats,
  OfficerCustomer,
  OfficerCustomerFilter,
  OfficerTicket,
  PendingLoadingRequest,
  RegionalAdminDashboardResponse,
} from "@/lib/api/types";
import {
  AlertCircle,
  Boxes,
  Loader2,
  MessageSquare,
  Ticket,
  Truck,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { TextExtremeEnd } from "@/components/common/TextExtremeEnd";
import {
  formatToNaira,
  formatToNairaExact,
  formatNumberExact,
} from "@/src/utils/formatter";
import { UNRESOLVED_TICKET_STATUSES } from "@/constants/tickets";
import { useGreeting, getPortalName } from "@/src/utils/greeting";
import { safeArray, safeDateText, safeNumber, safeText } from "@/utils/safe";
import { buildErpCaption } from "@/utils/erp";
import Image from "next/image";
import { useAuthStore } from "@/src/store/auth.store";
import { useRouter } from "next/navigation";
import LoadingOfficer from "@/components/loadingOfficer/LoadingOfficer";
import ExportRecord from "@/components/ExportRecord";
import { auditService } from "@/services/audit.service";
import { downloadCsvFile } from "@/src/utils/download";
import { getErrorMessage } from "@/src/utils/apiError";
import { toast } from "sonner";
import ArrowBack from "@/components/common/ArrowBack";

// Interface for distributor data structure
interface Distributor {
  id: string;
  name: string;
  account: string;
  balance: string;
  /** AO-P2 - cartons paid for but not yet loaded */
  stock: string;
  lastPurchase: string;
  openTickets: number;
  /** AO-C1 - messages the distributor sent that are still unread */
  unreadMessages: number;
  lastContact: string;
  status: string;
  action: string;
}

interface AdminDashboardCard {
  region: {
    name: string;
    dist: number;
  };
  distributors: number;
  walletBalance: number;
  openTickets: number;
  activeOfficers: number;
}

interface AdminDashboardSummary {
  totalCustomers: number;
  totalOutstandingBalance: number;
  activeOfficers: number;
  openTickets: number;
  unReadMessage: number;
}

// Table columns definition
const tableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
  },
  {
    key: "account" as const,
    title: "CODE",
  },
  {
    key: "balance" as const,
    title: "BALANCE",
  },
  {
    key: "lastPurchase" as const,
    title: "LAST PURCHASE",
  },
  {
    key: "openTickets" as const,
    title: "OPEN TICKET",
  },
  {
    key: "lastContact" as const,
    title: "LAST CONTACT",
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

const officerTableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
  },
  {
    key: "account" as const,
    title: "CODE",
  },
  {
    key: "balance" as const,
    title: "BALANCE",
  },
  {
    key: "stock" as const,
    title: "STOCK",
  },
  {
    key: "lastPurchase" as const,
    title: "LAST PURCHASE",
  },
  {
    key: "openTickets" as const,
    title: "OPEN TICKET",
  },
  {
    // AO-C1 - so the officer can see who is waiting without opening each row
    key: "unreadMessages" as const,
    title: "UNREAD",
  },
  {
    key: "lastContact" as const,
    title: "LAST CONTACT",
  },
];

// Table columns for loading requests (REGIONAL_ADMIN)
const loadingRequestTableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
  },
  {
    key: "account" as const,
    title: "ORDER",
  },
  {
    key: "lastPurchase" as const,
    title: "LOADING DATE",
  },
  {
    key: "lastContact" as const,
    title: "VEHICLE",
  },
  {
    key: "balance" as const,
    title: "QTY",
  },
  {
    key: "status" as const,
    title: "STATUS",
  },
  // {
  //   key: "action" as const,
  //   title: "ACTION",
  // },
];

// Mock distributor data for admin users (fallback)
const mockDistributorData: Distributor[] = [
  {
    id: "1",
    name: "Ade Foods Ltd",
    account: "VJ-00987",
    balance: "₦1,240,000",
    stock: "420 Cartons",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    unreadMessages: 0,
    lastContact: "2026-03-23",
    status: "Pending",
    action: "View",
  },
  {
    id: "2",
    name: "KJ Fresh Mart",
    account: "VJ-00987",
    balance: "₦1,240,000",
    stock: "310 Cartons",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    unreadMessages: 0,
    lastContact: "2026-03-23",
    status: "Success",
    action: "View",
  },
];

function DashboardContent() {
  const router = useRouter();
  // State for active tab filter (sent to /officers/customers as boolean flags)
  const [selectedTab, setSelectedTab] = useState<OfficerCustomerFilter>("all");

  // State for selected detail tab (Overview, Orders, Chat, Tickets, etc.)
  const [selectedDetailTab, setSelectedDetailTab] = useState("Overview");

  // State for selected distributor to show details
  const [selectedDistributor, setSelectedDistributor] =
    useState<Distributor | null>(null);

  // State for selected distributor ID (for API calls)
  const [selectedDistributorId, setSelectedDistributorId] = useState<
    string | null
  >(null);

  // State for orders pagination
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(DEFAULT_SECTION_PAGE_SIZE);

  // State for waybills pagination
  /** The Invoices tab is server-paginated now - it used to slice in the browser */
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(
    DEFAULT_SECTION_PAGE_SIZE,
  );
  const [waybillPage, setWaybillPage] = useState(1);
  const [waybillPageSize, setWaybillPageSize] = useState(
    DEFAULT_SECTION_PAGE_SIZE,
  );

  // State for assign officer modal
  const [isAssignOfficerModalOpen, setIsAssignOfficerModalOpen] =
    useState(false);

  // State for assign loading officer modal
  const [isAssignLoadingOfficerModalOpen, setIsAssignLoadingOfficerModalOpen] =
    useState(false);

  // State for loading officer success modal
  const [isLoadingOfficerSuccessOpen, setIsLoadingOfficerSuccessOpen] =
    useState(false);

  // State for pagination
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();
  const [searchTerm, setSearchTerm] = useState("");

  // State for the row details modal (regional admin loading requests)
  const [detailsRow, setDetailsRow] = useState<Distributor | null>(null);

  // Opened by the Total Customers tile

  /**
   * Ticket the Open Tickets tile is sending the officer to.
   *
   * `statFocusKey` re-keys TicketsUI so a second click on the tile reopens the
   * thread even after the reader closed the first one.
   */
  const [autoOpenTicketId, setAutoOpenTicketId] = useState<string | null>(null);
  const [statFocusKey, setStatFocusKey] = useState(0);

  // Scroll target for the distributor detail panel, so a tile that selects a
  // customer brings the conversation into view rather than leaving it below
  // the fold
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  // State for the admin CSV export
  const [isExporting, setIsExporting] = useState(false);

  // Fetch dashboard stats
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();
  const {
    data: tableData,
    isLoading: tableLoading,
    error: tableError,
  } = useDashboardTableData({
    search: searchTerm || undefined,
    filter: selectedTab,
  });
  const { user } = useAuthStore();

  /**
   * The signed-in role, collapsed onto the wire vocabulary.
   * "ACCOUNT_OFFICER" and "OFFICER" name the same role; every branch below
   * tests this rather than user.role so neither spelling can miss.
   */
  const role = normalizeStaffRole(user?.role);

  // Greeting that follows the viewer's local time of day
  const greeting = useGreeting();
  const firstName = user?.name?.trim().split(" ")[0];
  const portalName = getPortalName(user?.role);

  /**
   * Backing data for the two officer tiles that jump to a customer.
   *
   * Both are now single, precise requests rather than a scan:
   *  - AO-T1 gave /tickets/officer a `status` filter, so the API returns one
   *    unresolved ticket instead of a page of 50 to sift through.
   *  - AO-C1 gave /officers/customers an `unreadMessages` filter and a
   *    `lastMessageAt` sort, so the distributor who has waited longest comes
   *    back directly. That reads Message.readAt, so unlike the notification
   *    feed it does not go stale when the officer marks the bell read.
   *
   * The unread lookup is a mutation rather than a query: the tile needs the
   * answer at the moment it is clicked, and a cached one would send the
   * officer to the wrong conversation.
   */
  const isOfficer = normalizeStaffRole(user?.role) === "OFFICER";

  const { data: nextOpenTicketData } = useOfficerTickets(1, 1, {
    enabled: isOfficer,
    status: [...UNRESOLVED_TICKET_STATUSES],
  });
  const { mutateAsync: findNextUnreadCustomer, isPending: isFindingUnread } =
    useNextUnreadCustomer();

  // Fetch officer customer data (Overview, Orders, Invoices, Stock)
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useDistributorOverview(selectedDistributorId);
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useDistributorOrders(selectedDistributorId, orderPage, orderPageSize);
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useDistributorInvoices(selectedDistributorId, {
    page: invoicePage,
    pageSize: invoicePageSize,
  });
  const {
    data: stockData,
    isLoading: stockLoading,
    error: stockError,
  } = useDistributorStock(selectedDistributorId);
  const {
    data: waybillsData,
    isLoading: waybillsLoading,
    error: waybillsError,
  } = useDistributorWaybills(
    selectedDistributorId,
    waybillPage,
    waybillPageSize,
  );

  /**
   * Format a count for a stat tile.
   * ERP counts are still being reconciled, so a stat can arrive undefined or
   * null - render 0 rather than "NaN".
   */
  const formatNumber = (num: unknown) => formatNumberExact(safeNumber(num, 0));

  /**
   * Money is rendered to the API's own precision.
   *
   * The currency style fixes the output at two decimals, which silently
   * rounded ERP balances like -10,140,600.1232. Every wallet and balance in
   * the app now goes through the exact formatter instead.
   */
  const formatCurrency = (num: unknown) =>
    formatToNairaExact(safeNumber(num, 0));

  /**
   * Helper function to format date.
   * `lastPurchaseDate` is nullable - a distributor who has never ordered has
   * none - so a missing value reads as "N/A" rather than "Invalid Date".
   */
  const formatDate = (dateString?: string | null) =>
    safeDateText(dateString, "N/A");

  // Map officer customers to table format
  const mapOfficerCustomersToTable = (
    customers: OfficerCustomer[],
  ): Distributor[] => {
    return customers.map((customer) => {
      const cartons = safeNumber(customer?.stockBalanceCartons, 0);

      return {
        id: customer.id,
        name: customer.name,
        account: customer.accountNumber,
        balance: formatCurrency(customer.walletBalance),
        // AO-P2 - always a number on this route, so no em-dash branch
        stock: `${formatNumberExact(cartons)} ${
          cartons === 1 ? "Carton" : "Cartons"
        }`,
        lastPurchase: formatDate(customer.lastPurchaseDate),
        openTickets: safeNumber(customer?.openTickets, 0),
        unreadMessages: safeNumber(customer?.unreadMessages, 0),
        lastContact: formatDate(customer.lastContactDate),
        status: customer.accountStatus,
        action: "View",
      };
    });
  };

  /**
   * Map admin data to card format.
   * byRegion is optional and each member can be null while the ERP projector
   * is behind, so everything is normalised to a concrete value here.
   */
  const mapAdminDashboardDataToCard = (
    adminStats?: AdminDashboardStats | null,
  ): AdminDashboardCard[] => {
    return safeArray<NonNullable<AdminDashboardStats["byRegion"]>[number]>(
      adminStats?.byRegion,
    ).map((stat) => ({
      region: {
        name: safeText(stat?.region?.name, "Unknown"),
        dist: safeNumber(stat?.region?.dist, 0),
      },
      distributors: safeNumber(stat?.distributors, 0),
      walletBalance: safeNumber(stat?.walletBalance, 0),
      openTickets: safeNumber(stat?.openTickets, 0),
      activeOfficers: safeNumber(stat?.activeOfficers, 0),
    }));
  };

  const adminCardData = useMemo(() => {
    if (role === "ADMIN" && dashboardStats) {
      return mapAdminDashboardDataToCard(dashboardStats as AdminDashboardStats);
    }
    return [];
  }, [dashboardStats]);

  // Map pending loading requests to table format
  const mapPendingLoadingRequestsToTable = (
    requests: PendingLoadingRequest[],
  ): Distributor[] => {
    return requests.map((request) => ({
      id: request.id,
      name: request.distributorName,
      account: request.reference,
      balance: `${formatNumberExact(request.quantityCartons)} Cartons`,
      // A loading request is not a customer row - the officer-only columns
      // have no meaning here and the regional table never renders them
      stock: "N/A",
      lastPurchase: formatDate(request.loadingDate),
      openTickets: 0,
      unreadMessages: 0,
      lastContact: formatDate(request.submittedAt),
      status: request.status,
      action: "View",
    }));
  };

  // Transform table data based on role
  const transformedTableData: Distributor[] | AdminDashboardCard[] =
    useMemo(() => {
      if (role === "OFFICER" && Array.isArray(tableData)) {
        return mapOfficerCustomersToTable(tableData as OfficerCustomer[]);
      }

      if (role === "ADMIN") {
        return mapAdminDashboardDataToCard(tableData as AdminDashboardStats);
      }

      // RA-02 - live branch. pendingLoadingRequests stays empty until
      // distributors submit loading requests, so guard for a missing array.
      if (role === "REGIONAL_ADMIN") {
        const regionalData = tableData as
          | RegionalAdminDashboardResponse
          | undefined;
        return mapPendingLoadingRequestsToTable(
          Array.isArray(regionalData?.pendingLoadingRequests)
            ? regionalData.pendingLoadingRequests
            : [],
        );
      }

      return mockDistributorData;
    }, [tableData, role]);

  // Calculate pagination
  const totalItems = transformedTableData?.length || 0;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transformedTableData?.slice(startIndex, endIndex) || [];
  }, [transformedTableData, currentPage, itemsPerPage]);

  // Determine stats display based on user role
  const renderStats = () => {
    if (statsLoading) {
      return (
        <>
          <StatCard icon={Loader2} label="Loading..." value="..." />
          <StatCard icon={Loader2} label="Loading..." value="..." />
          <StatCard icon={Loader2} label="Loading..." value="..." />
          <StatCard icon={Loader2} label="Loading..." value="..." />
        </>
      );
    }

    if (statsError || !dashboardStats) {
      return (
        <>
          <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
          <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
          <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
          <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
        </>
      );
    }

    if (role === "ADMIN") {
      const stats = dashboardStats as AdminDashboardStats;
      return (
        <>
          <StatCard
            icon={Users}
            label="Total Customers"
            value={formatNumber(stats.totalActiveCustomers)}
            // caption={buildErpCaption(stats)} client said - do not show this
            // Spec 42 - a full page, not a dialog
            onClick={() => router.push("/customers")}
            actionLabel="View all customers"
          />
          {/* B-1.2 - pairs with the "Unassigned only" filter on the customer list */}
          <StatCard
            icon={UserX}
            label="Unassigned Customers"
            value={formatNumber(stats.customersWithoutOfficer)}
            onClick={() => router.push("/admin/reassignment")}
            actionLabel="Go to reassignment"
          />
          {/* Both tiles land on the Interaction Audit screen with the matching
              tab already selected - see `?tab=` on @app/admin/audits */}
          <StatCard
            icon={MessageSquare}
            label="Unread Messages"
            value={formatNumber(stats.unReadMessage)}
            onClick={() => router.push("/admin/audits?tab=chat")}
            actionLabel="View chat audit"
          />
          <StatCard
            icon={Ticket}
            label="Open Tickets"
            value={formatNumber(stats.openTickets)}
            onClick={() => router.push("/admin/audits?tab=ticket")}
            actionLabel="View ticket audit"
          />
        </>
      );
    }

    if (role === "OFFICER") {
      const stats = dashboardStats as OfficerDashboardStats;
      return (
        <>
          <StatCard
            icon={Users}
            label="Total Customers"
            value={formatNumber(stats.totalDistributors)}
            // Spec 43 - the page, like the admin and regional admin tiles.
            // The dialog and its state are gone from this screen entirely.
            onClick={() => router.push("/customers")}
            actionLabel="View my customers"
          />
          <StatCard
            icon={Wallet}
            label="Overdue Balances"
            value={formatCurrency(stats.overdueBalances)}
            onClick={() => {
              setSelectedTab("overdue");
              resetPage();
            }}
            actionLabel="Filter overdue customers"
          />
          {/* Both tiles select the owning customer, switch to the right tab
              and show the conversation - no manual row hunting */}
          <StatCard
            icon={Ticket}
            label="Open Tickets"
            value={formatNumber(stats.openTickets)}
            onClick={handleOpenTicketsStat}
            actionLabel="Open the next ticket"
          />
          <StatCard
            icon={MessageSquare}
            label="Unread Messages"
            value={formatNumber(stats.unreadMessages)}
            onClick={handleUnreadMessagesStat}
            actionLabel="Open the next chat"
          />
        </>
      );
    }

    // REGIONAL_ADMIN stats from API response
    if (role === "REGIONAL_ADMIN") {
      if (!tableData || !("summary" in tableData)) {
        return (
          <>
            <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
            <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
            <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
            <StatCard icon={AlertCircle} label="Error Loading" value="N/A" />
          </>
        );
      }
      const regionalData = tableData as RegionalAdminDashboardResponse;
      const summary = regionalData.summary;
      return (
        <>
          {/* The customer list is scoped server-side from the token, so the
              modal is opened without a region - sending one is a 403 for a
              regional admin (see BACKEND_API_REQUESTS.md, RA-C1) */}
          <StatCard
            icon={Users}
            label="Total Customers"
            value={formatNumber(summary.totalDistributors)}
            // Spec 42 - a full page, not a dialog. No region is sent: a
            // regional admin's scope comes from their token.
            onClick={() => router.push("/customers")}
            actionLabel="View all customers"
          />
          {/* Spec 40 - into the ticket audit, which is now region-scoped for
              a regional admin, rather than the standalone tickets screen */}
          <StatCard
            icon={Ticket}
            label="Open Tickets"
            value={formatNumber(summary.openTickets)}
            onClick={() => router.push("/admin/audits?tab=ticket")}
            actionLabel="View ticket audit"
          />
          <StatCard
            icon={Truck}
            label="Pending Waybills"
            value={formatNumber(summary.pendingWaybills)}
          />
          <StatCard
            icon={UserCheck}
            label="Active Officers"
            value={formatNumber(summary.activeOfficers)}
            onClick={() => router.push("/regional-admin/officers")}
            actionLabel="Go to officers"
          />
        </>
      );
    }

    // Default stats
    return (
      <>
        <StatCard icon={Boxes} label="Total Distributions" value="256" />
        <StatCard icon={Wallet} label="Overdue Balance" value="₦190,980,000" />
        <StatCard icon={MessageSquare} label="Unread Messages" value="40" />
        <StatCard icon={Ticket} label="Open Tickets" value="4" />
      </>
    );
  };

  /**
   * Handle search input from SearchInput component
   * Can be extended to filter the distributor data
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Handle tab filter change
   * Changing the value re-keys the query, which refetches with the new params
   */
  const handleTabChange = (filter: OfficerCustomerFilter) => {
    setSelectedTab(filter);
    resetPage();
  };

  /**
   * Handle action button click on table rows
   * Shows what action was clicked (View, Edit, Delete, etc.)
   */
  const handleActionClick = (action: string, row: Distributor) => {};

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
   * Handle officer assignment
   */
  const handleOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    // The modal no longer closes itself - the caller owns the close
    setIsAssignOfficerModalOpen(false);
  };

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

  /**
   * Export the audit ticket records as CSV (ADMIN only)
   */
  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const csvBlob = await auditService.exportTickets({
        keyword: searchTerm || undefined,
      });
      downloadCsvFile(csvBlob, "viju-audit-tickets.csv");
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to export records");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDistributorSelect = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setSelectedDistributorId(distributor.id);
    setSelectedDetailTab("Overview"); // Reset to Overview tab when a new distributor is selected
    setOrderPage(1); // Reset order page
    setInvoicePage(1); // Reset invoice page - it is server-paginated now
    setWaybillPage(1); // Reset waybill page
    setAutoOpenTicketId(null);
  };

  /**
   * Select a customer and land on a specific detail tab.
   *
   * The row is taken from the table when the customer is already listed, so
   * the balances and dates stay real; otherwise a minimal row is built from
   * whatever the ticket or notification carried. Every panel below fetches by
   * `selectedDistributorId`, so a thin row is enough to open the detail view -
   * which is what lets a tile jump to a customer who is not on the current
   * page or filter.
   */
  const focusCustomer = (
    customer: { id: string; name?: string | null },
    detailTab: string,
  ) => {
    const existing = (transformedTableData as Distributor[]).find(
      (row) => row?.id === customer.id,
    );

    setSelectedDistributor(
      existing ?? {
        id: customer.id,
        name: safeText(customer.name, "Customer"),
        account: "N/A",
        balance: "N/A",
        stock: "N/A",
        lastPurchase: "N/A",
        openTickets: 0,
        unreadMessages: 0,
        lastContact: "N/A",
        status: "",
        action: "View",
      },
    );
    setSelectedDistributorId(customer.id);
    setSelectedDetailTab(detailTab);
    setOrderPage(1);
    setInvoicePage(1);
    setWaybillPage(1);

    // The panel mounts on this state change, so the scroll waits a frame
    requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  /**
   * Open Tickets tile - jump to a customer with an unresolved ticket, land on
   * the Tickets tab and open that ticket's thread straight away.
   *
   * The table is switched to the Active Ticket filter at the same time, so the
   * list underneath shows the customers that actually have tickets rather than
   * leaving the officer to guess which row it came from.
   */
  const handleOpenTicketsStat = () => {
    const ticket = safeArray<OfficerTicket>(nextOpenTicketData?.data)[0];

    if (!ticket?.customerId) {
      toast.info("No open tickets right now.");
      return;
    }

    setSelectedTab("activeTickets");
    resetPage();
    focusCustomer(
      { id: ticket.customerId, name: ticket.customer?.name },
      "Tickets",
    );
    setAutoOpenTicketId(ticket.id);
    setStatFocusKey((key) => key + 1);
  };

  /**
   * Unread Messages tile - open the conversation of the distributor who has
   * been waiting longest.
   *
   * Spec 41 moved chat off this page, so the tile now deep-links into the Chat
   * screen with that customer named rather than selecting a row here and
   * switching to a tab that no longer exists. The rest of the list is right
   * there in the left column, which is what the "Unread Messages" table filter
   * used to provide.
   */
  const handleUnreadMessagesStat = async () => {
    if (isFindingUnread) return;

    try {
      const customer = await findNextUnreadCustomer();

      if (!customer?.id) {
        toast.info("No unread customer messages right now.");
        return;
      }

      router.push(`/chat?customer=${encodeURIComponent(customer.id)}`);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not open the next unread conversation"),
      );
    }
  };
  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        {role !== "LOADING_OFFICER" && (
          <>
            {/* Page Header Component */}
            <div className="flex items-center justify-between ">
              <PageHeader
                title={firstName ? `${greeting}, ${firstName}` : greeting}
                subtitle={`Welcome back to the Viju ${portalName}`}
              />

              {role === "ADMIN" && (
                <ExportRecord onClick={handleExport} isLoading={isExporting} />
              )}
            </div>
            {/* B-2 - visible pipeline state instead of a silently short list */}

            {/* Stats Cards Grid - admin carries one extra tile */}
            <div
              className={`grid grid-cols-1 gap-4 md:grid-cols-4 ${
                role === "ADMIN" ? "lg:grid-cols-4" : ""
              }`}
            >
              {renderStats()}
            </div>
          </>
        )}

        {role === "ADMIN" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-14">
            {adminCardData?.map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded border border-muted/60 bg-white space-y-2"
              >
                <TextExtremeEnd
                  left={stat.region.name}
                  leftVariant="body"
                  leftColor="foreground"
                  leftWeight="bold"
                  right={`Customers - ${stat.region.dist}`}
                />
                <TextExtremeEnd
                  left="Account Balance"
                  right={formatToNaira(stat.walletBalance)}
                />
                <TextExtremeEnd left="Tickets" right={stat.openTickets} />
                <TextExtremeEnd
                  left="Account Officers"
                  right={stat.activeOfficers}
                />
                <div
                  onClick={() => {
                    // The tile carries a display label ("Lagos"); the table
                    // filter wants the enum. An unresolvable label simply
                    // opens the table unfiltered rather than sending a value
                    // the API answers 400 for.
                    const regionValue = resolveRegion(stat.region.name);
                    router.push(
                      regionValue
                        ? `/admin/distributors?region=${encodeURIComponent(regionValue)}`
                        : "/admin/distributors",
                    );
                  }}
                  className="flex gap-1 mt-3 items-center text-orange"
                >
                  <Text
                    variant="small"
                    color="primary"
                    weight="medium"
                    className="underline cursor-pointer"
                  >
                    View Details
                  </Text>
                  <Image
                    src={arrowRight}
                    alt="Arrow Right"
                    width={30}
                    height={30}
                    className="w-2.5 h-2.5 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* for the account officer   */}
        {role === "OFFICER" && (
          <div>
            {/* Distributor List Card */}
            <Card border={false}>
              {/* Tabs and Search Bar Section */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between overflow-x-auto space-y-4 md:space-y-0">
                {/* Tab Buttons */}
                <div className="flex items-center space-x-2 max-w-md md:max-w-none md:space-x-6 ">
                  <Button
                    variant={selectedTab === "all" ? "primary" : "outline"}
                    onClick={() => handleTabChange("all")}
                    className={
                      selectedTab === "all"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedTab === "overdue" ? "primary" : "outline"}
                    onClick={() => handleTabChange("overdue")}
                    className={`whitespace-nowrap ${
                      selectedTab === "overdue"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Overdue Balances
                  </Button>
                  <Button
                    variant={
                      selectedTab === "activeTickets" ? "primary" : "outline"
                    }
                    onClick={() => handleTabChange("activeTickets")}
                    className={`whitespace-nowrap ${
                      selectedTab === "activeTickets"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Active Ticket
                  </Button>
                  {/* AO-C1 - the "waiting on me" list, filtered server-side */}
                  <Button
                    variant={
                      selectedTab === "unreadMessages" ? "primary" : "outline"
                    }
                    onClick={() => handleTabChange("unreadMessages")}
                    className={`whitespace-nowrap ${
                      selectedTab === "unreadMessages"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Unread Messages
                  </Button>
                </div>
                {/* Search Input Component */}
                <SearchInput
                  placeholder="Search name or code"
                  onSearch={handleSearch}
                  debounceDelay={500}
                  fullWidth={true}
                />
              </div>

              {/* Account office customer's data table */}
              <div className="overflow-x-auto mt-6">
                {tableLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Text variant="caption" color="muted">
                      Loading table data...
                    </Text>
                  </div>
                ) : tableError ? (
                  <div className="flex items-center justify-center h-64">
                    <Text variant="caption" color="muted">
                      Error loading table data
                    </Text>
                  </div>
                ) : (
                  <Table
                    columns={officerTableColumns}
                    data={paginatedData}
                    onRowClick={handleDistributorSelect}
                    onActionClick={handleActionClick}
                  />
                )}
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

            {/* Distributor Details Section */}
            {selectedDistributor ? (
              <div ref={detailSectionRef}>
                <Card border={false}>
                  <div className=" pt-6 space-y-4 pb-12">
                    {/* Distributor Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Text variant="h3" weight="bold">
                          {selectedDistributor.name}
                        </Text>
                        <Text variant="small" color="muted">
                          Assigned to {user?.name} • last updated{" "}
                          {selectedDistributor.lastContact}
                        </Text>
                      </div>
                      {/* <Button
                      variant="primary"
                      onClick={() => setIsAssignOfficerModalOpen(true)}
                    >
                      Assign Officer
                    </Button> */}
                    </div>

                    {/* Detail Tabs Navigation */}
                    {/* Spec 41 - "Chat" is gone from here. Conversations moved
                        to their own screen, where they are the list rather
                        than something you reach by first finding the customer */}
                    <div className="flex items-center md:grid grid-cols-6 gap-2 pt-4 overflow-x-auto w-full">
                      {[
                        "Overview",
                        // "Orders",
                        "Invoices",
                        "Stock",
                        "Tickets",
                        "Waybills",
                      ].map((tab) => (
                        <Button
                          key={tab}
                          variant={"outline"}
                          onClick={() => setSelectedDetailTab(tab)}
                          className={`whitespace-nowrap md:w-max  ${
                            selectedDetailTab === tab
                              ? "bg-primary text-white hover:text-primary border border-primary"
                              : "bg-white border border-muted/30 hover:border-primary hover:bg-primary text-black hover:text-white"
                          }`}
                        >
                          {tab}
                        </Button>
                      ))}
                    </div>

                    {/* Detail Tab Content */}
                    <div className="min-h-100 overflow-y-auto mt-4">
                      {selectedDetailTab === "Overview" &&
                        (overviewLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Loading overview...
                            </Text>
                          </div>
                        ) : overviewError ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Error loading overview. Please try again.
                            </Text>
                          </div>
                        ) : overviewData ? (
                          <OverviewSection
                            distributorName={overviewData.name}
                            phoneNumber={overviewData.phone || "N/A"}
                            emailAddress={overviewData.email || "N/A"}
                            region={overviewData.region}
                            accountOfficer={
                              overviewData.assignedOfficers?.[0]?.name || "N/A"
                            }
                            accountBalance={formatCurrency(
                              overviewData.walletBalance,
                            )}
                            stockBalance="420 Cartons"
                            lastActivity={formatDate(overviewData.lastUpdated)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              No overview data available
                            </Text>
                          </div>
                        ))}
                      {selectedDetailTab === "Orders" &&
                        (ordersLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Loading orders...
                            </Text>
                          </div>
                        ) : ordersError ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Error loading orders. Please try again.
                            </Text>
                          </div>
                        ) : ordersData && ordersData.data.length > 0 ? (
                          <OrdersSection
                            orders={ordersData.data}
                            currentPage={orderPage}
                            totalPages={ordersData.meta.totalPages}
                            totalItems={ordersData.meta.total}
                            onPageChange={setOrderPage}
                            pageSize={orderPageSize}
                            onPageSizeChange={setOrderPageSize}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              No orders found
                            </Text>
                          </div>
                        ))}
                      {selectedDetailTab === "Invoices" &&
                        (invoicesLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Loading invoices...
                            </Text>
                          </div>
                        ) : invoicesError ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Error loading invoices. Please try again.
                            </Text>
                          </div>
                        ) : invoicesData && invoicesData.data.length > 0 ? (
                          <InvoicesSection
                            invoices={invoicesData.data}
                            walletBalance={invoicesData.walletBalance}
                            paymentHistory={invoicesData.paymentHistory}
                            lastUpdated={invoicesData.lastUpdated}
                            customerId={selectedDistributorId}
                            currentPage={invoicePage}
                            totalPages={invoicesData.meta.totalPages}
                            totalItems={invoicesData.meta.total}
                            pageSize={invoicePageSize}
                            onPageChange={setInvoicePage}
                            onPageSizeChange={setInvoicePageSize}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              No invoices found
                            </Text>
                          </div>
                        ))}
                      {selectedDetailTab === "Stock" &&
                        (stockLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Loading stock...
                            </Text>
                          </div>
                        ) : stockError ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Error loading stock. Please try again.
                            </Text>
                          </div>
                        ) : stockData ? (
                          /* The ERP stock BALANCE - totals plus what is still
                             to collect. `catalogue` and `awaitingLoading` are
                             gone; they came from local tables by a different
                             route than the distributor's own screen, so the
                             two could disagree about one account. */
                          <StockSection
                            totalPurchasedCartons={
                              stockData.totalPurchasedCartons
                            }
                            totalLoadedCartons={stockData.totalLoadedCartons}
                            totalRemainingCartons={
                              stockData.totalRemainingCartons
                            }
                            loadingProgress={stockData.loadingProgress}
                            products={stockData.products}
                            lastUpdated={stockData.lastUpdated}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              No stock data available
                            </Text>
                          </div>
                        ))}
                      {selectedDetailTab === "Tickets" && (
                        <TicketsUI
                          // Re-keyed by the Open Tickets tile so a repeat click
                          // reopens the thread after the reader closed it
                          key={`tickets-${statFocusKey}`}
                          distributorId={selectedDistributorId}
                          distributorName={selectedDistributor?.name}
                          autoOpenTicketId={autoOpenTicketId}
                        />
                      )}
                      {selectedDetailTab === "Waybills" &&
                        (waybillsLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Loading waybills...
                            </Text>
                          </div>
                        ) : waybillsError ? (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              Error loading waybills. Please try again.
                            </Text>
                          </div>
                        ) : waybillsData && waybillsData.data.length > 0 ? (
                          <WaybillsSection
                            waybills={waybillsData.data}
                            lastUpdated={waybillsData.lastUpdated}
                            customerId={selectedDistributorId}
                            currentPage={waybillPage}
                            totalPages={waybillsData.meta.totalPages}
                            totalItems={waybillsData.meta.total}
                            onPageChange={setWaybillPage}
                            pageSize={waybillPageSize}
                            onPageSizeChange={setWaybillPageSize}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <Text variant="caption" color="muted">
                              No waybills found
                            </Text>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="p-6 flex items-center justify-center min-h-50">
                  <Text variant="caption" color="muted">
                    No customer selected
                  </Text>
                </div>
              </Card>
            )}

            {/* Assign Account Officer Modal */}
            <AssignAccountOfficerModal
              isOpen={isAssignOfficerModalOpen}
              onClose={() => setIsAssignOfficerModalOpen(false)}
              onConfirm={handleOfficerAssigned}
              distributorName={selectedDistributor?.name}
            />
          </div>
        )}

        {role === "REGIONAL_ADMIN" && (
          <div className="pb-30">
            <Card border={false}>
              <div className="flex justify-between px-2 items-center">
                {/* Tab Buttons */}
                <PageHeader
                  title="Pending Loading Request"
                  subtitle="Assign each request to a loading or warehouse officer in ypour region"
                />
                {/* Spec 43 - this was inert text; the full queue lives here */}
                <Link
                  href="/requests/loading"
                  className="shrink-0 hover:opacity-80 transition-opacity"
                >
                  <Text
                    variant="body"
                    weight="bold"
                    className="text-primary underline"
                  >
                    View All
                  </Text>
                </Link>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto mt-6">
                {tableLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Text variant="caption" color="muted">
                      Loading table data...
                    </Text>
                  </div>
                ) : tableError ? (
                  <div className="flex items-center justify-center h-64">
                    <Text variant="caption" color="muted">
                      Error loading table data
                    </Text>
                  </div>
                ) : (
                  <Table
                    columns={loadingRequestTableColumns}
                    data={paginatedData}
                    onRowClick={setDetailsRow}
                    onActionClick={(action, row) => {
                      if (action === "Assign Officer") {
                        setIsAssignLoadingOfficerModalOpen(true);
                      }
                    }}
                  />
                )}
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
              title={detailsRow?.name || "Loading Request"}
              subtitle="Loading request details"
              sections={[
                {
                  title: "Request",
                  fields: [
                    { label: "Order", value: detailsRow?.account, type: "id" },
                    {
                      label: "Status",
                      value: detailsRow?.status,
                      type: "status",
                    },
                    { label: "Loading Date", value: detailsRow?.lastPurchase },
                    { label: "Quantity", value: detailsRow?.balance },
                  ],
                },
                {
                  title: "Logistics",
                  fields: [
                    { label: "Distributor", value: detailsRow?.name },
                    { label: "Vehicle", value: detailsRow?.lastContact },
                  ],
                },
              ]}
              footer={
                detailsRow?.action === "Assign Officer" ? (
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
        )}

        {role === "LOADING_OFFICER" && <LoadingOfficer />}
      </div>
    </MainLayout>
  );
}

/**
 * Dashboard Page - Protected Route Wrapper
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <DashboardContent />
    </ProtectedRoute>
  );
}
