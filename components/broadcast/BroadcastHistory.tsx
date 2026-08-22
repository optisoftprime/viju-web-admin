"use client";

import { useState } from "react";
import { Text } from "@/components/common/Text";
import { BroadcastHistoryCard } from "./BroadcastHistoryCard";
import {
  useBroadcastHistory,
  useBroadcastDetail,
} from "@/hooks/api/useBroadcast";
import { Modal } from "@/components/common/Modal";
import { BroadcastHistoryItem, BroadcastRegion } from "@/lib/api/types";
import { formatRegion, formatToNairaExact } from "@/src/utils/formatter";

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
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch broadcast history
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useBroadcastHistory({
    page: 1,
    pageSize: 20,
  });

  // Fetch broadcast detail when modal is opened
  const { data: broadcastDetail, isLoading: isDetailLoading } =
    useBroadcastDetail(isDetailModalOpen ? selectedBroadcastId : null);

  const broadcasts: BroadcastHistoryItem[] = historyData?.data ?? [];

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
        <Text variant="body" weight="bold" color="foreground" className="mb-4">
          Broadcast History
        </Text>

        {isHistoryLoading && (
          <Text variant="caption" color="muted" className="text-center py-8">
            Loading broadcast history...
          </Text>
        )}

        {historyError && (
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
            No broadcast has been sent yet.
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
