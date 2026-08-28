"use client";

import { Modal } from "@/components/common/Modal";
import AllCustomersTable from "@/components/AllCustomersTable";
import { BroadcastRegion } from "@/lib/api/types";

interface AllCustomersModalProps {
  open: boolean;
  onClose: () => void;
  region?: BroadcastRegion;
}

/**
 * The account officer's "My Customers" dialog.
 *
 * Spec 42 moved the ADMIN and REGIONAL ADMIN onto `/customers` - a full page,
 * because a 200-row table with its own search and pagination was never really
 * a dialog. The officer's list is small enough that a dialog still suits it,
 * and their tile is not what the spec asked to change.
 *
 * Everything inside is `AllCustomersTable`, shared with that page, so the two
 * cannot drift apart. Queries are gated on `open`, so a closed dialog holds
 * no request open.
 */
export default function AllCustomersModal({
  open,
  onClose,
  region,
}: AllCustomersModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <AllCustomersTable enabled={open} region={region} variant="modal" />
    </Modal>
  );
}
