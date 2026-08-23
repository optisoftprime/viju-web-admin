"use client";

import MainLayout from "@/components/common/MainLayout";
import { BroadcastManagementPage } from "@/components/broadcast/BroadcastManagementPage";
import ArrowBack from "@/components/common/ArrowBack";

export default function BroadcastPage() {
  return (
    <MainLayout>
      <div className="px-4 pt-4">
        <ArrowBack />
      </div>
      <BroadcastManagementPage />
    </MainLayout>
  );
}
