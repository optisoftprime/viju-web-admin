"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { usePagination, getTotalPages } from "@/hooks/usePagination";
import userIcon from "@/assets/icons/usersblack.svg";
import ArrowBack from "@/components/common/ArrowBack";
import { REGIONS } from "@/constants/regions";

// Interface for customer data structure
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
}

// Table columns definition
const tableColumns = [
  {
    key: "name" as const,
    title: "CUSTOMER",
  },
  {
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "account" as const,
    title: "CODE",
  },
  {
    key: "region" as const,
    title: "REGION",
  },
  {
    key: "officers" as const,
    title: "OFFICERS",
  },
  {
    key: "wallet" as const,
    title: "WALLET",
  },
  {
    key: "stock" as const,
    title: "STOCK",
  },
  {
    key: "tickets" as const,
    title: "TICKETS",
  },
  {
    key: "action" as const,
    title: "ACTION",
  },
];

// Mock customer data
const mockCustomerData: Customer[] = [
  {
    id: "1",
    name: "Ade Foods Ltd",
    phoneNo: "08087654321",
    account: "VJ-00987",
    region: "Lagos",
    officers: "Emeka Nwokocha",
    wallet: "₦1,240,000",
    stock: "₦1,224,000",
    tickets: 3,
    action: "Reassign Officer",
  },
  {
    id: "2",
    name: "KJ Fresh Mart",
    phoneNo: "08012345678",
    account: "VJ-00988",
    region: "Western",
    officers: "David Okafor",
    wallet: "₦850,500",
    stock: "₦900,000",
    tickets: 1,
    action: "Reassign Officer",
  },
  {
    id: "3",
    name: "Premium Foods",
    phoneNo: "08098765432",
    account: "VJ-00989",
    region: "Eastern",
    officers: "Chinedu Obi",
    wallet: "₦520,000",
    stock: "₦450,000",
    tickets: 2,
    action: "Reassign Officer",
  },
  {
    id: "4",
    name: "Northern Supplies",
    phoneNo: "08055555555",
    account: "VJ-00990",
    region: "North",
    officers: "Hassan Mohammed",
    wallet: "₦2,100,000",
    stock: "₦1,950,000",
    tickets: 0,
    action: "Reassign Officer",
  },
  {
    id: "5",
    name: "Lagos Distributors",
    phoneNo: "08011111111",
    account: "VJ-00991",
    region: "Lagos",
    officers: "Emeka Nwokocha",
    wallet: "₦1,500,000",
    stock: "₦1,350,000",
    tickets: 4,
    action: "Reassign Officer",
  },
  {
    id: "6",
    name: "Southwest Traders",
    phoneNo: "08022222222",
    account: "VJ-00992",
    region: "Western",
    officers: "David Okafor",
    wallet: "₦750,000",
    stock: "₦700,000",
    tickets: 1,
    action: "Reassign Officer",
  },
  {
    id: "7",
    name: "Eastern Foods Inc",
    phoneNo: "08033333333",
    account: "VJ-00993",
    region: "Eastern",
    officers: "Chinedu Obi",
    wallet: "₦920,000",
    stock: "₦850,000",
    tickets: 3,
    action: "Reassign Officer",
  },
  {
    id: "8",
    name: "North Central Ltd",
    phoneNo: "08044444444",
    account: "VJ-00994",
    region: "North",
    officers: "Hassan Mohammed",
    wallet: "₦1,800,000",
    stock: "₦1,650,000",
    tickets: 2,
    action: "Reassign Officer",
  },
  {
    id: "9",
    name: "Island Stores",
    phoneNo: "08055555555",
    account: "VJ-00995",
    region: "Lagos",
    officers: "Emeka Nwokocha",
    wallet: "₦3,200,000",
    stock: "₦2,950,000",
    tickets: 5,
    action: "Reassign Officer",
  },
  {
    id: "10",
    name: "Coastal Retail",
    phoneNo: "08066666666",
    account: "VJ-00996",
    region: "Western",
    officers: "David Okafor",
    wallet: "₦1,100,000",
    stock: "₦1,000,000",
    tickets: 0,
    action: "Reassign Officer",
  },
];

/**
 * Region options for tabs, derived from the canonical list so a region added
 * in `constants/regions` (spec 39 added OTHERS) shows up here too. The rows on
 * this screen carry display labels, so the tab value is the label and "all"
 * stays the no-filter entry.
 */
const regions = [
  { name: "All Regions", value: "all" },
  ...REGIONS.map((region) => ({ name: region.label, value: region.label })),
];

function CustomerReassignmentContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State for reassign modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // State for the row details modal
  const [detailsRow, setDetailsRow] = useState<Customer | null>(null);

  // State for pagination
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  /**
   * Filter customers by selected region
   */
  const filteredCustomers = useMemo(() => {
    const regionFiltered =
      selectedRegion === "all"
        ? mockCustomerData
        : mockCustomerData.filter(
            (customer) => customer.region === selectedRegion,
          );

    if (!searchTerm.trim()) {
      return regionFiltered;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    return regionFiltered.filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.account.toLowerCase().includes(normalizedSearch),
    );
  }, [selectedRegion, searchTerm]);

  /**
   * Calculate pagination
   */
  const totalItems = filteredCustomers.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  /**
   * Reset pagination when region changes
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    resetPage();
  };

  /**
   * Handle search input from SearchInput component
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: Customer) => {
    if (action.includes("Reassign")) {
      setSelectedCustomer(row);
      setIsReassignModalOpen(true);
    }
  };

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
    setIsReassignModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        {/* Page Header Component */}
        <PageHeader
          title="Customer Reassignment"
          subtitle="Reassign account officers to customers"
        />

        {/* Customer List Card */}
        <Card border={false}>
          {/* Tabs and Search Bar Section */}
          <div className="">
            {/* Region Filter Tabs */}
            <div className="flex items-center space-x-6 overflow-x-auto gap-4">
              {regions.map((region) => (
                <Button
                  key={region.value}
                  variant={
                    selectedRegion === region.value ? "primary" : "outline"
                  }
                  onClick={() => handleRegionChange(region.value)}
                  className={
                    selectedRegion === region.value
                      ? "bg-primary text-white border border-primary"
                      : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {region.name}
                </Button>
              ))}

              {/* Search Input Component */}
              <SearchInput
                placeholder="Search name or code"
                onSearch={handleSearch}
                debounceDelay={500}
                fullWidth={false}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto mt-6">
            <Table
              columns={tableColumns}
              data={paginatedData}
              onRowClick={setDetailsRow}
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
            onItemsPerPageChange={setPageSize}
          />
        </Card>

        {/* Row Details Modal - opened by clicking any table row */}
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
                { label: "Stock", value: detailsRow?.stock, type: "amount" },
                { label: "Open Tickets", value: detailsRow?.tickets },
              ],
            },
            {
              title: "Assignment",
              fields: [
                {
                  label: "Account Officer",
                  value: detailsRow?.officers,
                  fullWidth: true,
                },
              ],
            },
          ]}
          footer={
            <Button
              variant="primary"
              onClick={() => {
                if (!detailsRow) return;
                setSelectedCustomer(detailsRow);
                setDetailsRow(null);
                setIsReassignModalOpen(true);
              }}
            >
              Reassign Officer
            </Button>
          }
        />

        {/* Reassign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleOfficerAssigned}
          distributorName={selectedCustomer?.name}
        />
      </div>
    </MainLayout>
  );
}

/**
 * Customer Reassignment Page - Protected Route Wrapper
 */
export default function CustomerReassignmentPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RoleProtectedRoute allow={["ADMIN"]}>
        <CustomerReassignmentContent />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
