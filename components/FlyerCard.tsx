"use client";

import { Trash2, Edit } from "lucide-react";
import { Text } from "@/components/common";
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
  onDeactivate?: (flyer: Flyer) => void;
  onDelete: (flyer: Flyer) => void;
}

export default function FlyerCard({
  flyer,
  onEdit,
  onDeactivate,
  onDelete,
}: FlyerCardProps) {
  const imageUrl = flyer.imageUrl || flyer.image;
  const position = flyer.position || flyer.sortOrder || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow mb-5">
      {/* Image Container with Position Badge */}
      <div className="relative">
        <div className="relative w-full h-64 bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={flyer.name}
              fill
              className="object-cover"
            />
          )}
        </div>

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

            {/* Deactivate Link (if onDeactivate is provided) */}
            {onDeactivate && (
              <button
                onClick={() => onDeactivate(flyer)}
                className="text-muted hover:text-orange/80 cursor-pointer text-sm font-medium underline transition-colors"
              >
                Deactivate
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
