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
import { usePagination } from "@/hooks/usePagination";
import { useCustomers, useReassignCustomer } from "@/hooks/api/useCustomer";
import { BroadcastRegion } from "@/lib/api/types";
import { formatToNaira } from "@/utils/formatter";
import ArrowBack from "../common/ArrowBack";

interface RegionalTablePageProps {
  region?: string;
  isAdmin?: boolean;
}

interface Distributor {
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
    title: "DISTRIBUTOR",
  },
  {
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "account" as const,
    title: "ACCOUNT",
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

// Region tab value -> API region enum
const regionTabs = [
  { value: "all-regions", label: "All Regions", apiValue: undefined },
  { value: "lagos", label: "Lagos", apiValue: "LAGOS" },
  { value: "south-west", label: "South West", apiValue: "SOUTH_WEST" },
  { value: "south-east", label: "South East", apiValue: "SOUTH_EAST" },
  { value: "north", label: "North", apiValue: "NORTH" },
] as const;

/**
 * Distributor table used by both the admin and regional-admin views.
 * The ACTION column drives the assignment flow, so it is shown for both.
 */
function RegionalTable({}: RegionalTablePageProps) {
  const [selectedTab, setSelectedTab] = useState("all-regions");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignOfficerModalOpen, setIsAssignOfficerModalOpen] =
    useState(false);
  const [selectedDistributor, setSelectedDistributor] =
    useState<Distributor | null>(null);
  const [detailsRow, setDetailsRow] = useState<Distributor | null>(null);
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
  const {
    data: customersData,
    isLoading,
    error,
  } = useCustomers({
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion as BroadcastRegion | undefined,
    search: searchTerm || undefined,
  });

  // Assign the customer to an account officer
  const assignMutation = useReassignCustomer();

  /**
   * Transform API response to table format
   */
  const tableData: Distributor[] = useMemo(() => {
    if (!customersData?.data) return [];

    return customersData.data.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phoneNo: customer.phone,
      account: customer.erpId,
      region: customer.region,
      officers:
        customer.officerAssignments
          ?.map((assignment) => assignment.staff?.name)
          .filter(Boolean)
          .join(", ") || "Unassigned",
      wallet: formatToNaira(customer.outstandingBalance || 0),
      stock: formatToNaira(customer.outstandingBalance || 0),
      tickets: customer._count?.supportTickets || 0,
      action: "Assign Officer",
    }));
  }, [customersData?.data]);

  const totalItems = customersData?.meta.total || 0;
  const totalPages = customersData?.meta.totalPages || 1;

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action: string, row: Distributor) => {
    if (action === "Assign Officer") {
      setSelectedDistributor(row);
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
    if (!selectedDistributor) return;

    // Captured up front - selectedDistributor is cleared before the modal renders
    const distributorName = selectedDistributor.name;

    assignMutation.mutate(
      {
        customerId: selectedDistributor.id,
        request: { newOfficerId: officer.id },
      },
      {
        onSuccess: () => {
          setIsAssignOfficerModalOpen(false);
          setSelectedDistributor(null);
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
          title="Distributors"
          subtitle="Manage all distributors in your region"
        />

        {/* Distributors Card */}
        <Card border={false}>
          <div className="">
            {/* Tab Buttons */}
            <div className="flex items-center space-x-4 md:grid grid-cols-5 gap-2 overflow-x-auto md:gap-4">
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

          {/* Search Input */}
          <div className="flex justify-end mt-4">
            <SearchInput
              placeholder="Search name or account"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading distributors...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-primary">
              Error loading distributors. Please try again.
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
            </>
          )}
        </Card>

        {/* Assign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isAssignOfficerModalOpen}
          onClose={() => {
            setIsAssignOfficerModalOpen(false);
            setSelectedDistributor(null);
          }}
          onConfirm={handleOfficerAssigned}
          isSubmitting={assignMutation.isPending}
          distributorName={selectedDistributor?.name}
          distributorData={{
            distributor: selectedDistributor?.name || "N/A",
            phoneNumber: selectedDistributor?.phoneNo || "N/A",
            account: selectedDistributor?.account || "N/A",
            region: selectedDistributor?.region || "N/A",
            officers: selectedDistributor?.officers || "Unassigned",
            wallet: selectedDistributor?.wallet || "N/A",
            stock: selectedDistributor?.stock || "N/A",
            ticket: String(selectedDistributor?.tickets ?? 0),
          }}
        />

        {/* Row Details Modal - opened by clicking any table row */}
        <RowDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          title={detailsRow?.name || "Distributor"}
          subtitle="Distributor details"
          sections={[
            {
              title: "Distributor",
              fields: [
                { label: "Name", value: detailsRow?.name },
                { label: "Account", value: detailsRow?.account, type: "id" },
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
                  label: "Account Officers",
                  value: detailsRow?.officers,
                  fullWidth: true,
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
                setSelectedDistributor(detailsRow);
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
 * Regional Admin Distributors Page - Protected Route Wrapper
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
