"use client";

import { useState } from "react";
import { Text } from "@/components/common/Text";
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/Pagination";
import { BroadcastHistoryCard } from "./BroadcastHistoryCard";
import {
  useBroadcastHistory,
  useBroadcastDetail,
} from "@/hooks/api/useBroadcast";
import { Modal } from "@/components/common/Modal";
import { usePagination } from "@/hooks/usePagination";
import { BroadcastHistoryItem, BroadcastRegion } from "@/lib/api/types";
import { formatRegion, formatToNairaExact } from "@/src/utils/formatter";
import { normalizeStaffRole } from "@/constants/roles";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage, isRegionNotSetError } from "@/utils/apiError";



const formatRegions = (regions: BroadcastRegion[]) =>
  regions.map(formatRegion).join(", ");

/**
 * Who the broadcast went to - the regions for a regional broadcast,
 * the distributor for an individual one
 */
const buildBroadcastTarget = (item: BroadcastHistoryItem) => {
  if (item.type === "REGIONAL") {
    return item.targetRegions?.length
      ? formatRegions(item.targetRegions)
      : "All regions";
  }
  return item.targetCustomer?.name || "Distributor";
};

const formatSentAt = (sentAt: string) => {
  const date = new Date(sentAt);
  if (isNaN(date.getTime())) return sentAt;

  const time = date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) return `Today, ${time}`;

  return `${date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
  })}, ${time}`;
};

export function BroadcastHistory() {
  const { user } = useAuthStore();

  /**
   * Spec 40: a REGIONAL_ADMIN sees their own region's broadcasts only, search
   * included.
   *
   * `region` is deliberately NOT sent. The scoping is the server's, resolved
   * from the token the same way the audit routes already do it - raised as
   * **RB-1**. Naming a region from here would be guessing at whether this
   * route honours, ignores or refuses one, and a wrong guess either leaks
   * every region or 403s the page.
   */
  const isRegionScoped =
    normalizeStaffRole(user?.role) === "REGIONAL_ADMIN";

  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    currentPage,
    pageSize,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination(10);

  const isSearching = searchTerm.trim().length > 0;

  /**
   * B-1: `search` is applied SERVER-SIDE across the whole history, matched
   * case-insensitively and partially on the reference, the message and - for
   * an individual broadcast - the recipient's name.
   *
   * This used to fetch a 200-row window and match in the browser, which
   * silently stopped being a search at broadcast 201. Pagination is now the
   * server's in both modes, and `meta.total` is the size of the filtered set.
   */
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useBroadcastHistory({
    page: currentPage,
    pageSize,
    search: searchTerm.trim() || undefined,
  });

  // Fetch broadcast detail when modal is opened
  const { data: broadcastDetail, isLoading: isDetailLoading } =
    useBroadcastDetail(isDetailModalOpen ? selectedBroadcastId : null);

  const broadcasts: BroadcastHistoryItem[] = historyData?.data ?? [];

  const totalItems = historyData?.meta?.total ?? broadcasts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleViewDetail = (broadcastId: string) => {
    setSelectedBroadcastId(broadcastId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBroadcastId(null);
  };

  // Exact - the currency style caps at 2 fraction digits and would round the
  // allowance the API actually recorded
  const formatCurrency = (value: number) => formatToNairaExact(value);

  return (
    <>
      <div className="h-screen overflow-y-auto pb-30">
        <Text variant="body" weight="bold" color="foreground" className="mb-1">
          Broadcast History
        </Text>
        {isRegionScoped && (
          <Text variant="caption" color="muted" className="mb-3 block">
            Broadcasts sent to{" "}
            {user?.region ? formatRegion(user.region) : "your region"}.
          </Text>
        )}

        {/* Spec 39 - search the history */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search reference, message or recipient"
            onSearch={handleSearch}
            debounceDelay={300}
            fullWidth
          />
          {isSearching && !isHistoryLoading && !historyError && (
            <Text variant="thinnote" color="muted" className="mt-1 block">
              {totalItems} matching broadcast{totalItems === 1 ? "" : "s"}.
            </Text>
          )}
        </div>

        {isHistoryLoading && (
          <Text variant="caption" color="muted" className="text-center py-8">
            Loading broadcast history...
          </Text>
        )}

        {/* An unconfigured regional admin is refused rather than handed every
            region - an account problem, not an empty history */}
        {historyError && isRegionNotSetError(historyError) && (
          <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 space-y-1">
            <Text variant="caption" weight="semibold" color="orange">
              No region is set on your account
            </Text>
            <Text variant="caption" weight="medium" color="orange">
              {getErrorMessage(
                historyError,
                "No region is set on your account. Contact an administrator.",
              )}
            </Text>
          </div>
        )}

        {historyError && !isRegionNotSetError(historyError) && (
          <Text
            variant="caption"
            color="muted"
            className="text-center py-8 text-red-500"
          >
            Failed to load broadcast history. Please try again.
          </Text>
        )}

        {!isHistoryLoading && !historyError && broadcasts.length === 0 && (
          <Text variant="caption" color="muted" className="text-center py-8">
            {isSearching
              ? "No broadcast matches that search."
              : "No broadcast has been sent yet."}
          </Text>
        )}

        <div className="space-y-4">
          {broadcasts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleViewDetail(item.id)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <BroadcastHistoryCard
                code={item.reference}
                target={buildBroadcastTarget(item)}
                message={item.message}
                allowance={item.deliveryAllowance ?? undefined}
                sentBy={item.sentBy?.name || "Viju Admin"}
                time={formatSentAt(item.sentAt)}
              />
            </div>
          ))}
        </div>

        {/* Spec 39 - paginated, whichever list is being shown */}
        {!isHistoryLoading && !historyError && totalItems > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPrevious={previousPage}
              onNext={() => nextPage(totalPages)}
              onItemsPerPageChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Broadcast Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title="Broadcast Details"
      >
        <div className="p-6">
          {isDetailLoading ? (
            <Text variant="caption" color="muted" className="text-center">
              Loading broadcast details...
            </Text>
          ) : broadcastDetail ? (
            <div className="space-y-4">
              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Reference
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.reference}
                </Text>
              </div>

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Type
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.type === "REGIONAL"
                    ? "Regional"
                    : "Individual"}
                </Text>
              </div>

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Message
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.message}
                </Text>
              </div>

              {broadcastDetail.targetRegions?.length > 0 && (
                <div>
                  <Text variant="small" weight="bold" color="foreground">
                    Regions
                  </Text>
                  <Text variant="caption" color="muted">
                    {formatRegions(broadcastDetail.targetRegions)}
                  </Text>
                </div>
              )}

              {broadcastDetail.targetCustomer && (
                <div>
                  <Text variant="small" weight="bold" color="foreground">
                    Distributor
                  </Text>
                  <Text variant="caption" color="muted">
                    {broadcastDetail.targetCustomer.name}
                  </Text>
                </div>
              )}

              {!!broadcastDetail.deliveryAllowance &&
                broadcastDetail.deliveryAllowance > 0 && (
                  <div>
                    <Text variant="small" weight="bold" color="foreground">
                      Delivery Allowance
                    </Text>
                    <Text variant="caption" color="muted">
                      {formatCurrency(broadcastDetail.deliveryAllowance)}
                      {broadcastDetail.allowancePayment
                        ? ` • credited ${new Date(
                            broadcastDetail.allowancePayment.date,
                          ).toLocaleString()}`
                        : ""}
                    </Text>
                  </div>
                )}

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Delivered To
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.deliveredCount}{" "}
                  {broadcastDetail.deliveredCount === 1
                    ? "distributor"
                    : "distributors"}
                </Text>
              </div>

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Sent By
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.sentBy?.name || "Viju Admin"}
                </Text>
              </div>

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Sent At
                </Text>
                <Text variant="caption" color="muted">
                  {new Date(broadcastDetail.sentAt).toLocaleString()}
                </Text>
              </div>
            </div>
          ) : (
            <Text variant="caption" color="muted" className="text-center">
              No broadcast details available
            </Text>
          )}
        </div>
      </Modal>
    </>
  );
}
