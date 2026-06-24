"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AssignAccountOfficerModal from "@/components/AssignAccountOfficerModal";
import LoadingOfficerSuccessModal from "@/components/LoadingOfficerSuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";

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

// Mock distributor data
const mockDistributorsData: Distributor[] = Array.from(
  { length: 25 },
  (_, i) => ({
    id: `${i + 1}`,
    name: "Alhaji Bello & Sons",
    phoneNo: "09098765432",
    account: `09098765432`,
    region: ["Lagos", "South West", "South East", "North"][i % 4],
    officers: "Funmi Adeo, David Ukoh",
    wallet: "₦1,24,000",
    stock: "₦1,224,000",
    tickets: 1,
    action: "Assign Officer",
  }),
);

function RegionalTable({ isAdmin = false, region }: RegionalTablePageProps) {
  const [selectedTab, setSelectedTab] = useState("all-regions");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAssignOfficerModalOpen, setIsAssignOfficerModalOpen] =
    useState(false);
  const [isLoadingOfficerSuccessOpen, setIsLoadingOfficerSuccessOpen] =
    useState(false);
  const itemsPerPage = 9;
  const { user } = useAuthStore();

  // Filter data based on selected region tab
  const filteredData = useMemo(() => {
    if (selectedTab === "all-regions") return mockDistributorsData;

    const regionMap: Record<string, string> = {
      lagos: "Lagos",
      "south-west": "South West",
      "south-east": "South East",
      north: "North",
    };

    const selectedRegion = regionMap[selectedTab];
    return mockDistributorsData.filter(
      (item) => item.region === selectedRegion,
    );
  }, [selectedTab]);

  // Calculate pagination
  const totalItems = filteredData.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    // Search logic can be implemented here
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action: string, row: Distributor) => {
    console.log(`Action: ${action}`, row);
    if (action === "Assign Officer") {
      setIsAssignOfficerModalOpen(true);
    }
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
    setIsLoadingOfficerSuccessOpen(true);
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Distributors"
          subtitle="Manage all distributors in your region"
        />

        {/* Distributors Card */}
        <Card border={false}>
          <div className="">
            {/* Tab Buttons */}
            <div className="flex items-center space-x-4 flex-wrap">
              {[
                { value: "all-regions", label: "All Regions" },
                { value: "lagos", label: "Lagos" },
                { value: "south-west", label: "South West" },
                { value: "south-east", label: "South East" },
                { value: "north", label: "North" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={selectedTab === tab.value ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedTab(tab.value);
                    setCurrentPage(1);
                  }}
                  className={
                    selectedTab === tab.value
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border-0"
                      : "bg-white border border-muted/30 text-muted hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto mt-6">
            <Table
              columns={isAdmin ? tableColumns.slice(0, -1) : tableColumns} // Hide action column for non-admins
              data={paginatedData}
              onRowClick={() => {}}
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

        {/* Assign Account Officer Modal */}
        <AssignAccountOfficerModal
          isOpen={isAssignOfficerModalOpen}
          onClose={() => setIsAssignOfficerModalOpen(false)}
          onConfirm={handleOfficerAssigned}
          distributorName="Alhaji Bello & Sons"
          distributorData={{
            distributor: "Alhaji Bello & Sons",
            phoneNumber: "09098765432",
            account: "09098765432",
            region: "South West",
            officers: "Funmi Adeo, David Ukoh",
            wallet: "₦1,24,000",
            stock: "₦1,224,000",
            ticket: "1",
          }}
        />

        {/* Loading Officer Success Modal */}
        <LoadingOfficerSuccessModal
          isOpen={isLoadingOfficerSuccessOpen}
          onClose={() => {
            setIsLoadingOfficerSuccessOpen(false);
            setIsAssignOfficerModalOpen(false);
          }}
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
