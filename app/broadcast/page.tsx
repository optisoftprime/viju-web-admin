"use client";

import MainLayout from "@/components/common/MainLayout";
import { BroadcastManagementPage } from "@/components/broadcast/BroadcastManagementPage";
import ArrowBack from "@/components/common/ArrowBack";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

/**
 * Spec 44: broadcasts are an ADMIN and REGIONAL_ADMIN screen (spec 40 gave the
 * regional admin their own region-scoped view of it).
 *
 * This page carried NO route guard at all - not even `ProtectedRoute`. It was
 * reachable signed out, where it would render the composer and fail every
 * request. Both guards are added here rather than only the role one.
 */
export default function BroadcastPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <RoleProtectedRoute allow={["ADMIN", "REGIONAL_ADMIN"]}>
        <MainLayout>
          <div className="px-4 pt-4">
            <ArrowBack />
          </div>
          <BroadcastManagementPage />
        </MainLayout>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
