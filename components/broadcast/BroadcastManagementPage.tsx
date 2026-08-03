"use client";

import { BroadcastForm } from "@/components/broadcast/BroadcastForm";
import { BroadcastHistory } from "@/components/broadcast/BroadcastHistory";

export function BroadcastManagementPage() {
  return (
    <div className="w-full bg-[#F8F8F8] h-screen min-h-screen p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-6 items-start">
        {/* Left Section */}
        <BroadcastForm />

        {/* Right Section */}
        <BroadcastHistory />
      </div>
    </div>
  );
}
