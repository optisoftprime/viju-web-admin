"use client";

import { useMemo, useState } from "react";
import { AssignedCardProps } from "@/src/types/assignment";
import AssignedList from "./AssignedList";
import SelectedAssignement from "./SelectedAssignement";
import { Text } from "../common";
import { useLoadingQueue } from "@/hooks/api/useLoading";
import { LoadingRequest } from "@/lib/api/types";
import { safeText, safeDateText, humanizeEnum } from "@/utils/safe";

/**
 * Loading Officer queue (LO-02).
 *
 * Statuses arrive as UPPER_SNAKE (ASSIGNED | IN_PROGRESS | COMPLETED), not the
 * lower-case "assigned | in-progress | completed" the old mock used. Omitting
 * the status filter returns all three states so we group them here.
 */
const LoadingOfficer = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useLoadingQueue({ pageSize: 50 });

  // safeList in the service guarantees an array, even on a null body
  const rows: LoadingRequest[] = data?.data ?? [];

  const assignedList: (AssignedCardProps & { id: string })[] = useMemo(
    () =>
      rows.map((row) => ({
        id: safeText(row.id, ""),
        // The queue row exposes the ERP order reference on `orderId`
        assignedCode: safeText(row.waybill ?? row.orderId, "-"),
        assignedStatus: humanizeEnum(row.status, "Assigned"),
        assignedName: safeText(row.distributorName, "Unknown distributor"),
        assignedDate: [
          safeText(row.truckPlateNumber, ""),
          row.loadingDate ? safeDateText(row.loadingDate) : "",
        ]
          .filter(Boolean)
          .join(" - ") || safeDateText(row.submittedAt, "No date set"),
      })),
    [rows],
  );

  // Default to the first row once data lands, without fighting a user choice
  const activeId =
    selectedId && rows.some((row) => row.id === selectedId)
      ? selectedId
      : (rows[0]?.id ?? null);

  if (isLoading) {
    return (
      <section className="py-10 text-center">
        <Text variant="caption" color="muted">
          Loading your queue...
        </Text>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 text-center">
        <Text variant="caption" color="muted">
          Could not load your queue. Please try again.
        </Text>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="py-10 text-center">
        <Text variant="body" weight="bold" color="foreground">
          Nothing assigned to you yet
        </Text>
        <Text variant="caption" color="muted">
          Loads assigned by your regional admin will appear here.
        </Text>
      </section>
    );
  }

  return (
    <section>
      <Text variant="caption" color="muted" weight="normal" className="mb-2">
        Assigned to you - {assignedList.length}
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-[35%_65%] gap-4">
        <AssignedList
          assignedList={assignedList}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
        <SelectedAssignement assignmentId={activeId} />
      </div>
    </section>
  );
};

export default LoadingOfficer;
