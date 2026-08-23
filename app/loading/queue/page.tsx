"use client";

import { MainLayout } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingOfficer from "@/components/loadingOfficer/LoadingOfficer";
import ArrowBack from "@/components/common/ArrowBack";

/**
 * My Loading Queue (LO-02..LO-05).
 *
 * This page previously carried its own 400-line mock that duplicated
 * components/loadingOfficer/. That component is now wired to the live
 * endpoints (GET /loading/queue, GET /loading/queue/{id},
 * PATCH /loading/queue/{id}/status, POST /loading/queue/{id}/waybill), so the
 * page just hosts it - one implementation, one source of truth.
 */
function LoadingQueueContent() {
  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        <PageHeader
          title="My Loading Queue"
          subtitle="Manage your assigned loading requests"
        />

        <LoadingOfficer />
      </div>
    </MainLayout>
  );
}

export default function LoadingQueuePage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <LoadingQueueContent />
    </ProtectedRoute>
  );
}
