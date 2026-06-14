"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ProtectedRoute from "@/components/ProtectedRoute";

// Interface for audit data structure
interface AuditLog {
  id: string;
  officer: string;
  email: string;
  action: string;
  timestamp: string;
  region: string;
  status: string;
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
    key: "action" as const,
    title: "ACTION",
  },
  {
    key: "timestamp" as const,
    title: "TIMESTAMP",
  },
  {
    key: "region" as const,
    title: "REGION",
  },
  {
    key: "status" as const,
    title: "STATUS",
  },
];

// Mock audit log data
const mockAuditData: AuditLog[] = [
  {
    id: "1",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Login",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
  {
    id: "2",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Customer Update",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
  {
    id: "3",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Report Generated",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Pending",
  },
  {
    id: "4",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Data Export",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Failed",
  },
  {
    id: "5",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Login",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
  {
    id: "6",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Customer Update",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
  {
    id: "7",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Report Generated",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Pending",
  },
  {
    id: "8",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Data Export",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Failed",
  },
  {
    id: "9",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Login",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
  {
    id: "10",
    officer: "James Okonkwo",
    email: "james@gmail.com",
    action: "Customer Update",
    timestamp: "2026-06-10 09:14:32",
    region: "Lagos",
    status: "Success",
  },
];

// Region options for tabs
const regions = [
  { name: "All Regions", value: "all" },
  { name: "Lagos", value: "Lagos" },
  { name: "South West", value: "South West" },
  { name: "South East", value: "South East" },
  { name: "North", value: "North" },
];

function InteractionAuditContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("all");

  // State for date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * Filter audit logs by selected region and dates
   */
  const filteredAudits = useMemo(() => {
    let filtered = mockAuditData;

    if (selectedRegion !== "all") {
      filtered = filtered.filter((audit) => audit.region === selectedRegion);
    }

    // Filter by date range if dates are provided
    if (startDate && endDate) {
      filtered = filtered.filter((audit) => {
        const auditDate = new Date(audit.timestamp).toLocaleDateString("en-CA");
        return auditDate >= startDate && auditDate <= endDate;
      });
    }

    return filtered;
  }, [selectedRegion, startDate, endDate]);

  /**
   * Calculate pagination
   */
  const totalItems = filteredAudits.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAudits.slice(startIndex, endIndex);
  }, [filteredAudits, currentPage]);

  /**
   * Handle region change and reset pagination
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setCurrentPage(1);
  };

  /**
   * Handle date change
   */
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    console.log("Start date changed:", date);
    setCurrentPage(1);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    console.log("End date changed:", date);
    setCurrentPage(1);
  };

  /**
   * Handle search input
   */
  const handleSearch = (value: string) => {
    console.log("Search value:", value);
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

  return (
    <MainLayout>
      <div className="p-4 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <PageHeader
          title="Interaction Audits"
          subtitle="Monitor and track all system interactions"
        />

        {/* Audit Logs Card */}
        <Card border={false}>
          {/* Filters Section */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Region Filter Tabs */}
            <div className="flex items-center space-x-3 flex-wrap">
              {regions.map((region) => (
                <Button
                  key={region.value}
                  variant={
                    selectedRegion === region.value ? "primary" : "outline"
                  }
                  onClick={() => handleRegionChange(region.value)}
                  className={
                    selectedRegion === region.value
                      ? "bg-gradient-to-r from-primary via-orange to-primary text-white border border-primary"
                      : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {region.name}
                </Button>
              ))}
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
                placeholder="Start date"
              />
              <span className="text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
                placeholder="End date"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto mt-6">
            <Table
              columns={tableColumns}
              data={paginatedData}
              onRowClick={() => {}}
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
          />
        </Card>
      </div>
    </MainLayout>
  );
}

/**
 * Interaction Audit Page - Protected Route Wrapper
 */
export default function InteractionAuditPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <InteractionAuditContent />
    </ProtectedRoute>
  );
}
