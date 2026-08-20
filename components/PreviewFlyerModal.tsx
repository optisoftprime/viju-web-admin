"use client";

import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import Image, { StaticImageData } from "next/image";

/**
 * The subset of a flyer this modal renders. Kept looser than the API's
 * `Flyer` so card-shaped objects can be passed straight through.
 */
export interface PreviewFlyer {
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
            <span
              className={`${
                isActive
                  ? "bg-[#D4FFE9] text-[#04B054]"
                  : "bg-[#FFF4E1] text-[#FFA10B]"
              } py-1 px-3 rounded-xl text-[12px] font-semibold inline-block w-max`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
