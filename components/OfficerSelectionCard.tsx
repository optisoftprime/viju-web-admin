"use client";

import { Text } from "@/components/common";

interface OfficerSelectionCardProps {
  id: string;
  name: string;
  role: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function OfficerSelectionCard({
  id,
  name,
  role,
  isSelected = false,
  onClick,
}: OfficerSelectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-2 py-2 border-b bg-white cursor-pointer transition-all ${
        isSelected
          ? "border border-[#7B7B7B] rounded-md"
          : "border-b border-transparent"
      }`}
    >
      {/* Radio Indicator */}
      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0">
        {isSelected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF2D20]" />
        )}
      </div>

      {/* Officer Info */}
      <div className="flex flex-col gap-1">
        <Text variant="body" weight="bold" color="foreground">
          {name}
        </Text>
        <Text variant="caption" weight="medium" color="muted">
          {role}
        </Text>
      </div>
    </div>
  );
}
