"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import RowDetailsModal from "@/components/RowDetailsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePagination, getTotalPages } from "@/hooks/usePagination";
import { useAuthStore } from "@/store/auth.store";

interface Officer {
  id: string;
  officer: string;
  email: string;
  region: string;
  phoneNo: string;
  distributors: number;
  tickets: number;
  lastLogin: string;
}

// Table columns definition
const tableColumns = [
  {
    key: "officer" as const,
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
    key: "phoneNo" as const,
    title: "PHONE NO",
  },
  {
    key: "distributors" as const,
    title: "DISTRIBUTORS",
  },
  {
    key: "tickets" as const,
    title: "TICKETS",
  },
  {
    key: "lastLogin" as const,
    title: "LAST LOGIN",
  },
];

// Mock officers data
const mockOfficersData: Officer[] = Array.from({ length: 25 }, (_, i) => ({
  id: `${i + 1}`,
  officer: "James Okonkwo",
  email: "james@gmail.com",
  region: "Lagos",
  phoneNo: "+2349876543210",
  distributors: 14,
  tickets: 14,
  lastLogin: "Today, 10:34",
}));

function RegionalAdminOfficersContent() {
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
  } = usePagination();
  const [detailsRow, setDetailsRow] = useState<Officer | null>(null);
  const { user } = useAuthStore();

  // Calculate pagination
  const totalItems = mockOfficersData.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return mockOfficersData.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage]);

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    // Search logic can be implemented here
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

  return (
    <MainLayout>
      <div className="px-4 pt-4 space-y-3 pb-30 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Account Officers"
          subtitle="View all account officers in your region"
        />

        {/* Officers Card */}
        <Card border={false}>
          {/* Data Table */}
          <div className="overflow-x-auto ">
            <Table
              columns={tableColumns}
              data={paginatedData}
              onRowClick={setDetailsRow}
              onActionClick={() => {}}
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
          title={detailsRow?.officer || "Officer"}
          subtitle="Account officer details"
          sections={[
            {
              title: "Officer",
              fields: [
                { label: "Name", value: detailsRow?.officer },
                { label: "Region", value: detailsRow?.region },
                { label: "Email", value: detailsRow?.email, fullWidth: true },
                { label: "Phone Number", value: detailsRow?.phoneNo },
              ],
            },
            {
              title: "Portfolio",
              fields: [
                { label: "Distributors", value: detailsRow?.distributors },
                { label: "Tickets", value: detailsRow?.tickets },
                { label: "Last Login", value: detailsRow?.lastLogin },
              ],
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}

/**
 * Regional Admin Officers Page - Protected Route Wrapper
 */
export default function RegionalAdminOfficersPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RegionalAdminOfficersContent />
    </ProtectedRoute>
  );
}
