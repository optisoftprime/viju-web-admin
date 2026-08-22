"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Card, Button, Table } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import SuccessModal from "@/components/SuccessModal";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  formatRegion,
  formatToNairaExact,
  formatNumberExact,
} from "@/utils/formatter";
import { safeArray, safeNumber, safeText } from "@/utils/safe";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { toast } from "sonner";
import {
  useCustomersForReassignment,
  useReassignCustomer,
} from "@/hooks/api/useCustomer";
import { customerService } from "@/services/customer.service";
import { BroadcastRegion, isProjectedCustomer } from "@/lib/api/types";
import { REGION_FILTER_TABS } from "@/constants/regions";
import ExportRecord from "@/components/ExportRecord";

// Interface for customer data structure (transformed from API)
interface CustomerTableRow {
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
  /** Officer currently on the record - absent when nobody is assigned yet */
  currentOfficerId?: string;
  currentOfficerName?: string;
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

// Region options for tabs - canonical list, see @/constants/regions
const regions = REGION_FILTER_TABS;

function CustomerReassignmentContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("");

  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // State for reassign modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerTableRow | null>(null);

  // State for the post-reassignment success modal
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // State for the row details modal
  const [detailsRow, setDetailsRow] = useState<CustomerTableRow | null>(null);

  // State for pagination
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  // Fetch customers from API
  const {
    data: customersData,
    isLoading,
    error,
  } = useCustomersForReassignment({
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion ? (selectedRegion as BroadcastRegion) : undefined,
    search: searchTerm || undefined,
  });

  /**
   * Assign this one customer to the chosen officer.
   *
   * PATCH /admin/customers/{id}/reassign sets the assignment outright, so it
   * works for a customer who has no officer yet as well as for one being moved
   * off another officer. The previous implementation used
   * PATCH /admin/officers/{id}/reassign-customers, which moves a SOURCE
   * officer's whole book and therefore had nothing to move for an unassigned
   * customer - that is where "ADLAK has no account officer yet" came from.
   */
  const reassignMutation = useReassignCustomer();

  /**
   * Transform API response to table format
   */
  const tableData: CustomerTableRow[] = useMemo(() => {
    if (!customersData?.data) return [];

    // Reassignment needs a portal record, so ERP-only rows are excluded
    return customersData.data.filter(isProjectedCustomer).map((customer) => {
      const primary = safeArray<{
        staff?: { id?: string; name?: string } | null;
      }>(customer?.officerAssignments)[0]?.staff;

      const cartons = safeNumber(customer?.stockBalanceCartons, 0);

      return {
        id: customer.id,
        name: safeText(customer?.name, "Unnamed customer"),
        phoneNo: safeText(customer?.phone),
        account: safeText(customer?.erpId),
        region: formatRegion(customer?.region),
        officers: primary?.name || "Unassigned",
        // Shown to the API's own precision - a wallet is reconciled against
        // the ERP figure, so rounding to two decimals would make the column
        // disagree with the source of truth (and with the All Customers modal)
        wallet: formatToNairaExact(safeNumber(customer?.outstandingBalance, 0)),
        // B-1.1 - cartons awaiting loading, not a second copy of the balance
        stock: `${formatNumberExact(cartons)} ${cartons === 1 ? "Carton" : "Cartons"}`,
        tickets: safeNumber(customer?._count?.supportTickets, 0),
        // An unassigned customer is being assigned, not reassigned - the
        // label is the only thing that differs, the endpoint is the same
        action: primary?.id ? "Reassign Officer" : "Assign Officer",
        currentOfficerId: primary?.id,
        currentOfficerName: primary?.name,
      };
    });
  }, [customersData?.data]);

  const totalItems = customersData?.meta.total || 0;
  const totalPages = customersData?.meta.totalPages || 1;
  // The server clamps pageSize - report what it actually applied
  const appliedPageSize = getAppliedPageSize(customersData?.meta, itemsPerPage);

  /**
   * Reset pagination when region changes
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    resetPage();
  };

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);

    resetPage();
  };

  const downloadCsvFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(
      new Blob([blob], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      const csvBlob = await customerService.exportCustomers({
        region: selectedRegion
          ? (selectedRegion as BroadcastRegion)
          : undefined,
        search: searchTerm || undefined,
      });
      downloadCsvFile(csvBlob, "viju-customers.csv");
    } catch (error) {
      console.error("Customer export failed", error);
    }
  };

  /**
   * Handle action button click on table rows
   */
  const handleActionClick = (action: string, row: CustomerTableRow) => {
    if (action.includes("Reassign") || action.includes("Assign")) {
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
  const handleNextPage = () => nextPage(totalPages);

  /**
   * Assign the selected customer to the chosen officer.
   * PATCH /admin/customers/{id}/reassign
   *
   * No current officer is required: an unassigned customer is assigned, an
   * assigned one is moved. The backend notifies the incoming officer in-app
   * and by push, and the invalidated caches pull the new officer into the
   * OFFICERS column on the next render.
   */
  const handleOfficerAssigned = (officer: {
    id: string;
    name: string;
    role: string;
  }) => {
    if (!selectedCustomer) return;

    // Saves a round trip: the API refuses this with 409 ALREADY_ASSIGNED,
    // which the mutation reports as a no-op rather than a failure
    if (selectedCustomer.currentOfficerId === officer.id) {
      toast.info(`${officer.name} is already the account officer.`);
      return;
    }

    // Captured up front - selectedCustomer is cleared before the modal renders
    const customerName = selectedCustomer.name;
    const previousOfficerName = selectedCustomer.currentOfficerName;

    reassignMutation.mutate(
      {
        customerId: selectedCustomer.id,
        request: {
          newOfficerId: officer.id,
        },
      },
      {
        onSuccess: (response) => {
          setIsReassignModalOpen(false);
          setSelectedCustomer(null);

          // The response carries the resulting assignments, primary first -
          // read the officer's name back from it rather than trusting the one
          // that was clicked
          const assignedName =
            safeArray<{ staff?: { name?: string } | null }>(
              response?.officerAssignments,
            )[0]?.staff?.name || officer.name;

          setSuccessModal({
            isOpen: true,
            title: previousOfficerName
              ? "Reassignment Successful"
              : "Officer Assigned Successfully",
            message: previousOfficerName
              ? `${customerName} has been moved from ${previousOfficerName} to ${assignedName}. ${assignedName} has been notified in-app and by push.`
              : `${customerName} has been assigned to ${assignedName}. ${assignedName} has been notified in-app and by push.`,
          });
        },
      },
    );
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Customer Reassignment"
            subtitle="Reassign account officers to customers"
          />
          {/* <ExportRecord onClick={handleExport} /> */}
        </div>

        {/* Customer List Card */}
        <Card border={false}>
          {/* Tabs and Search Bar Section */}
          <div className="">
            {/* Region Filter Tabs */}
            <div className="flex items-center space-x-6 flex-wrap gap-4">
              {regions.map((region) => (
                <Button
                  key={region.value}
                  variant={
                    selectedRegion === region.value ? "primary" : "outline"
                  }
                  onClick={() => handleRegionChange(region.value)}
                  className={
                    selectedRegion === region.value
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border border-primary"
                      : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {region.label}
                </Button>
              ))}

              {/* Search Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or code"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading customers...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-red-500">
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

        {/* Reassign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleOfficerAssigned}
          isSubmitting={reassignMutation.isPending}
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
                  label: "Current Account Officer",
                  value: detailsRow?.currentOfficerName || detailsRow?.officers,
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
                setSelectedCustomer(detailsRow);
                setDetailsRow(null);
                setIsReassignModalOpen(true);
              }}
            >
              {detailsRow?.currentOfficerId
                ? "Reassign Officer"
                : "Assign Officer"}
            </Button>
          }
        />

        {/* Success Modal - shown after a successful reassignment */}
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
 * Customer Reassignment Page - Protected Route Wrapper
 */
export default function CustomerReassignmentPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <CustomerReassignmentContent />
    </ProtectedRoute>
  );
}
