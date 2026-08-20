"use client";

import { Trash2, Edit } from "lucide-react";
import { Text } from "@/components/common";
import { useState } from "react";
import Image, { StaticImageData } from "next/image";

interface Flyer {
  id: string;
  name: string;
  image?: string | StaticImageData;
  imageUrl?: string;
  position?: number;
  status?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface FlyerCardProps {
  flyer: Flyer;
  onEdit: (flyer: Flyer) => void;
  /** Opens the full, uncropped artwork - the card thumbnail is cropped */
  onPreview?: (flyer: Flyer) => void;
  /** Flips the flyer between active and inactive */
  onToggleActive?: (flyer: Flyer) => void;
  /** True while this flyer's own toggle request is in flight */
  isToggling?: boolean;
  onDelete: (flyer: Flyer) => void;
}

export default function FlyerCard({
  flyer,
  onEdit,
  onPreview,
  onToggleActive,
  isToggling = false,
  onDelete,
}: FlyerCardProps) {
  // A flyer saved before the upload fix may still hold a data URI, and a CDN
  // object can be deleted - either way the card must still render.
  const [imageFailed, setImageFailed] = useState(false);
  const rawUrl = flyer.imageUrl || flyer.image;
  const imageUrl = imageFailed ? null : rawUrl;
  const position = flyer.position || flyer.sortOrder || 0;

  // Treat a missing flag as active, matching how the app renders flyers
  const isActive = flyer.isActive !== false;

  // The button offers the opposite of the current state
  const toggleLabel = isActive ? "Deactivate" : "Activate";
  const togglePendingLabel = isActive ? "Deactivating..." : "Activating...";

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow mb-5">
      {/* Image Container with Position Badge */}
      <div className="relative">
        {/* Click the artwork to see it in full */}
        <button
          type="button"
          onClick={() => onPreview?.(flyer)}
          disabled={!onPreview}
          aria-label={`Preview ${flyer.name}`}
          className="relative block w-full h-64 bg-gray-100 enabled:cursor-pointer group"
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={flyer.name}
              fill
              sizes="100vw"
              className="object-cover transition-transform group-enabled:group-hover:scale-105"
            />
          )}
        </button>

        {/* Position Badge */}
        <div className="absolute top-3 right-3 bg-white rounded-sm w-8 h-8 flex items-center justify-center border border-gray-200 shadow-md">
          <Text variant="small" weight="bold" className="text-muted">
            {position}
          </Text>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Text variant="body" weight="semibold" className="mb-4">
          {flyer.name}
        </Text>

        {/* Actions Container */}
        <div className="flex items-center justify-between">
          {/* Left Actions */}
          <div className="flex items-center gap-3">
            {/* Edit Icon */}
            <button
              onClick={() => onEdit(flyer)}
              className="text-muted hover:text-orange cursor-pointer transition-colors p-1"
              aria-label="Edit flyer"
            >
              <Edit size={18} />
            </button>

            {/* Activate / Deactivate Link - reflects the flyer's current state */}
            {onToggleActive && (
              <button
                onClick={() => onToggleActive(flyer)}
                disabled={isToggling}
                aria-busy={isToggling}
                className="text-muted hover:text-orange/80 cursor-pointer text-sm font-medium underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isToggling ? togglePendingLabel : toggleLabel}
              </button>
            )}
          </div>

          {/* Delete Icon */}
          <button
            onClick={() => onDelete(flyer)}
            className="text-muted hover:text-orange cursor-pointer transition-colors p-1"
            aria-label="Delete flyer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
