"use client";

import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import Image, { StaticImageData } from "next/image";
import StatusBadge from "@/components/common/StatusBadge";

/**
 * The subset of a flyer this modal renders. Kept looser than the API's
 * `Flyer` so card-shaped objects can be passed straight through.
 */
export interface PreviewFlyer {
  id: string;
  name: string;
  image?: string | StaticImageData;
  imageUrl?: string;
  /** F-1: the flyer's own copy, shown under the artwork */
  description?: string | null;
  position?: number;
  sortOrder?: number;
  status?: string;
  isActive?: boolean;
}

interface PreviewFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyer?: PreviewFlyer;
}

/**
 * Preview Flyer Modal
 * Shows a flyer's artwork in full, uncropped - the card thumbnail crops to
 * fill its tile, so this is the only place the whole image is visible.
 */
export default function PreviewFlyerModal({
  isOpen,
  onClose,
  flyer,
}: PreviewFlyerModalProps) {
  if (!flyer) return null;

  const imageUrl = flyer.imageUrl || flyer.image;
  const position = flyer.position ?? flyer.sortOrder;
  const isActive = flyer.isActive !== false;
  // Optional - a flyer can be pure artwork, so an empty block is skipped
  // rather than left as a labelled gap
  const description = flyer.description?.trim();

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="pb-3 pr-8 border-b border-muted/20">
          <Text variant="body" weight="bold" color="foreground">
            {flyer.name}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            Flyer preview
          </Text>
        </div>

        {/* Full artwork - object-contain so nothing is cropped away */}
        <div className="relative w-full h-[60vh] rounded-lg overflow-hidden bg-[#F0F5F9]">
          {imageUrl ? (
            <Image
              src={imageUrl as string}
              alt={flyer.name}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              unoptimized={
                typeof imageUrl === "string" && imageUrl.startsWith("data:")
              }
              className="object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Text variant="caption" color="muted">
                No image available
              </Text>
            </div>
          )}
        </div>

        {/* Details - the copy that runs under the artwork in the app */}
        {description && (
          <div>
            <Text variant="small" weight="bold" color="foreground">
              Details
            </Text>
            <Text
              variant="caption"
              weight="medium"
              color="muted"
              className="whitespace-pre-wrap block mt-1"
            >
              {description}
            </Text>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-6">
          {position !== undefined && (
            <div>
              <Text variant="small" weight="bold" color="foreground">
                Position
              </Text>
              <Text variant="caption" weight="medium" color="muted">
                {position}
              </Text>
            </div>
          )}
          <div>
            <Text variant="small" weight="bold" color="foreground">
              Status
            </Text>
            {/* Shared palette - Inactive was amber here, which is the colour
                "pending" wears everywhere else. It is grey now, like every
                other switched-off state. */}
            <StatusBadge status={isActive ? "Active" : "Inactive"} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
