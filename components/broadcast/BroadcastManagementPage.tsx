"use client";

import { BroadcastForm } from "@/components/broadcast/BroadcastForm";
import { BroadcastHistory } from "@/components/broadcast/BroadcastHistory";

const mockBroadcastHistory = [
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

export function BroadcastManagementPage() {
  return (
    <div className="w-full bg-[#F8F8F8] min-h-screen p-6">
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-6 items-start">
        {/* Left Section */}
        <BroadcastForm />

        {/* Right Section */}
        <BroadcastHistory items={mockBroadcastHistory} />
      </div>
    </div>
  );
}
