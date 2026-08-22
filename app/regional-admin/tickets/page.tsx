"use client";

import { useMemo, useState } from "react";
import { MainLayout } from "@/components/common";
import { Card, Text, SearchInput } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ProtectedRoute from "@/components/ProtectedRoute";
import ExportRecord from "@/components/ExportRecord";
import TicketCard from "@/components/ticket/TicketCard";
import TicketThreadPanel from "@/components/ticket/TicketThreadPanel";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useAuditTickets } from "@/hooks/api/useAudit";
import { useUpdateTicketStatus } from "@/hooks/api/useOfficerCustomer";
import { auditService } from "@/services/audit.service";
import { useAuthStore } from "@/store/auth.store";
import { formatRegion } from "@/utils/formatter";
import { UNRESOLVED_TICKET_STATUSES } from "@/constants/tickets";
import { downloadCsvFile } from "@/utils/download";
import {
  getErrorMessage,
  isRegionNotSetError,
} from "@/utils/apiError";
import { safeArray, safeNumber, safeText, safeDateText } from "@/utils/safe";
import { toast } from "sonner";
import type { AuditTicket } from "@/lib/api/types";

/** One open ticket in the left-hand list */
interface RegionalTicketRow {
  id: string;
  ticketId: string;
  subject: string;
  customerName: string;
  region: string;
  status: string;
  repliesCount: number;
  updatedAt: string;
}

/** The statuses this screen asks the API for */
const OPEN_STATUSES = [...UNRESOLVED_TICKET_STATUSES];

function RegionalAdminTicketsContent() {
  const { user } = useAuthStore();
  const region = user?.region ?? undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  /**
   * Region is deliberately NOT sent: scoping on the audit routes is
   * token-derived and overriding, so anything we sent would be replaced with
   * the caller's own region anyway.
   *
   * `status` narrows to unresolved tickets server-side and `meta.total` counts
   * that filtered set, so the pager matches the rows on screen.
   */
  const {
    data: ticketsData,
    isLoading,
    error,
  } = useAuditTickets({
    page: currentPage,
    pageSize: itemsPerPage,
    keyword: searchTerm || undefined,
    status: OPEN_STATUSES,
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTicketStatus();

  const tickets: RegionalTicketRow[] = useMemo(() => {
    return safeArray<AuditTicket>(ticketsData?.data).map((ticket, index) => ({
      id: safeText(ticket?.id, `ticket-${index}`),
      ticketId: safeText(ticket?.ticketId),
      subject: safeText(ticket?.subject, "No subject"),
      customerName: safeText(ticket?.customer?.name, "Unknown customer"),
      region: formatRegion(ticket?.customer?.region),
      status: safeText(ticket?.status, "OPEN"),
      repliesCount: safeArray(ticket?.replies).length,
      updatedAt: safeDateText(ticket?.updatedAt, ""),
    }));
  }, [ticketsData?.data]);

  const totalItems = safeNumber(ticketsData?.meta?.total, 0);
  const totalPages = Math.max(1, safeNumber(ticketsData?.meta?.totalPages, 1));
  const appliedPageSize = getAppliedPageSize(ticketsData?.meta, itemsPerPage);

  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId,
  );

  /**
   * A regional admin with no region on their staff record cannot be scoped, so
   * the API refuses rather than showing them every region. That is an account
   * problem, not an empty list, and has to read as one.
   */
  const regionNotSet = isRegionNotSetError(error);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSelectedTicketId(null);
    resetPage();
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    updateStatus({ ticketId, status });
  };

  /** Same filters as the list, so the file matches what is on screen */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvBlob = await auditService.exportTickets({
        keyword: searchTerm || undefined,
        status: OPEN_STATUSES,
      });
      downloadCsvFile(csvBlob, "viju-tickets-audit.csv");
    } catch (exportError) {
      toast.error(getErrorMessage(exportError, "Export failed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-20 space-y-4 overflow-y-auto h-screen bg-milkwhite/90">
        <div className="flex items-center justify-between gap-4">
          <PageHeader
            title="Open Tickets"
            subtitle={
              region
                ? `Unresolved customer tickets in ${formatRegion(region)}`
                : "Unresolved customer tickets in your region"
            }
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

        <Card border={false}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text variant="caption" weight="medium" color="muted">
              {isLoading
                ? "Loading tickets..."
                : `${totalItems.toLocaleString()} open ${
                    totalItems === 1 ? "ticket" : "tickets"
                  }`}
            </Text>
            <SearchInput
              placeholder="Search subject or keyword"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {!isLoading && error && !regionNotSet && (
            <div className="py-6 text-center">
              <Text variant="caption" color="primary">
                {getErrorMessage(
                  error,
                  "Open tickets could not be loaded. Please try again.",
                )}
              </Text>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* List on the left, the conversation on the right - the tickets
                  stay on the page rather than opening in a modal */}
              <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr] gap-4 mt-4">
                <div className="space-y-2 max-h-136 overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <div className="py-10 text-center">
                      <Text variant="caption" color="muted">
                        No open tickets in your region right now.
                      </Text>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={
                          selectedTicketId === ticket.id
                            ? "rounded-lg ring-2 ring-primary"
                            : undefined
                        }
                      >
                        <TicketCard
                          ticketId={ticket.ticketId}
                          title={`${ticket.subject} - ${ticket.customerName}`}
                          status={ticket.status}
                          repliesUpdated={ticket.repliesCount}
                          dateUpdated={ticket.updatedAt}
                          onSelect={() => setSelectedTicketId(ticket.id)}
                          onStatusChange={(status) =>
                            handleStatusChange(ticket.id, status)
                          }
                          isUpdatingStatus={isUpdatingStatus}
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="border border-muted/20 rounded-lg bg-white">
                  <TicketThreadPanel
                    // Remounting per ticket clears any half-typed reply
                    key={selectedTicketId ?? "empty"}
                    ticketId={selectedTicketId}
                    customerName={selectedTicket?.customerName}
                    className="h-104"
                  />
                </div>
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={appliedPageSize}
                onPrevious={previousPage}
                onNext={() => nextPage(totalPages)}
                onItemsPerPageChange={setPageSize}
              />
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

/**
 * Regional Admin Open Tickets Page - Protected Route Wrapper
 *
 * Every unresolved ticket in the signed-in regional admin's own region, with
 * the conversation rendered beside the list. The admin reads the thread,
 * replies and moves the status exactly as an account officer does.
 *
 * Both halves are scoped by the API: the list is region-scoped from the token,
 * and the ticket routes allow a REGIONAL_ADMIN only inside their own region.
 */
export default function RegionalAdminTicketsPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RegionalAdminTicketsContent />
    </ProtectedRoute>
  );
}
