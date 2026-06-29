"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import Image, { StaticImageData } from "next/image";

interface Flyer {
  id: string;
  name: string;
  image?: string | StaticImageData;
  imageUrl?: string;
  position?: number;
  sortOrder?: number;
  status?: string;
  isActive?: boolean;
}

interface PreviewFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyer?: Flyer;
  onConfirm?: (flyer: Flyer) => void;
}

export default function PreviewFlyerModal({
  isOpen,
  onClose,
  flyer,
  onConfirm,
}: PreviewFlyerModalProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!flyer) return;
    setIsDeactivating(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setIsDeactivating(false);
        onConfirm?.(flyer);
        onClose();
      }, 500);
    } catch (error) {
      setIsDeactivating(false);
    }
  };

  if (!flyer) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-6 w-full max-w-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <Text variant="h3" weight="bold">
              Deactivate Flyer
            </Text>
            <Text variant="caption" color="muted">
              Flyer details
            </Text>
          </div>
        </div>

        {/* Flyer Image Preview */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
          {(flyer.imageUrl || flyer.image) && (
            <Image
              src={(flyer.imageUrl || flyer.image) as string}
              alt={flyer.name}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Flyer Name */}
        <div>
          <Text variant="body" weight="semibold">
            {flyer.name}
          </Text>
        </div>

        {/* Confirmation Text */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text variant="body" color="muted" className="text-center">
            Are you sure you want to deactivate this flyer?
          </Text>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-muted border border-muted/20"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="bg-orange hover:bg-orange/90"
          >
            {isDeactivating ? "Deactivating..." : "Confirm Deactivate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
