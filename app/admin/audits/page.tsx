"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuditTickets } from "@/hooks/api/useAudit";
import { auditService } from "@/services/audit.service";
import { BroadcastRegion } from "@/lib/api/types";
import ExportRecord from "@/components/ExportRecord";

// Table columns definition
const tableColumns = [
  {
    key: "ticketId" as const,
    title: "TICKET ID",
  },
  {
    key: "subject" as const,
    title: "SUBJECT",
  },
  {
    key: "customerName" as const,
    title: "CUSTOMER",
  },
  {
    key: "region" as const,
    title: "REGION",
  },
  {
    key: "status" as const,
    title: "STATUS",
  },
  {
    key: "createdAt" as const,
    title: "DATE",
  },
];

// Region options for tabs
const regions = [
  { name: "All Regions", value: "" },
  { name: "Lagos", value: "LAGOS" },
  { name: "South West", value: "SOUTH_WEST" },
  { name: "South East", value: "SOUTH_EAST" },
  { name: "North", value: "NORTH" },
];

// Transform API data to table format
interface AuditTableRow {
  id: string;
  ticketId: string;
  subject: string;
  customerName: string;
  region: string;
  status: string;
  createdAt: string;
}

function InteractionAuditContent() {
  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("");

  // State for filter inputs
  const [customerName, setCustomerName] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [keyword, setKeyword] = useState("");

  // State for date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch audit tickets from API
  const {
    data: auditData,
    isLoading,
    error,
  } = useAuditTickets({
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion ? (selectedRegion as BroadcastRegion) : undefined,
    customerName: customerName || undefined,
    officerName: officerName || undefined,
    keyword: keyword || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  /**
   * Transform API response to table format
   */
  const tableData: AuditTableRow[] = useMemo(() => {
    if (!auditData?.data) return [];

    return auditData.data.map((ticket) => ({
      id: ticket.id,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      customerName: ticket.customer.name,
      region: ticket.customer.region,
      status: ticket.status,
      createdAt: new Date(ticket.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    }));
  }, [auditData?.data]);

  const totalItems = auditData?.meta.total || 0;
  const totalPages = auditData?.meta.totalPages || 1;

  /**
   * Handle region change
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

    setCurrentPage(1);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);

    setCurrentPage(1);
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
      const csvBlob = await auditService.exportTickets({
        page: currentPage,
        pageSize: itemsPerPage,
        region: selectedRegion
          ? (selectedRegion as BroadcastRegion)
          : undefined,
        customerName: customerName || undefined,
        officerName: officerName || undefined,
        keyword: keyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      downloadCsvFile(csvBlob, "viju-audit-tickets.csv");
    } catch (error) {
      console.error("Audit export failed", error);
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
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header Component */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Interaction Audits"
            subtitle="Monitor and track all system interactions"
          />
          <ExportRecord onClick={handleExport} />
        </div>

        {/* Audit Logs Card */}
        <Card border={false}>
          {/* Filters Section */}
          <div className="space-y-4">
            {/* Row 1: Region Filter Tabs */}
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
                      ? "bg-linear-to-r from-primary via-orange to-primary text-white border border-primary"
                      : "bg-white border border-muted/30 hover:border-primary hover:bg-primary hover:text-white"
                  }
                >
                  {region.name}
                </Button>
              ))}
            </div>

            {/* Row 2: Filter Input Fields */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Customer name"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
              <input
                type="text"
                value={officerName}
                onChange={(e) => {
                  setOfficerName(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Officer name"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Keyword"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
            </div>

            {/* Row 3: Date Filters */}
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

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              Loading audit tickets...
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-red-500">
              Error loading audit tickets. Please try again.
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
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
            </>
          )}
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
