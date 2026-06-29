"use client";

import { BoldBottomText } from "@/components/common/BoldBottomText";

interface OverviewSectionProps {
  distributorName: string;
  phoneNumber: string;
  emailAddress: string;
  region: string;
  accountOfficer: string;
  accountBalance: string;
  stockBalance: string;
  lastActivity: string;
}

export default function OverviewSection({
  distributorName,
  phoneNumber,
  emailAddress,
  region,
  accountOfficer,
  accountBalance,
  stockBalance,
  lastActivity,
}: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        <BoldBottomText top="Distributor Name" bottom={distributorName} />
        <BoldBottomText top="Phone Number" bottom={phoneNumber} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        <BoldBottomText top="Email Address" bottom={emailAddress} />
        <BoldBottomText top="Region" bottom={region} />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-6">
        <BoldBottomText top="Account Officer" bottom={accountOfficer} />
        <BoldBottomText top="Account Balance" bottom={accountBalance} />
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-2 gap-6">
        <BoldBottomText top="Stock Balance" bottom={stockBalance} />
        <BoldBottomText top="Last Activity" bottom={lastActivity} />
      </div>
    </div>
  );
}
