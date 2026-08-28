"use client";

import { MainLayout } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import ArrowBack from "@/components/common/ArrowBack";
import { Card } from "@/components/common";
import AllCustomersTable from "@/components/AllCustomersTable";
import { useAuthStore } from "@/store/auth.store";
import { normalizeStaffRole } from "@/constants/roles";
import { formatRegion } from "@/utils/formatter";
import { resolveRegion } from "@/constants/regions";
import { useQueryParam } from "@/hooks/useQueryParam";
import type { BroadcastRegion } from "@/lib/api/types";

/**
 * Spec 42: the Total Customers tile now opens a PAGE, not a dialog.
 *
 * It was always a full table - search, pagination, a page-size control, the
 * ERP projection notice and a row-details modal opening on top of it. A dialog
 * capped it at 85vh, nested a scroll inside a scroll, and put a second modal
 * over the first. As a page it is linkable, backable and printable, and the
 * row details are the only thing left that opens over it.
 *
 * The table itself is unchanged and shared with the officer's dialog, which
 * keeps its modal - a personal portfolio is small, and it is not what the spec
 * asked to move.
 */
function CustomersPageContent() {
  const { user } = useAuthStore();
  const role = normalizeStaffRole(user?.role);

  /**
   * An ADMIN may arrive from a region card on the dashboard, e.g.
   * ?region=LAGOS. A REGIONAL_ADMIN never sends one - their scope comes from
   * the token, and naming a region is a 403 on the routes behind this table.
   */
  const regionParam = useQueryParam("region");
  const region =
    role === "REGIONAL_ADMIN" ? undefined : resolveRegion(regionParam);

  const subtitle =
    role === "OFFICER"
      ? "Every distributor assigned to you"
      : role === "REGIONAL_ADMIN"
        ? `Every customer in ${
            user?.region ? formatRegion(user.region) : "your region"
          }`
        : region
          ? `Customers in ${formatRegion(region)}`
          : "Every customer across the organisation";

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        <PageHeader title="Customers" subtitle={subtitle} />

        <Card border={false}>
          <AllCustomersTable
            variant="page"
            region={region as BroadcastRegion | undefined}
          />
        </Card>
      </div>
    </MainLayout>
  );
}

export default function CustomersPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <CustomersPageContent />
    </ProtectedRoute>
  );
}
