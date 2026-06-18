"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ChatUI from "@/components/chat/ChatUI";
import TicketsUI from "@/components/ticket/TicketsUI";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import AssignLoadingOfficerModal from "@/components/AssignLoadingOfficerModal";
import LoadingOfficerSuccessModal from "@/components/LoadingOfficerSuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import OverviewSection from "@/components/OverviewSection";
import OrdersSection from "@/components/OrdersSection";
import InvoicesSection from "@/components/InvoicesSection";
import StockSection from "@/components/StockSection";
import WaybillsSection from "@/components/WaybillsSection";
import arrowRight from "@/assets/icons/arrow-right.svg";
import {
  useDashboardStats,
  useDashboardTableData,
} from "@/hooks/api/useDashboard";
import {
  useDistributorOverview,
  useDistributorOrders,
  useDistributorInvoices,
  useDistributorStock,
} from "@/hooks/api/useOfficerCustomer";
import {
  AdminDashboardStats,
  OfficerDashboardStats,
  OfficerCustomer,
  PendingLoadingRequest,
  RegionalAdminDashboardResponse,
  DistributorOverview,
  Order,
  StockResponse,
} from "@/lib/api/types";
import userIcon from "@/assets/icons/usersblack.svg";
import { TextExtremeEnd } from "@/components/common/TextExtremeEnd";
import { formatDateTime, formatToNaira } from "@/src/utils/formatter";
import Image from "next/image";
import { useAuthStore } from "@/src/store/auth.store";

// Interface for distributor data structure
interface Distributor {
  id: string;
  name: string;
  account: string;
  balance: string;
  lastPurchase: string;
  openTickets: number;
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
    title: "DISTRIBUTOR",
  },
  {
    key: "account" as const,
    title: "ACCOUNT#",
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
    title: "DISTRIBUTOR",
  },
  {
    key: "account" as const,
    title: "ACCOUNT#",
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
];

// Table columns for loading requests (REGIONAL_ADMIN)
const loadingRequestTableColumns = [
  {
    key: "name" as const,
    title: "DISTRIBUTOR",
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
  {
    key: "action" as const,
    title: "ACTION",
  },
];

// Mock distributor data for admin users (fallback)
const mockDistributorData: Distributor[] = [
  {
    id: "1",
    name: "Ade Foods Ltd",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "Pending",
    action: "View",
  },
  {
    id: "2",
    name: "KJ Fresh Mart",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "Success",
    action: "View",
  },
];

// Mock loading requests for regional admin
const mockLoadingRequests: Distributor[] = [
  {
    id: "1",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Pending",
    action: "Assign Officer",
  },
  {
    id: "2",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Pending",
    action: "Assign Officer",
  },
  {
    id: "3",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "Ifeanyi Okon",
  },
  {
    id: "4",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Pending",
    action: "Assign Officer",
  },
  {
    id: "5",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "Ifeanyi Okon",
  },
  {
    id: "6",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Pending",
    action: "Assign Officer",
  },
  {
    id: "7",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "View",
  },
  {
    id: "8",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "View",
  },
  {
    id: "9",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "View",
  },
  {
    id: "10",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "In progress",
    action: "View",
  },
  {
    id: "11",
    name: "Bello & Sons LTD",
    account: "ORD-00294",
    balance: "320 Cartons",
    lastPurchase: "Today, 14:00",
    openTickets: 0,
    lastContact: "LAG-234-XY",
    status: "Assigned",
    action: "View",
  },
];

function DashboardContent() {
  // State for active tab filter
  const [selectedTab, setSelectedTab] = useState("all");

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
  } = useDashboardTableData();
  const { user } = useAuthStore();

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
  } = useDistributorOrders(selectedDistributorId, orderPage);
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useDistributorInvoices(selectedDistributorId);
  const {
    data: stockData,
    isLoading: stockLoading,
    error: stockError,
  } = useDistributorStock(selectedDistributorId);
  console.log({ stockData });

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-NG").format(num);
  };

  // Helper function to format currency
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-NG");
    } catch {
      return dateString;
    }
  };

  // console.log({ })

  // Map officer customers to table format
  const mapOfficerCustomersToTable = (
    customers: OfficerCustomer[],
  ): Distributor[] => {
    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      account: customer.accountNumber,
      balance: formatCurrency(customer.walletBalance),
      lastPurchase: formatDate(customer.lastPurchaseDate),
      openTickets: customer.openTickets,
      lastContact: formatDate(customer.lastContactDate),
      status: customer.accountStatus,
      action: "View",
    }));
  };

  // function to Map admin data to card format
  const mapAdminDashboardDataToCard = (
    adminStats: AdminDashboardStats,
  ): AdminDashboardCard[] => {
    return adminStats?.byRegion.map((stat) => ({
      region: stat.region,
      distributors: stat.distributors,
      walletBalance: stat.walletBalance,
      openTickets: stat.openTickets,
      activeOfficers: stat.activeOfficers,
    }));
  };

  const adminCardData = useMemo(() => {
    if (user?.role === "ADMIN" && dashboardStats) {
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
      balance: `${request.quantityCartons} Cartons`,
      lastPurchase: formatDate(request.loadingDate),
      openTickets: 0, // Not applicable for waybills
      lastContact: formatDate(request.submittedAt),
      status: request.status,
      action: "View",
    }));
  };

  // Transform table data based on role
  const transformedTableData: Distributor[] | AdminDashboardCard[] =
    useMemo(() => {
      // if (!tableData && user?.role !== ("REGIONAL_ADMIN" as any))
      //   return mockDistributorData;

      if ((user?.role as any) === "REGIONAL_ADMIN") {
        // For REGIONAL_ADMIN, use mock data
        return mockLoadingRequests;
      }

      if (user?.role === "OFFICER" && Array.isArray(tableData)) {
        return mapOfficerCustomersToTable(tableData as OfficerCustomer[]);
      }

      if (user?.role === "ADMIN") {
        return mapAdminDashboardDataToCard(tableData as AdminDashboardStats);
      }

      if (
        (user?.role as any) === "REGIONAL_ADMIN" &&
        tableData &&
        "pendingLoadingRequests" in tableData
      ) {
        const regionalData = tableData as RegionalAdminDashboardResponse;
        return mapPendingLoadingRequestsToTable(
          regionalData.pendingLoadingRequests,
        );
      }

      return mockDistributorData;
    }, [tableData, user?.role]);

  // Calculate pagination
  const totalItems = transformedTableData.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transformedTableData.slice(startIndex, endIndex);
  }, [transformedTableData, currentPage]);

  // Determine stats display based on user role
  const renderStats = () => {
    if (statsLoading) {
      return (
        <>
          <StatCard icon={userIcon} label="Loading..." value="..." />
          <StatCard icon={userIcon} label="Loading..." value="..." />
          <StatCard icon={userIcon} label="Loading..." value="..." />
          <StatCard icon={userIcon} label="Loading..." value="..." />
        </>
      );
    }

    if (statsError || !dashboardStats) {
      return (
        <>
          <StatCard icon={userIcon} label="Error Loading" value="N/A" />
          <StatCard icon={userIcon} label="Error Loading" value="N/A" />
          <StatCard icon={userIcon} label="Error Loading" value="N/A" />
          <StatCard icon={userIcon} label="Error Loading" value="N/A" />
        </>
      );
    }

    if (user?.role === "ADMIN") {
      const stats = dashboardStats as AdminDashboardStats;
      return (
        <>
          <StatCard
            icon={userIcon}
            label="Total Customers"
            value={formatNumber(stats.totalCustomers)}
          />
          <StatCard
            icon={userIcon}
            label="Unread Messages"
            value={formatNumber(stats.unReadMessage)}
          />
          <StatCard
            icon={userIcon}
            label="Open Tickets"
            value={formatNumber(stats.openTickets)}
          />
          <StatCard
            icon={userIcon}
            label="Outstanding Balance"
            value={formatCurrency(stats.totalOutstandingBalance)}
          />
        </>
      );
    }

    if (user?.role === "OFFICER") {
      const stats = dashboardStats as OfficerDashboardStats;
      return (
        <>
          <StatCard
            icon={userIcon}
            label="Total Distributors"
            value={formatNumber(stats.totalDistributors)}
          />
          <StatCard
            icon={userIcon}
            label="Overdue Balances"
            value={formatCurrency(stats.overdueBalances)}
          />
          <StatCard
            icon={userIcon}
            label="Open Tickets"
            value={formatNumber(stats.openTickets)}
          />
          <StatCard
            icon={userIcon}
            label="Unread Messages"
            value={formatNumber(stats.unreadMessages)}
          />
        </>
      );
    }

    // REGIONAL_ADMIN stats from API response
    if ((user?.role as any) === "REGIONAL_ADMIN") {
      if (!tableData || !("summary" in tableData)) {
        return (
          <>
            <StatCard icon={userIcon} label="Error Loading" value="N/A" />
            <StatCard icon={userIcon} label="Error Loading" value="N/A" />
            <StatCard icon={userIcon} label="Error Loading" value="N/A" />
            <StatCard icon={userIcon} label="Error Loading" value="N/A" />
          </>
        );
      }
      const regionalData = tableData as RegionalAdminDashboardResponse;
      const summary = regionalData.summary;
      return (
        <>
          <StatCard
            icon={userIcon}
            label="Total Distributors"
            value={formatNumber(summary.totalDistributors)}
          />
          <StatCard
            icon={userIcon}
            label="Open Tickets"
            value={formatNumber(summary.openTickets)}
          />
          <StatCard
            icon={userIcon}
            label="Pending Waybills"
            value={formatNumber(summary.pendingWaybills)}
          />
          <StatCard
            icon={userIcon}
            label="Active Officers"
            value={formatNumber(summary.activeOfficers)}
          />
        </>
      );
    }

    // Default stats
    return (
      <>
        <StatCard icon={userIcon} label="Total Distributions" value="256" />
        <StatCard
          icon={userIcon}
          label="Overdue Balance"
          value="₦190,980,000"
        />
        <StatCard icon={userIcon} label="Unread Messages" value="40" />
        <StatCard icon={userIcon} label="Open Tickets" value="4" />
      </>
    );
  };

  /**
   * Handle search input from SearchInput component
   * Can be extended to filter the distributor data
   */
  const handleSearch = (value: string) => {
    // Search logic can be implemented here
    // For now, the SearchInput handles the debounce and logging
  };

  /**
   * Handle action button click on table rows
   * Shows what action was clicked (View, Edit, Delete, etc.)
   */
  const handleActionClick = (action: string, row: Distributor) => {
    console.log(`Action: ${action}`, row);
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
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Handle officer assignment
   */
  const handleOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    console.log("Officer assigned:", officer);
    // Can add additional logic here to update the distributor's assigned officer
  };

  /**
   * Handle loading officer assignment
   */
  const handleLoadingOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    console.log("Loading officer assigned:", officer);
    setIsLoadingOfficerSuccessOpen(true);
  };

  const handleDistributorSelect = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setSelectedDistributorId(distributor.id);
    setSelectedDetailTab("Overview"); // Reset to Overview tab when a new distributor is selected
    setOrderPage(1); // Reset order page
    console.log("Selected Distributor:", { distributor });
  };
  return (
    <MainLayout>
      <div className="p-4 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Good Morning,"
          subtitle="Welcome back to the Viju Account Officer Portal"
        />

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-4 gap-4">{renderStats()}</div>

        {user?.role === "ADMIN" && (
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
                  right={`Dist - ${stat.region.dist}`}
                />
                <TextExtremeEnd
                  left="Wallet"
                  right={formatToNaira(stat.walletBalance)}
                />
                <TextExtremeEnd left="Tickets" right={stat.openTickets} />
                <TextExtremeEnd left="Officers" right={stat.activeOfficers} />
                <div className="flex gap-1 mt-3 items-center text-orange">
                  <Text
                    variant="small"
                    color="primary"
                    weight="medium"
                    className="underline "
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
        {user?.role === "OFFICER" && (
          <div>
            {/* Distributor List Card */}
            <Card border={false}>
              {/* Tabs and Search Bar Section */}
              <div className="">
                {/* Tab Buttons */}
                <div className="flex items-center space-x-6">
                  <Button
                    variant={selectedTab === "all" ? "primary" : "outline"}
                    onClick={() => setSelectedTab("all")}
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
                    onClick={() => setSelectedTab("overdue")}
                    className={`whitespace-nowrap ${
                      selectedTab === "overdue"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Overdue Balances
                  </Button>
                  <Button
                    variant={selectedTab === "active" ? "primary" : "outline"}
                    onClick={() => setSelectedTab("active")}
                    className={`whitespace-nowrap ${
                      selectedTab === "active"
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Active Ticket
                  </Button>
                  {/* Search Input Component */}
                  <SearchInput
                    placeholder="Search name or account"
                    onSearch={handleSearch}
                    debounceDelay={500}
                    fullWidth={true}
                  />
                </div>
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
              />
            </Card>

            {/* Distributor Details Section */}
            {selectedDistributor ? (
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
                    <Button
                      variant="primary"
                      onClick={() => setIsAssignOfficerModalOpen(true)}
                    >
                      Assign Officer
                    </Button>
                  </div>

                  {/* Detail Tabs Navigation */}
                  <div className="grid grid-cols-7 gap-2 pt-4">
                    {[
                      "Overview",
                      "Orders",
                      "Invoices",
                      "Stock",
                      "Chat",
                      "Tickets",
                      "Waybills",
                    ].map((tab) => (
                      <Button
                        key={tab}
                        variant={
                          selectedTab === "overdue" ? "primary" : "outline"
                        }
                        onClick={() => setSelectedDetailTab(tab)}
                        className={`whitespace-nowrap w-max ${
                          selectedDetailTab === tab
                            ? "bg-primary text-white hover:text-primary border border-primary"
                            : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
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
                          onPageChange={setOrderPage}
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
                      ) : invoicesData && invoicesData.invoices.length > 0 ? (
                        <InvoicesSection
                          invoices={invoicesData.invoices}
                          paymentHistory={invoicesData.paymentHistory}
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
                        <StockSection
                          catalogue={stockData.catalogue}
                          awaitingLoading={stockData.awaitingLoading}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <Text variant="caption" color="muted">
                            No stock data available
                          </Text>
                        </div>
                      ))}
                    {selectedDetailTab === "Chat" && (
                      <ChatUI
                        profileName={selectedDistributor.name}
                        profileStatus="Online"
                      />
                    )}
                    {selectedDetailTab === "Tickets" && <TicketsUI />}
                    {selectedDetailTab === "Waybills" && <WaybillsSection />}
                  </div>
                </div>
              </Card>
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

        {(user?.role as any) === "REGIONAL_ADMIN" && (
          <div className="pb-30">
            <Card border={false}>
              <div className="flex justify-between px-2 items-center">
                {/* Tab Buttons */}
                <PageHeader
                  title="Pending Loading Request"
                  subtitle="Assign each request to a loading or warehouse officer in ypour region"
                />
                <Text variant="body" weight="bold" color="muted">
                  View All
                </Text>
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
                    onRowClick={(row) => {
                      if (row.action === "Assign Officer") {
                        setIsAssignLoadingOfficerModalOpen(true);
                      }
                    }}
                    onActionClick={(action, row) => {
                      console.log(`Action: ${action}`, row);
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
                totalItems={mockLoadingRequests.length}
                itemsPerPage={itemsPerPage}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
              />
            </Card>

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
