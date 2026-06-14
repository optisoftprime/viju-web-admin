"use client";

import { useState } from "react";
import { Text } from "@/components/common/Text";
import { BroadcastHistoryCard } from "./BroadcastHistoryCard";
import {
  useBroadcastHistory,
  useBroadcastDetail,
} from "@/hooks/api/useBroadcast";
import { Modal } from "@/components/common/Modal";
import { BroadcastDetail as BroadcastDetailType } from "@/lib/api/types";

interface BroadcastHistoryItem {
  id: number;
  code: string;
  target: string;
  message: string;
  allowance?: number;
  sentBy: string;
  time: string;
}

interface BroadcastHistoryProps {
  items?: BroadcastHistoryItem[];
}

const mockBroadcastHistory: BroadcastHistoryItem[] = [
  {
    id: 1,
    code: "BR-104-Individual",
    target: "Alhaji Bello & Sons Ltd",
    message: "Delivery allowance credited for Q1 loyalty programme",
    allowance: 80000,
    sentBy: "O. Adesanya",
    time: "Today, 10:14",
  },
  {
    id: 2,
    code: "BR-104-Regional",
    target: "North South",
    message: "New stock of Viju Chocolate available from Monday",
    sentBy: "O. Adesanya",
    time: "Today, 10:14",
  },
  {
    id: 3,
    code: "BR-104-Individual",
    target: "Alhaji Bello & Sons Ltd",
    message: "Delivery allowance credited for Q1 loyalty programme",
    allowance: 80000,
    sentBy: "O. Adesanya",
    time: "Today, 10:14",
  },
  {
    id: 4,
    code: "BR-104-Regional",
    target: "North South",
    message: "New stock of Viju Chocolate available from Monday",
    sentBy: "O. Adesanya",
    time: "Today, 10:14",
  },
];

export function BroadcastHistory({ items }: BroadcastHistoryProps) {
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

  // Use provided items or fall back to mock data if API call fails or no data
  const displayItems = items || mockBroadcastHistory;

  const handleViewDetail = (broadcastId: string) => {
    setSelectedBroadcastId(broadcastId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBroadcastId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
            Failed to load broadcast history. Showing recent broadcasts.
          </Text>
        )}

        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleViewDetail(String(item.id))}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <BroadcastHistoryCard
                code={item.code}
                target={item.target}
                message={item.message}
                allowance={item.allowance}
                sentBy={item.sentBy}
                time={item.time}
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
                  Type
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.type}
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

              {broadcastDetail.regions &&
                broadcastDetail.regions.length > 0 && (
                  <div>
                    <Text variant="small" weight="bold" color="foreground">
                      Regions
                    </Text>
                    <Text variant="caption" color="muted">
                      {broadcastDetail.regions.join(", ")}
                    </Text>
                  </div>
                )}

              {broadcastDetail.distributorName && (
                <div>
                  <Text variant="small" weight="bold" color="foreground">
                    Distributor
                  </Text>
                  <Text variant="caption" color="muted">
                    {broadcastDetail.distributorName}
                  </Text>
                </div>
              )}

              {broadcastDetail.deliveryAllowance &&
                broadcastDetail.deliveryAllowance > 0 && (
                  <div>
                    <Text variant="small" weight="bold" color="foreground">
                      Delivery Allowance
                    </Text>
                    <Text variant="caption" color="muted">
                      {formatCurrency(broadcastDetail.deliveryAllowance)}
                    </Text>
                  </div>
                )}

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Sent By
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.sentBy}
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

              <div>
                <Text variant="small" weight="bold" color="foreground">
                  Status
                </Text>
                <Text variant="caption" color="muted">
                  {broadcastDetail.status}
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
