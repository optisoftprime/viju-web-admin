import { Text } from "@/components/common";
import Image from "next/image";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  /**
   * Optional sub-line under the value, e.g. an ERP sync-freshness note.
   * Omitted entirely when not supplied, so existing cards are unchanged.
   */
  caption?: string | null;
}

export default function StatCard({
  icon,
  label,
  value,
  caption,
}: StatCardProps) {
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <Text variant="caption" color="muted">
          {label}
        </Text>

        {icon && (
          <Image
            src={icon}
            alt={label}
            width={40}
            height={40}
            className="w-4 h-4"
          />
        )}
      </div>
      <Text variant="h3" weight="bold" className="mt-3">
        {value}
      </Text>
      {caption ? (
        <Text variant="small" color="muted" className="mt-1 block">
          {caption}
        </Text>
      ) : null}
    </div>
  );
}
