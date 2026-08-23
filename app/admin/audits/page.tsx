"use client";

import { useMemo, useState } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button, Table } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ProtectedRoute from "@/components/ProtectedRoute";
import ExportRecord from "@/components/ExportRecord";
import TicketDetailModal from "@/components/ticket/TicketDetailModal";
import ChatThreadModal from "@/components/chat/ChatThreadModal";
import { formatRegion } from "@/utils/formatter";
import { formatTicketStatus } from "@/constants/tickets";
import { safeArray, safeNumber, safeText, safeDateText } from "@/utils/safe";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useAuditTickets, useAuditChats } from "@/hooks/api/useAudit";
import { BroadcastRegion } from "@/lib/api/types";
import type { AuditChatThread, AuditTicket } from "@/lib/api/types";
import { REGION_FILTER_TABS } from "@/constants/regions";
import { auditService } from "@/services/audit.service";
import { downloadCsvFile } from "@/utils/download";
import { getErrorMessage, isRegionNotSetError } from "@/utils/apiError";
import { toast } from "sonner";
import ArrowBack from "@/components/common/ArrowBack";

/**
 * Which interaction the screen is auditing.
 *
 * The two tabs are the same screen with a different table behind them: the
 * filter strip, the date range and the pagination are shared, and only the
 * columns, the query and the modal a row opens differ.
 */
type AuditTab = "tickets" | "chats";

const AUDIT_TABS: { value: AuditTab; label: string }[] = [
  { value: "tickets", label: "Ticket" },
  { value: "chats", label: "Chat" },
];

/**
 * Read the tab out of `?tab=`.
 *
 * The admin dashboard deep-links here from its Open Tickets and Unread
 * Messages tiles, so both the singular ("ticket") and plural spellings are
 * accepted. Anything else falls back to the ticket tab.
 */
const parseTab = (value?: string | null): AuditTab => {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "chat" || raw === "chats" || raw === "message" || raw === "messages") {
    return "chats";
  }
  return "tickets";
};

// Ticket tab columns
const ticketColumns = [
  { key: "ticketId" as const, title: "TICKET ID" },
  { key: "subject" as const, title: "SUBJECT" },
  { key: "customerName" as const, title: "CUSTOMER" },
  { key: "region" as const, title: "REGION" },
  { key: "status" as const, title: "STATUS" },
  { key: "createdAt" as const, title: "DATE" },
];

// Chat tab columns - one row per CONVERSATION, not per message
const chatColumns = [
  { key: "customerName" as const, title: "CUSTOMER" },
  { key: "officerName" as const, title: "ACCOUNT OFFICER" },
  { key: "region" as const, title: "REGION" },
  { key: "messageCount" as const, title: "MESSAGES" },
  { key: "lastMessageAt" as const, title: "LAST MESSAGE" },
];

// Region options for tabs - canonical list, see @/constants/regions
const regions = REGION_FILTER_TABS;

interface AuditTicketRow {
  id: string;
  ticketId: string;
  subject: string;
  customerName: string;
  region: string;
  status: string;
  createdAt: string;
}

interface AuditChatRow {
  /** "<customerId>:<officerId>" - unique per conversation, so the row key */
  id: string;
  customerId: string | null;
  customerName: string;
  officerName: string;
  region: string;
  messageCount: number;
  lastMessageAt: string;
}

function InteractionAuditContent() {
  // Tab preselected by the dashboard tile that linked here
  const tabParam = useQueryParam("tab");
  /**
   * null means "nobody has pressed a tab yet", which is what lets `?tab=`
   * decide. Once a tab is pressed the choice is the user's and the link stops
   * applying. Derived rather than synced in an effect, so the first render
   * already shows the linked tab.
   */
  const [pickedTab, setPickedTab] = useState<AuditTab | null>(null);
  const activeTab: AuditTab = pickedTab ?? parseTab(tabParam);

  // State for active region filter
  const [selectedRegion, setSelectedRegion] = useState("");

  // State for filter inputs
  const [customerName, setCustomerName] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [keyword, setKeyword] = useState("");

  // State for date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for the CSV export of whichever tab is showing
  const [isExporting, setIsExporting] = useState(false);

  // Row opened from the ticket tab
  const [selectedTicketRow, setSelectedTicketRow] =
    useState<AuditTicketRow | null>(null);

  // Row opened from the chat tab
  const [selectedChatRow, setSelectedChatRow] = useState<AuditChatRow | null>(
    null,
  );

  // State for pagination
  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  // One filter object, applied to whichever tab is showing
  const filters = {
    page: currentPage,
    pageSize: itemsPerPage,
    region: selectedRegion ? (selectedRegion as BroadcastRegion) : undefined,
    customerName: customerName || undefined,
    officerName: officerName || undefined,
    keyword: keyword || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  // Only the visible tab reaches the network
  const {
    data: auditData,
    isLoading: isTicketsLoading,
    error: ticketsError,
  } = useAuditTickets({ ...filters, enabled: activeTab === "tickets" });

  const {
    data: chatData,
    isLoading: isChatsLoading,
    error: chatsError,
  } = useAuditChats({ ...filters, enabled: activeTab === "chats" });

  /**
   * Transform the ticket response into table rows
   */
  const ticketRows: AuditTicketRow[] = useMemo(() => {
    return safeArray<AuditTicket>(auditData?.data).map(
      (ticket, index) => ({
        id: safeText(ticket?.id, `ticket-${index}`),
        ticketId: safeText(ticket?.ticketId),
        subject: safeText(ticket?.subject, "No subject"),
        customerName: safeText(ticket?.customer?.name, "Unknown customer"),
        region: formatRegion(ticket?.customer?.region),
        status: formatTicketStatus(ticket?.status),
        createdAt: safeDateText(ticket?.createdAt),
      }),
    );
  }, [auditData?.data]);

  /**
   * Transform the chat response into table rows.
   * Customer and officer are nullable - a deleted record still leaves the
   * conversation in the audit trail.
   */
  const chatRows: AuditChatRow[] = useMemo(() => {
    return safeArray<AuditChatThread>(chatData?.data).map((thread, index) => ({
      id: safeText(thread?.id, `thread-${index}`),
      customerId:
        typeof thread?.customer?.id === "string" ? thread.customer.id : null,
      customerName: safeText(thread?.customer?.name, "Unknown customer"),
      officerName: safeText(thread?.officer?.name, "Unassigned"),
      region: formatRegion(thread?.customer?.region),
      messageCount: safeNumber(thread?.messageCount, 0),
      lastMessageAt: safeDateText(thread?.lastMessageAt, "No messages yet"),
    }));
  }, [chatData?.data]);

  const activeMeta = activeTab === "tickets" ? auditData?.meta : chatData?.meta;
  const isLoading = activeTab === "tickets" ? isTicketsLoading : isChatsLoading;
  const error = activeTab === "tickets" ? ticketsError : chatsError;

  const totalItems = safeNumber(activeMeta?.total, 0);
  const totalPages = Math.max(1, safeNumber(activeMeta?.totalPages, 1));
  // The server clamps pageSize - report what it actually applied
  const appliedPageSize = getAppliedPageSize(activeMeta, itemsPerPage);

  // The chat table row is a flattened view - the full thread carries the
  // messages the modal falls back to
  const selectedThread = useMemo(
    () =>
      safeArray<AuditChatThread>(chatData?.data).find(
        (thread) => thread?.id === selectedChatRow?.id,
      ),
    [chatData?.data, selectedChatRow?.id],
  );

  /**
   * Switch tab. The filters carry over deliberately - an admin narrowing to a
   * region then checking both interaction types should not have to retype it.
   */
  const handleTabChange = (tab: AuditTab) => {
    if (tab === activeTab) return;
    setPickedTab(tab);
    setSelectedTicketRow(null);
    setSelectedChatRow(null);
    resetPage();
  };

  /**
   * Handle region change
   */
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    resetPage();
  };

  /**
   * Handle date change
   */
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    resetPage();
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    resetPage();
  };

  // Only a date selection surfaces the clear button
  const hasDateFilter = Boolean(startDate || endDate);

  /**
   * Clear the search inputs and the date range
   * Clearing re-keys the query, which refetches the unfiltered list
   */
  const handleClearFilters = () => {
    setCustomerName("");
    setOfficerName("");
    setKeyword("");
    setStartDate("");
    setEndDate("");
    resetPage();
  };

  /**
   * A regional admin with no region on their staff record cannot be scoped, so
   * the API refuses rather than showing them every region. That is an account
   * problem, not an empty list.
   */
  const regionNotSet = isRegionNotSetError(error);

  /**
   * Export the tab being looked at, with the filters that are applied to it.
   * Both endpoints take the same query string and answer with CSV, so the
   * only difference is which one is called and what the file is named.
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvBlob =
        activeTab === "tickets"
          ? await auditService.exportTickets(filters)
          : await auditService.exportChats(filters);

      downloadCsvFile(
        csvBlob,
        activeTab === "tickets"
          ? "viju-tickets-audit.csv"
          : "viju-audit-chats.csv",
      );
    } catch (exportError) {
      toast.error(getErrorMessage(exportError, "Export failed"));
    } finally {
      setIsExporting(false);
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

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-20 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        {/* Page Header Component */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Interaction Audits"
            subtitle="Monitor and track all system interactions"
          />
          <ExportRecord onClick={handleExport} isLoading={isExporting} />
        </div>

        {/* The API refuses a region-scoped read for an account with no region */}
        {regionNotSet && (
          <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
            <Text variant="caption" weight="medium" color="orange">
              {getErrorMessage(
                error,
                "No region is set on your account. Contact an administrator.",
              )}
            </Text>
          </div>
        )}

        {/* Interaction type tabs - Ticket / Chat */}
        <div
          className="grid grid-cols-2"
          role="tablist"
          aria-label="Interaction type"
        >
          {AUDIT_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.value)}
                className={`text-center font-medium pb-2 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-muted/20 text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
                  {region.label}
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
                  resetPage();
                }}
                placeholder="Customer name"
                aria-label="Filter by customer name"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
              <input
                type="text"
                value={officerName}
                onChange={(e) => {
                  setOfficerName(e.target.value);
                  resetPage();
                }}
                placeholder="Officer name"
                aria-label="Filter by officer name"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  resetPage();
                }}
                placeholder="Keyword"
                aria-label="Filter by keyword"
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
              />
            </div>

            {/* Row 3: Date Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
                aria-label="Start date"
                placeholder="Start date"
              />
              <span className="text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="px-3 py-2 border border-muted/30 rounded-lg text-sm"
                aria-label="End date"
                placeholder="End date"
              />

              {/* Shown once a date is picked; clears the dates and search inputs */}
              {hasDateFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="py-6 text-center text-muted">
              {activeTab === "tickets"
                ? "Loading audit tickets..."
                : "Loading audit chats..."}
            </div>
          )}

          {/* Error bodies are { message, code, statusCode } and the message is
              safe to display, so show what the API actually said */}
          {!isLoading && error && !regionNotSet && (
            <div className="py-6 text-center text-primary">
              {getErrorMessage(
                error,
                activeTab === "tickets"
                  ? "Error loading audit tickets. Please try again."
                  : "Error loading audit chats. Please try again.",
              )}
            </div>
          )}

          {/* Data Table - columns and row behaviour follow the active tab */}
          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto mt-6">
                {activeTab === "tickets" ? (
                  <Table
                    columns={ticketColumns}
                    data={ticketRows}
                    onRowClick={setSelectedTicketRow}
                    onActionClick={() => {}}
                    rowKey={(row) => row.id}
                  />
                ) : (
                  <Table
                    columns={chatColumns}
                    data={chatRows}
                    onRowClick={setSelectedChatRow}
                    onActionClick={() => {}}
                    rowKey={(row) => row.id}
                  />
                )}
              </div>

              <Text variant="small" color="muted" className="mt-2 block">
                {activeTab === "tickets"
                  ? "Select a ticket to read the thread, reply and update its status."
                  : "Select a conversation to read it and reply to the customer."}
              </Text>

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

        {/* Ticket thread - an admin replies and moves the status exactly as
            the account officer does */}
        <TicketDetailModal
          key={selectedTicketRow?.id ?? "empty"}
          open={!!selectedTicketRow}
          onClose={() => setSelectedTicketRow(null)}
          ticketId={selectedTicketRow?.id ?? null}
          distributorId={null}
          distributorName={selectedTicketRow?.customerName}
        />

        {/* Chat thread - opened from the Chat tab */}
        <ChatThreadModal
          // Remounting per conversation keeps one thread's draft out of the next
          key={selectedChatRow?.id ?? "empty"}
          open={!!selectedChatRow}
          onClose={() => setSelectedChatRow(null)}
          customerId={selectedChatRow?.customerId ?? null}
          customerName={selectedChatRow?.customerName}
          officerName={selectedChatRow?.officerName}
          region={selectedChatRow?.region}
          fallbackMessages={selectedThread?.messages}
        />
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
