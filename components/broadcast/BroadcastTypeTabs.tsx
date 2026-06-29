"use client";

import { Text } from "@/components/common/Text";

interface BroadcastTypeTabsProps {
  activeTab: "regional" | "individual";
  onChange: (tab: "regional" | "individual") => void;
}

export function BroadcastTypeTabs({
  activeTab,
  onChange,
}: BroadcastTypeTabsProps) {
  const tabs = [
    { id: "regional", label: "Regional" },
    { id: "individual", label: "Individual" },
  ] as const;

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`h-8 px-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === tab.id
              ? "bg-[#FF6A00] text-white border-0"
              : "border border-[#D1D5DB] bg-white text-[#374151] hover:bg-gray-50"
          }`}
        >
          <Text
            variant="caption"
            weight="medium"
            color={activeTab === tab.id ? "white" : "foreground"}
          >
            {tab.label}
          </Text>
        </button>
      ))}
    </div>
  );
}
