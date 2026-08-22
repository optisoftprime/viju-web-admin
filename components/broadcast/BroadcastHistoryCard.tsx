"use client";

import { Megaphone } from "lucide-react";
import { Text } from "@/components/common/Text";
import { formatToNairaExact } from "@/utils/formatter";

interface BroadcastHistoryCardProps {
  code: string;
  target: string;
  message: string;
  allowance?: number;
  sentBy: string;
  time: string;
}

export function BroadcastHistoryCard({
  code,
  target,
  message,
  allowance,
  sentBy,
  time,
}: BroadcastHistoryCardProps) {
  // Exact - the currency style caps at 2 fraction digits and would round the
  // allowance the API actually recorded
  const formatCurrency = (value: number) => formatToNairaExact(value);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-2">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <Text variant="thinnote" color="muted">
          {code}
        </Text>
        <Text variant="thinnote" color="muted">
          {time}
        </Text>
      </div>

      {/* Details */}
      <div className="flex gap-3">
        <Megaphone size={16} className="text-[#374151] shrink-0 mt-1" />
        <div className="flex-1">
          <Text variant="small" weight="bold" color="foreground">
            {target}
          </Text>
          <Text variant="caption" color="muted" className="mt-1">
            {message}
          </Text>

          {allowance !== undefined && allowance > 0 && (
            <div className="inline-flex items-center mt-3 px-3 py-1 rounded-sm bg-[#DEFFF6]">
              <Text variant="small" weight="bold" color="statusgreen">
                Delivery allowance {formatCurrency(allowance)}
              </Text>
            </div>
          )}

          <Text variant="thinnote" color="muted" className="mt-4">
            Sent by {sentBy}
          </Text>
        </div>
      </div>
    </div>
  );
}
