"use client";

import { useState } from "react";
import Image from "next/image";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ChatUI from "@/components/chat/ChatUI";
import TicketsUI from "@/components/ticket/TicketsUI";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import userIcon from "@/assets/icons/usersblack.svg";

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

// Mock distributor data with status and action columns
const distributorData: Distributor[] = [
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
  {
    id: "3",
    name: "Ade Foods Ltd",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "In Progress",
    action: "View",
  },
  {
    id: "4",
    name: "KJ Fresh Mart",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "Pending",
    action: "View",
  },
  {
    id: "5",
    name: "Ade Foods Ltd",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "Success",
    action: "View",
  },
  {
    id: "6",
    name: "KJ Fresh Mart",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "In Progress",
    action: "View",
  },
  {
    id: "7",
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
    id: "8",
    name: "KJ Fresh Mart",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "Success",
    action: "View",
  },
  {
    id: "9",
    name: "Ade Foods Ltd",
    account: "VJ-00987",
    balance: "₦1,240,000",
    lastPurchase: "2026-03-23",
    openTickets: 3,
    lastContact: "2026-03-23",
    status: "In Progress",
    action: "View",
  },
];

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

/**
 * Dashboard Page Component
 * Displays distributor information, stats, and allows filtering and viewing details
 */
function DashboardContent() {
  // State for active tab filter
  const [selectedTab, setSelectedTab] = useState("all");

  // State for selected detail tab (Overview, Orders, Chat, Tickets, etc.)
  const [selectedDetailTab, setSelectedDetailTab] = useState("Overview");

  // State for selected distributor to show details
  const [selectedDistributor, setSelectedDistributor] =
    useState<Distributor | null>(null);

  // State for assign officer modal
  const [isAssignOfficerModalOpen, setIsAssignOfficerModalOpen] =
    useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const totalItems = 247;

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

  return (
    <MainLayout>
      <div className="p-4 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Good Morning,"
          subtitle="Welcome back to the Viju Account Officer Portal"
        />

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={userIcon} label="Total Distributions" value="256" />
          <StatCard
            icon={userIcon}
            label="Overdue Balance"
            value="₦190,980,000"
          />
          <StatCard icon={userIcon} label="Unread Messages" value="40" />
          <StatCard icon={userIcon} label="Open Tickets" value="4" />
        </div>

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
            <Table
              columns={tableColumns}
              data={distributorData}
              onRowClick={setSelectedDistributor}
              onActionClick={handleActionClick}
            />
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
                    Assigned to Emeka Nwokocha • last updated 2026-05-18 10:18
                    AM
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
                    variant={selectedTab === "overdue" ? "primary" : "outline"}
                    onClick={() => setSelectedDetailTab(tab)}
                    className={`whitespace-nowrap w-max ${
                      selectedDetailTab === tab
                        ? "bg-primary text-white border border-primary"
                        : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              {/* Detail Tab Content */}
              <div className="min-h-100 overflow-y-auto mt-4">
                {selectedDetailTab === "Chat" && (
                  <ChatUI
                    profileName={selectedDistributor.name}
                    profileStatus="Online"
                  />
                )}
                {selectedDetailTab === "Tickets" && <TicketsUI />}
                {selectedDetailTab !== "Chat" &&
                  selectedDetailTab !== "Tickets" && (
                    <div className="flex items-center justify-center h-full">
                      <Text variant="caption" color="muted">
                        {selectedDetailTab} tab content coming soon
                      </Text>
                    </div>
                  )}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6 flex items-center justify-center min-h-[200px]">
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
