import { Text } from "@/components/common";
import Image from "next/image";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
}

export default function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <Text variant="caption" color="muted">
          {label}
        </Text>

        <Image
          src={icon}
          alt={label}
          width={40}
          height={40}
          className="w-4 h-4"
        />
      </div>
      <Text variant="h3" weight="bold" className="mt-3">
        {value}
      </Text>
    </div>
  );
}
