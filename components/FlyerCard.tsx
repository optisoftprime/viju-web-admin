"use client";

import { Trash2 } from "lucide-react";
import { Text } from "@/components/common";
import Image, { StaticImageData } from "next/image";

interface Flyer {
  id: string;
  name: string;
  image: string | StaticImageData;
  position: number;
  status?: string;
}

interface FlyerCardProps {
  flyer: Flyer;
  onDeactivate: (flyer: Flyer) => void;
  onDelete: (flyer: Flyer) => void;
}

export default function FlyerCard({
  flyer,
  onDeactivate,
  onDelete,
}: FlyerCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow mb-5">
      {/* Image Container with Position Badge */}
      <div className="relative">
        <div className="relative w-full h-64 bg-gray-100">
          <Image
            src={flyer.image}
            alt={flyer.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Position Badge */}
        <div className="absolute top-3 right-3 bg-white rounded-sm w-8 h-8 flex items-center justify-center border border-gray-200 shadow-md">
          <Text variant="small" weight="bold" className="text-muted">
            {flyer.position}
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
          {/* Deactivate Link */}
          <button
            onClick={() => onDeactivate(flyer)}
            className="text-muted hover:text-orange/80 cursor-pointer text-sm font-medium underline transition-colors"
          >
            Deactivate
          </button>

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
